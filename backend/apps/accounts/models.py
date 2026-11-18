"""
Accounts models: Custom User, UserProfile, UserRole, LoginSession, and OTPRecord.
"""
import uuid
import hashlib
from typing import Optional
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from common.models import BaseModel
from common.constants.choices import Role, OTPPurpose
from common.validators.phone_validator import validate_indian_phone


class UserManager(BaseUserManager):
    """Custom manager for PropVault User model."""

    def create_user(
        self,
        email: str,
        phone: str,
        name: str,
        password: Optional[str] = None,
        **extra_fields
    ) -> 'User':
        if not email:
            raise ValueError('Email address is required.')
        if not phone:
            raise ValueError('Phone number is required.')

        email = self.normalize_email(email).lower()
        phone = validate_indian_phone(phone)
        
        user = self.model(
            email=email,
            phone=phone,
            name=name.strip(),
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        phone: str,
        name: str,
        password: Optional[str] = None,
        **extra_fields
    ) -> 'User':
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        user = self.create_user(email, phone, name, password, **extra_fields)
        # Assign ADMIN role
        UserRole.objects.get_or_create(user=user, role=Role.ADMIN, is_active=True)
        return user


class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    Custom user model for PropVault.
    Identified primarily by email and phone.
    """
    email = models.EmailField(
        unique=True,
        max_length=255,
        db_index=True,
        help_text="User's primary email address"
    )
    phone = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="User's normalized E.164 mobile number (+91XXXXXXXXXX)"
    )
    name = models.CharField(
        max_length=150,
        help_text="Full legal name of the user"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Designates whether this user account is active"
    )
    is_staff = models.BooleanField(
        default=False,
        help_text="Designates whether the user can log into the admin site"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Designates whether phone/email verification has completed"
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone', 'name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.name} ({self.email})"

    def has_role(self, role_name: str) -> bool:
        """Check if user has an active assigned role."""
        if self.is_superuser:
            return True
        return self.user_roles.filter(role=role_name, is_active=True).exists()

    @property
    def roles_list(self) -> list[str]:
        """Return list of active role codes."""
        return list(self.user_roles.filter(is_active=True).values_list('role', flat=True))


class UserProfile(BaseModel):
    """
    Extended user profile containing avatar, bio, and postal address.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        help_text="Associated user account"
    )
    avatar = models.ImageField(
        upload_to='avatars/%Y/%m/',
        null=True,
        blank=True,
        help_text="User profile display picture"
    )
    bio = models.TextField(
        blank=True,
        default='',
        help_text="Short bio / introduction"
    )
    city = models.CharField(
        max_length=100,
        default='Indore',
        help_text="Operating city"
    )
    state = models.CharField(
        max_length=100,
        default='Madhya Pradesh',
        help_text="Operating state"
    )
    address = models.TextField(
        blank=True,
        default='',
        help_text="Detailed address"
    )

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self) -> str:
        return f"Profile of {self.user.name}"


class UserRole(BaseModel):
    """
    Many-to-Many through table mapping users to roles.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_roles',
        help_text="User possessing the role"
    )
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        db_index=True,
        help_text="Assigned platform role"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this role is active"
    )
    assigned_at = models.DateTimeField(
        default=timezone.now,
        help_text="Timestamp when the role was granted"
    )

    class Meta:
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'
        unique_together = ('user', 'role')

    def __str__(self) -> str:
        return f"{self.user.email} -> {self.role}"


class LoginSession(BaseModel):
    """
    Tracks active user JWT sessions with JTI blacklist capability.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='login_sessions',
        help_text="User who initiated this session"
    )
    token_jti = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Unique JWT token identifier (jti)"
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Client IP address"
    )
    user_agent = models.TextField(
        blank=True,
        default='',
        help_text="Client User-Agent header"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Session validity status"
    )
    expires_at = models.DateTimeField(
        help_text="Session expiration timestamp"
    )

    class Meta:
        verbose_name = 'Login Session'
        verbose_name_plural = 'Login Sessions'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Session for {self.user.email} ({'Active' if self.is_active else 'Revoked'})"


class OTPRecord(BaseModel):
    """
    Stores cryptographically hashed OTPs for registration, login, and password resets.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='otp_records',
        help_text="User associated with this OTP"
    )
    otp_hash = models.CharField(
        max_length=128,
        help_text="SHA-256 hashed 6-digit OTP code"
    )
    purpose = models.CharField(
        max_length=30,
        choices=OTPPurpose.choices,
        db_index=True,
        help_text="Purpose of OTP issuance"
    )
    expires_at = models.DateTimeField(
        help_text="OTP expiration time"
    )
    is_used = models.BooleanField(
        default=False,
        help_text="Whether this OTP has already been redeemed"
    )
    attempts = models.PositiveIntegerField(
        default=0,
        help_text="Count of failed validation attempts"
    )

    class Meta:
        verbose_name = 'OTP Record'
        verbose_name_plural = 'OTP Records'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"OTP ({self.purpose}) for {self.user.email} - Used: {self.is_used}"

    @staticmethod
    def hash_otp(raw_otp: str) -> str:
        """Hash raw OTP string with SHA-256."""
        return hashlib.sha256(raw_otp.encode('utf-8')).hexdigest()

    def check_otp(self, raw_otp: str) -> bool:
        """Validate raw OTP against stored hash."""
        return self.otp_hash == self.hash_otp(raw_otp)

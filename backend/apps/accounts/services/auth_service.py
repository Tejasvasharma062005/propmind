"""
Authentication and account lifecycle service.
"""
import random
import logging
from datetime import timedelta
from typing import Any, Optional
import uuid

from django.utils import timezone
from django.db import transaction
from django.conf import settings
from django.core.mail import send_mail
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.models import User, UserProfile, UserRole, LoginSession, OTPRecord
from common.constants.choices import Role, OTPPurpose
from common.exceptions import ValidationError, BusinessRuleViolation, NotFound
from common.validators.phone_validator import validate_indian_phone

logger = logging.getLogger(__name__)


class AuthService:
    """
    Handles authentication, registration, OTP lifecycle, JWT generation,
    and session revocation.
    """

    @classmethod
    def generate_otp(cls) -> str:
        """Generates a secure 6-digit random OTP."""
        return f"{random.randint(100000, 999999)}"

    @classmethod
    def create_otp_record(cls, user: User, purpose: str) -> str:
        """
        Invalidates previous pending OTPs of the same purpose and creates a new one.
        Returns the raw 6-digit OTP string.
        """
        raw_otp = cls.generate_otp()
        expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)

        # Invalidate previous unused OTPs for this user and purpose
        OTPRecord.objects.filter(
            user=user,
            purpose=purpose,
            is_used=False
        ).update(is_used=True)

        OTPRecord.objects.create(
            user=user,
            otp_hash=OTPRecord.hash_otp(raw_otp),
            purpose=purpose,
            expires_at=expires_at,
            is_used=False
        )

        logger.info(f"[OTP ISSUED] Purpose={purpose} for User={user.email} -> OTP={raw_otp} (Valid {expiry_minutes} mins)")

        # Dispatch OTP email via configured EMAIL_BACKEND (SMTP in production / when configured, console in dev)
        purpose_label = "Account Registration" if purpose == OTPPurpose.REGISTRATION else "Password Reset"
        subject = f"PropMind Verification Code: {raw_otp} ({purpose_label})"
        message = (
            f"Hello {user.name},\n\n"
            f"Your 6-digit verification code for PropMind: AI-Powered Property Passport for Real Estate ({purpose_label}) is:\n\n"
            f"    {raw_otp}\n\n"
            f"This code is valid for {expiry_minutes} minutes. Do not share this code with anyone.\n\n"
            f"Regards,\n"
            f"PropMind: AI-Powered Property Passport for Real Estate (Indore, MP)"
        )
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@propvault.in'),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as exc:
            logger.warning(f"Failed to send OTP email to {user.email} via {settings.EMAIL_BACKEND}: {exc}")

        return raw_otp

    @classmethod
    @transaction.atomic
    def register_user(
        cls,
        email: str,
        phone: str,
        name: str,
        password: str,
        roles: Optional[list[str]] = None
    ) -> dict[str, Any]:
        """
        Registers a new user (or updates an existing unverified account), sets up profile
        and initial roles, and dispatches registration OTP.
        """
        email = email.strip().lower()
        normalized_phone = validate_indian_phone(phone)

        existing_by_email = User.objects.filter(email=email).first()
        existing_by_phone = User.objects.filter(phone=normalized_phone).first()

        if existing_by_email and existing_by_email.is_verified:
            raise ValidationError("A verified account with this email address already exists. Please sign in.")
        if existing_by_phone and existing_by_phone.is_verified:
            raise ValidationError("A verified account with this mobile number already exists. Please sign in.")

        # If an unverified user already exists (e.g. user re-submitted registration before completing OTP)
        user = existing_by_email or existing_by_phone
        if user:
            # If email and phone belong to two different unverified rows, remove the stale phone row
            if existing_by_email and existing_by_phone and existing_by_email.id != existing_by_phone.id:
                existing_by_phone.delete()
                user = existing_by_email
            user.email = email
            user.phone = normalized_phone
            user.name = name
            user.set_password(password)
            user.save()
            UserProfile.objects.get_or_create(user=user)
            assigned_roles = roles if roles else [Role.BUYER]
            user.user_roles.all().delete()
            for role_val in set(assigned_roles):
                UserRole.objects.create(user=user, role=role_val, is_active=True)
        else:
            user = User.objects.create_user(
                email=email,
                phone=normalized_phone,
                name=name,
                password=password,
                is_verified=False
            )
            # Create Profile
            UserProfile.objects.create(user=user)
            # Assign Roles
            assigned_roles = roles if roles else [Role.BUYER]
            for role_val in set(assigned_roles):
                UserRole.objects.create(user=user, role=role_val, is_active=True)

        # Generate and dispatch verification OTP
        raw_otp = cls.create_otp_record(user, OTPPurpose.REGISTRATION)

        smtp_configured = bool(
            getattr(settings, 'EMAIL_HOST_USER', '') and getattr(settings, 'EMAIL_HOST_PASSWORD', '')
        )

        return {
            "user": user,
            "user_id": str(user.id),
            "email": user.email,
            "phone": user.phone,
            "smtp_configured": smtp_configured,
            "message": "User registered successfully. Please verify your OTP to activate account.",
            "dev_otp": raw_otp if settings.DEBUG else None
        }

    @classmethod
    @transaction.atomic
    def resend_otp(
        cls,
        user_id: Optional[str | uuid.UUID] = None,
        email: Optional[str] = None,
        purpose: str = OTPPurpose.REGISTRATION,
    ) -> dict[str, Any]:
        """
        Generates and dispatches a fresh 6-digit OTP for an existing user.
        """
        user: Optional[User] = None
        if user_id:
            user = User.objects.filter(id=user_id).first()
        if not user and email:
            user = User.objects.filter(email=email.strip().lower()).first()
        if not user:
            raise NotFound("User account not found.")

        raw_otp = cls.create_otp_record(user, purpose)
        smtp_configured = bool(
            getattr(settings, 'EMAIL_HOST_USER', '') and getattr(settings, 'EMAIL_HOST_PASSWORD', '')
        )
        return {
            "user_id": str(user.id),
            "email": user.email,
            "smtp_configured": smtp_configured,
            "message": "A new 6-digit verification code has been generated.",
            "dev_otp": raw_otp if settings.DEBUG else None,
        }

    @classmethod
    @transaction.atomic
    def verify_otp(
        cls,
        user_id: str | uuid.UUID,
        otp: str,
        purpose: str = OTPPurpose.REGISTRATION
    ) -> dict[str, Any]:
        """
        Validates OTP code for given user and purpose.
        If registration, marks user as verified and issues JWT tokens.
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("User account not found.")

        otp_record = OTPRecord.objects.filter(
            user=user,
            purpose=purpose,
            is_used=False
        ).order_by('-created_at').first()

        if not otp_record:
            raise ValidationError("No active OTP found. Please request a new code.")

        max_attempts = getattr(settings, 'OTP_MAX_ATTEMPTS', 3)
        if otp_record.attempts >= max_attempts:
            otp_record.is_used = True
            otp_record.save(update_fields=['is_used'])
            raise BusinessRuleViolation("Maximum OTP verification attempts exceeded. Please request a new code.")

        if timezone.now() > otp_record.expires_at:
            otp_record.is_used = True
            otp_record.save(update_fields=['is_used'])
            raise ValidationError("OTP has expired. Please request a new code.")

        if not otp_record.check_otp(otp):
            otp_record.attempts += 1
            otp_record.save(update_fields=['attempts'])
            remaining = max_attempts - otp_record.attempts
            raise ValidationError(f"Invalid OTP entered. {remaining} attempt(s) remaining.")

        # Mark OTP as successfully used
        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])

        # If registration OTP, activate and verify user
        if purpose == OTPPurpose.REGISTRATION:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        # Generate JWT Tokens
        tokens = cls.generate_tokens_for_user(user)

        return {
            "user": user,
            "tokens": tokens,
            "is_verified": user.is_verified,
            "message": "OTP verified successfully."
        }

    @classmethod
    def generate_tokens_for_user(cls, user: User, ip_address: Optional[str] = None, user_agent: str = '') -> dict[str, Any]:
        """
        Generates SimpleJWT access & refresh tokens and stores active login session.
        """
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        # Custom claims
        access_token['email'] = user.email
        access_token['name'] = user.name
        access_token['roles'] = user.roles_list
        access_token['is_verified'] = user.is_verified

        jti = str(refresh.payload.get('jti', uuid.uuid4()))
        expires_at = timezone.now() + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']

        LoginSession.objects.create(
            user=user,
            token_jti=jti,
            ip_address=ip_address,
            user_agent=user_agent,
            is_active=True,
            expires_at=expires_at
        )

        return {
            "access": str(access_token),
            "refresh": str(refresh),
            "token_type": "Bearer",
            "expires_in": int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
        }

    @classmethod
    def login_user(
        cls,
        email_or_phone: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: str = ''
    ) -> dict[str, Any]:
        """
        Authenticates user with email or phone + password.
        Returns JWT tokens and user profile.
        """
        identifier = email_or_phone.strip()
        user: Optional[User] = None

        if '@' in identifier:
            user = User.objects.filter(email=identifier.lower()).first()
        else:
            try:
                normalized_phone = validate_indian_phone(identifier)
                user = User.objects.filter(phone=normalized_phone).first()
            except Exception:
                user = User.objects.filter(phone=identifier).first()

        if not user or not user.check_password(password):
            raise ValidationError("Invalid email/phone or password credentials.")

        if not user.is_active:
            raise BusinessRuleViolation("This account has been deactivated. Please contact support.")

        tokens = cls.generate_tokens_for_user(user, ip_address=ip_address, user_agent=user_agent)

        return {
            "user": user,
            "tokens": tokens,
            "message": "Login successful."
        }

    @classmethod
    def refresh_token(cls, refresh_token_str: str) -> dict[str, Any]:
        """
        Rotates refresh token and yields new access token.
        """
        try:
            refresh = RefreshToken(refresh_token_str)
            data = {
                "access": str(refresh.access_token),
                "expires_in": int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
            }
            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
                refresh.set_jti()
                refresh.set_exp()
                data["refresh"] = str(refresh)
            return data
        except TokenError as e:
            raise ValidationError(f"Invalid or expired refresh token: {str(e)}")

    @classmethod
    def logout_user(
        cls,
        user_id: Optional[uuid.UUID] = None,
        token_jti: Optional[str] = None,
        refresh_token_str: Optional[str] = None
    ) -> bool:
        """
        Deactivates active login session and blacklists refresh token.
        """
        if refresh_token_str:
            try:
                token = RefreshToken(refresh_token_str)
                token.blacklist()
                jti = token.payload.get('jti')
                if jti:
                    LoginSession.objects.filter(token_jti=jti).update(is_active=False)
            except Exception as e:
                logger.warning(f"Error blacklisting refresh token: {e}")

        if token_jti:
            LoginSession.objects.filter(token_jti=token_jti).update(is_active=False)

        if user_id and not token_jti and not refresh_token_str:
            # Invalidate all user sessions
            LoginSession.objects.filter(user_id=user_id).update(is_active=False)

        return True

    @classmethod
    def request_password_reset(cls, email_or_phone: str) -> dict[str, Any]:
        """
        Initiates password reset flow by issuing reset OTP.
        """
        identifier = email_or_phone.strip()
        user = None

        if '@' in identifier:
            user = User.objects.filter(email=identifier.lower()).first()
        else:
            try:
                normalized_phone = validate_indian_phone(identifier)
                user = User.objects.filter(phone=normalized_phone).first()
            except Exception:
                user = User.objects.filter(phone=identifier).first()

        if not user:
            # Prevent email enumeration by returning uniform success message
            return {
                "message": "If an account matches the provided details, an OTP has been sent."
            }

        raw_otp = cls.create_otp_record(user, OTPPurpose.RESET_PASSWORD)

        return {
            "user_id": str(user.id),
            "message": "If an account matches the provided details, an OTP has been sent.",
            "dev_otp": raw_otp if settings.DEBUG else None
        }

    @classmethod
    @transaction.atomic
    def reset_password(
        cls,
        user_id: str | uuid.UUID,
        otp: str,
        new_password: str
    ) -> dict[str, Any]:
        """
        Confirms OTP and updates password.
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("User account not found.")

        otp_record = OTPRecord.objects.filter(
            user=user,
            purpose=OTPPurpose.RESET_PASSWORD,
            is_used=False
        ).order_by('-created_at').first()

        if not otp_record:
            raise ValidationError("No active password reset request found. Please request a new OTP.")

        if timezone.now() > otp_record.expires_at:
            otp_record.is_used = True
            otp_record.save(update_fields=['is_used'])
            raise ValidationError("Password reset OTP has expired.")

        if not otp_record.check_otp(otp):
            otp_record.attempts += 1
            otp_record.save(update_fields=['attempts'])
            raise ValidationError("Invalid OTP code provided.")

        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])

        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Invalidate all prior login sessions for security
        LoginSession.objects.filter(user=user).update(is_active=False)

        return {
            "message": "Password has been successfully reset. Please log in with your new password."
        }

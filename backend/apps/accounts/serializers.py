"""
Serializers for accounts and authentication endpoints.
"""
from typing import Any
from rest_framework import serializers
from apps.accounts.models import User, UserProfile, UserRole
from common.constants.choices import Role, OTPPurpose
from common.validators.phone_validator import validate_indian_phone


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile details."""
    class Meta:
        model = UserProfile
        fields = ['id', 'avatar', 'bio', 'city', 'state', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for assigned user roles."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = UserRole
        fields = ['role', 'role_display', 'is_active', 'assigned_at']


class UserSerializer(serializers.ModelSerializer):
    """Complete user serializer with profile and role details."""
    profile = UserProfileSerializer(read_only=True)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'name',
            'is_active',
            'is_staff',
            'is_verified',
            'roles',
            'profile',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'is_active', 'is_staff', 'is_verified', 'created_at', 'updated_at']

    def get_roles(self, obj: User) -> list[str]:
        return obj.roles_list


class RegisterSerializer(serializers.Serializer):
    """Input serializer for new user registration."""
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=Role.choices),
        required=False,
        default=[Role.BUYER]
    )

    def validate_phone(self, value: str) -> str:
        return validate_indian_phone(value)

    def validate_email(self, value: str) -> str:
        normalized = value.strip().lower()
        if User.objects.filter(email=normalized, is_verified=True).exists():
            raise serializers.ValidationError("A verified account with this email already exists. Please sign in instead.")
        return normalized


class ResendOTPSerializer(serializers.Serializer):
    """Input serializer for resending OTP verification code."""
    user_id = serializers.UUIDField(required=False)
    email = serializers.EmailField(required=False)
    purpose = serializers.ChoiceField(
        choices=OTPPurpose.choices,
        default=OTPPurpose.REGISTRATION
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs.get('user_id') and not attrs.get('email'):
            raise serializers.ValidationError("Either user_id or email is required to resend an OTP.")
        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    """Input serializer for OTP verification."""
    user_id = serializers.UUIDField()
    otp = serializers.CharField(min_length=6, max_length=6)
    purpose = serializers.ChoiceField(
        choices=OTPPurpose.choices,
        default=OTPPurpose.REGISTRATION
    )


class LoginSerializer(serializers.Serializer):
    """Input serializer for user login."""
    email_or_phone = serializers.CharField()
    password = serializers.CharField(write_only=True)


class TokenRefreshSerializer(serializers.Serializer):
    """Input serializer for JWT refresh."""
    refresh = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    """Input serializer for user logout."""
    refresh = serializers.CharField(required=False, allow_blank=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    """Input serializer to request password reset OTP."""
    email_or_phone = serializers.CharField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Input serializer to confirm password reset."""
    user_id = serializers.UUIDField()
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)

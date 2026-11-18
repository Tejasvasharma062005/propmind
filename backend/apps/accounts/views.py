"""
Authentication API Views implementing standard PropVault response structure,
rate limiting, and immutable audit logging.
"""
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.accounts.serializers import (
    RegisterSerializer,
    ResendOTPSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
    TokenRefreshSerializer,
    LogoutSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserSerializer,
)
from apps.accounts.services.auth_service import AuthService
from common.services.audit_service import AuditService
from common.utils.response import success_response, error_response


class RegisterView(APIView):
    """
    Registers a new platform user and returns registration status.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_register'

    @extend_schema(
        request=RegisterSerializer,
        responses={201: OpenApiResponse(description="User registered successfully")},
        summary="Register new user"
    )
    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Registration validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        result = AuthService.register_user(
            email=data['email'],
            phone=data['phone'],
            name=data['name'],
            password=data['password'],
            roles=data.get('roles')
        )

        user_obj = result['user']
        user_data = UserSerializer(user_obj).data
        response_data: dict = {
            "user": user_data,
            "user_id": str(user_obj.id),
            "smtp_configured": result.get('smtp_configured', False),
        }
        if settings.DEBUG:
            response_data["dev_otp"] = result.get('dev_otp')

        AuditService.log(
            action='USER_REGISTERED',
            target_type='User',
            target_id=user_obj.id,
            actor=user_obj,
            request=request,
            metadata={'email': user_obj.email, 'roles': data.get('roles', [])},
        )

        return success_response(
            data=response_data,
            message=result['message'],
            status_code=status.HTTP_201_CREATED
        )


class VerifyOTPView(APIView):
    """
    Verifies 6-digit OTP code and activates user account with JWT tokens.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_otp'

    @extend_schema(
        request=VerifyOTPSerializer,
        responses={200: OpenApiResponse(description="OTP verified successfully")},
        summary="Verify OTP"
    )
    def post(self, request: Request) -> Response:
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid OTP submission.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        result = AuthService.verify_otp(
            user_id=data['user_id'],
            otp=data['otp'],
            purpose=data['purpose']
        )

        user_obj = result['user']
        AuditService.log(
            action='OTP_VERIFIED',
            target_type='User',
            target_id=user_obj.id,
            actor=user_obj,
            request=request,
            metadata={'purpose': data['purpose']},
        )

        response_data = {
            "user": UserSerializer(user_obj).data,
            "tokens": result['tokens'],
            "is_verified": result['is_verified']
        }
        return success_response(
            data=response_data,
            message=result['message']
        )


class ResendOTPView(APIView):
    """
    Resends a fresh 6-digit OTP verification code to an existing user.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_otp'

    @extend_schema(
        request=ResendOTPSerializer,
        responses={200: OpenApiResponse(description="OTP resent successfully")},
        summary="Resend OTP"
    )
    def post(self, request: Request) -> Response:
        serializer = ResendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid resend OTP request.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        result = AuthService.resend_otp(
            user_id=data.get('user_id'),
            email=data.get('email'),
            purpose=data['purpose'],
        )
        response_data = dict(result)
        if not settings.DEBUG:
            response_data.pop('dev_otp', None)
        return success_response(
            data=response_data,
            message=result['message']
        )


class LoginView(APIView):
    """
    Authenticates user with email or phone and password, returning JWT tokens.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'

    @extend_schema(
        request=LoginSerializer,
        responses={200: OpenApiResponse(description="Login successful")},
        summary="User Login"
    )
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid login request.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        ip_addr = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        result = AuthService.login_user(
            email_or_phone=data['email_or_phone'],
            password=data['password'],
            ip_address=ip_addr,
            user_agent=user_agent
        )

        user_obj = result['user']
        AuditService.log(
            action='USER_LOGIN',
            target_type='User',
            target_id=user_obj.id,
            actor=user_obj,
            request=request,
        )

        response_data = {
            "user": UserSerializer(user_obj).data,
            "tokens": result['tokens']
        }
        return success_response(
            data=response_data,
            message=result['message']
        )


class TokenRefreshView(APIView):
    """
    Refreshes access token with valid refresh token.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=TokenRefreshSerializer,
        responses={200: OpenApiResponse(description="Tokens refreshed")},
        summary="Refresh JWT Token"
    )
    def post(self, request: Request) -> Response:
        serializer = TokenRefreshSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid token refresh payload.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        tokens = AuthService.refresh_token(serializer.validated_data['refresh'])
        return success_response(
            data=tokens,
            message="Token refreshed successfully."
        )


class LogoutView(APIView):
    """
    Terminates user session and blacklists the refresh token.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=LogoutSerializer,
        responses={200: OpenApiResponse(description="Logged out successfully")},
        summary="Logout User"
    )
    def post(self, request: Request) -> Response:
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid()
        refresh_token = serializer.validated_data.get('refresh')

        AuthService.logout_user(
            user_id=request.user.id,
            refresh_token_str=refresh_token
        )
        AuditService.log(
            action='USER_LOGOUT',
            target_type='User',
            target_id=request.user.id,
            actor=request.user,
            request=request,
        )
        return success_response(
            message="User logged out successfully."
        )


class RequestPasswordResetView(APIView):
    """
    Requests a 6-digit OTP for password reset.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_otp'

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={200: OpenApiResponse(description="Reset OTP dispatched")},
        summary="Request Password Reset OTP"
    )
    def post(self, request: Request) -> Response:
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid request.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        result = AuthService.request_password_reset(serializer.validated_data['email_or_phone'])
        data = dict(result)
        if not settings.DEBUG:
            data.pop('dev_otp', None)
        return success_response(
            data=data,
            message=result['message']
        )


class ResetPasswordView(APIView):
    """
    Validates reset OTP and establishes new password.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_otp'

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={200: OpenApiResponse(description="Password reset successfully")},
        summary="Reset Password with OTP"
    )
    def post(self, request: Request) -> Response:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid password reset parameters.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        result = AuthService.reset_password(
            user_id=data['user_id'],
            otp=data['otp'],
            new_password=data['new_password']
        )
        AuditService.log(
            action='PASSWORD_RESET_COMPLETED',
            target_type='User',
            target_id=data['user_id'],
            request=request,
        )
        return success_response(
            message=result['message']
        )

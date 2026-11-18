"""
Authentication URL routing.
"""
from django.urls import path
from apps.accounts.views import (
    RegisterView,
    ResendOTPView,
    VerifyOTPView,
    LoginView,
    TokenRefreshView,
    LogoutView,
    RequestPasswordResetView,
    ResetPasswordView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]

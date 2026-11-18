"""
Query selectors for accounts app to separate database reads from mutations.
"""
from typing import Optional
import uuid
from django.db.models import QuerySet
from apps.accounts.models import User, LoginSession


def get_user_by_id(user_id: str | uuid.UUID) -> Optional[User]:
    """Retrieve user by UUID with related profile and roles pre-fetched."""
    return (
        User.objects.filter(id=user_id)
        .select_related('profile')
        .prefetch_related('user_roles')
        .first()
    )


def get_user_by_email(email: str) -> Optional[User]:
    """Retrieve user by email."""
    return (
        User.objects.filter(email=email.strip().lower())
        .select_related('profile')
        .prefetch_related('user_roles')
        .first()
    )


def get_active_sessions_for_user(user: User) -> QuerySet[LoginSession]:
    """List all active login sessions for a user."""
    return LoginSession.objects.filter(user=user, is_active=True).order_by('-created_at')

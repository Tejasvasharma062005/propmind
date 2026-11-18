"""
Selectors for users domain.
"""
from typing import Optional
import uuid
from apps.accounts.models import User
from apps.users.models import KYCRecord


def get_user_detail(user_id: str | uuid.UUID) -> Optional[User]:
    """Retrieve full user profile with related records."""
    return (
        User.objects.filter(id=user_id)
        .select_related('profile', 'professional_profile')
        .prefetch_related('user_roles', 'kyc_records')
        .first()
    )


def get_user_kyc_status(user: User) -> Optional[KYCRecord]:
    """Get the latest KYC record for a user."""
    return user.kyc_records.order_by('-created_at').first()

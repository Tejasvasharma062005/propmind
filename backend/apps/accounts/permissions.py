"""
Accounts app permissions.
"""
from common.permissions.base_permissions import IsOwner, IsAdmin, IsVerifiedUser, HasRole

__all__ = ['IsOwner', 'IsAdmin', 'IsVerifiedUser', 'HasRole']

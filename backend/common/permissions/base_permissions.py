"""
Base permissions and role verification classes for PropVault.
"""
from typing import Any, Sequence
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView
from common.constants.choices import Role


class IsAdmin(BasePermission):
    """Allows access only to platform admin staff or users with ADMIN role."""
    def has_permission(self, request: Request, view: APIView) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or getattr(user, 'is_superuser', False):
            return True
        return hasattr(user, 'has_role') and user.has_role(Role.ADMIN)


class IsVerifiedUser(BasePermission):
    """Allows access only to authenticated users who have completed phone/email verification."""
    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_verified', False))


class IsOwner(BasePermission):
    """
    Object-level permission allowing only the owner of an object to access or edit it.
    Expects object to have `user`, `owner`, or `created_by` attribute.
    """
    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Staff and admins have full access
        if request.user.is_staff or (hasattr(request.user, 'has_role') and request.user.has_role(Role.ADMIN)):
            return True

        if hasattr(obj, 'created_by_id'):
            return obj.created_by_id == request.user.id
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        if hasattr(obj, 'user_id'):
            return obj.user_id == request.user.id
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return False


def HasRole(*required_roles: Sequence[str]) -> type[BasePermission]:
    """
    Factory creating a permission class requiring the user to have at least one of the specified roles.
    Usage: permission_classes = [HasRole(Role.AGENT, Role.BUILDER)]
    """
    class _RolePermission(BasePermission):
        message = f"User requires one of the following roles: {', '.join(required_roles)}"

        def has_permission(self, request: Request, view: APIView) -> bool:
            user = request.user
            if not user or not user.is_authenticated:
                return False
            if user.is_staff:
                return True
            if hasattr(user, 'has_role'):
                return any(user.has_role(role) for role in required_roles)
            return False

    return _RolePermission


# Convenience role permissions
IsAgent = HasRole(Role.AGENT)
IsAdvocate = HasRole(Role.ADVOCATE)
IsBuilder = HasRole(Role.BUILDER)
IsVerifier = HasRole(Role.VERIFIER)
IsNegotiator = HasRole(Role.NEGOTIATOR)

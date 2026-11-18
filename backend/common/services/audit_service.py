"""
Platform-wide immutable audit logging service.
"""
from typing import Any, Optional
from common.models import AuditLog


class AuditService:
    @classmethod
    def log(
        cls,
        *,
        action: str,
        target_type: str,
        target_id: Any,
        actor: Any = None,
        request: Any = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> AuditLog:
        user = actor
        ip_address = None
        user_agent = ''

        if request is not None:
            if user is None and hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
                user = request.user
            xff = request.META.get('HTTP_X_FORWARDED_FOR')
            ip_address = xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')
            user_agent = (request.META.get('HTTP_USER_AGENT') or '')[:500]

        actor_obj = user if (user is not None and getattr(user, 'is_authenticated', False)) else None
        actor_email = getattr(actor_obj, 'email', '') if actor_obj else 'SYSTEM'

        return AuditLog.objects.create(
            actor=actor_obj,
            actor_email=actor_email,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=metadata or {},
        )

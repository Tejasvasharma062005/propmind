"""
Base abstract model and soft delete managers for all PropVault models.
"""
import uuid
from typing import Any
from django.db import models
from django.utils import timezone


class NonDeletedManager(models.Manager):
    """Queryset manager filtering out soft-deleted records by default."""
    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Queryset manager including soft-deleted records."""
    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset()


class BaseModel(models.Model):
    """
    Abstract base model providing UUID primary keys, timestamp tracking,
    and soft-delete functionality across all platform models.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier (UUID v4)"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when record was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when record was last updated"
    )
    is_deleted = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Soft deletion flag"
    )

    # Managers
    objects = NonDeletedManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def delete(self, using: Any = None, keep_parents: bool = False) -> tuple[int, dict[str, int]]:
        """Perform soft delete by marking is_deleted=True."""
        self.is_deleted = True
        self.save(update_fields=['is_deleted', 'updated_at'])
        return 1, {self._meta.label: 1}

    def hard_delete(self, using: Any = None, keep_parents: bool = False) -> tuple[int, dict[str, int]]:
        """Perform actual database hard deletion."""
        return super().delete(using=using, keep_parents=keep_parents)

    def restore(self) -> None:
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.save(update_fields=['is_deleted', 'updated_at'])



class AuditLog(models.Model):
    """
    Immutable append-only audit trail recording privileged and security-sensitive
    actions across all platform modules.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="User who performed the action",
    )
    actor_email = models.CharField(max_length=255, blank=True, default='')
    action = models.CharField(max_length=100, db_index=True)
    target_type = models.CharField(max_length=100, db_index=True)
    target_id = models.CharField(max_length=100, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True, default='')
    metadata_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self) -> str:
        return f"[{self.created_at}] {self.actor_email or 'SYSTEM'} -> {self.action} ({self.target_type}:{self.target_id})"

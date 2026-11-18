"""
Discovery and favorites models.
"""
from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.properties.models import Property


class SavedSearch(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_searches'
    )
    title = models.CharField(max_length=150)
    filters_json = models.JSONField(default=dict)
    notify_email = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Saved Search'
        verbose_name_plural = 'Saved Searches'

    def __str__(self) -> str:
        return f"{self.user.email} - {self.title}"


class UserFavorite(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'User Favorite'
        verbose_name_plural = 'User Favorites'
        unique_together = ('user', 'property')

    def __str__(self) -> str:
        return f"{self.user.email} -> {self.property.title}"

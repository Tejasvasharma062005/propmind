"""
Site Visits models.
"""
from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.properties.models import Property
from common.constants.choices import VisitStatus


class SiteVisit(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='visits'
    )
    visitor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='booked_visits'
    )
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hosted_visits'
    )
    scheduled_at = models.DateTimeField()
    status = models.CharField(
        max_length=30,
        choices=VisitStatus.choices,
        default=VisitStatus.SCHEDULED,
        db_index=True
    )
    visitor_notes = models.TextField(blank=True, default='')
    feedback_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback_comments = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Site Visit'
        verbose_name_plural = 'Site Visits'
        ordering = ['-scheduled_at']

    def __str__(self) -> str:
        return f"Visit to {self.property.title} by {self.visitor.name} ({self.status})"

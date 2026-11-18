"""
Leads & CRM models: Lead and LeadInteraction.
"""
from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.properties.models import Property
from common.constants.choices import LeadStatus


class Lead(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='leads',
        null=True,
        blank=True
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_leads'
    )
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_leads'
    )
    status = models.CharField(
        max_length=30,
        choices=LeadStatus.choices,
        default=LeadStatus.NEW,
        db_index=True
    )
    source = models.CharField(
        max_length=100,
        default='WEBSITE'
    )
    inquiry_message = models.TextField()
    budget_min = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True
    )
    budget_max = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True
    )
    next_follow_up_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Lead'
        verbose_name_plural = 'Leads'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Lead from {self.buyer.name} ({self.status})"


class LeadInteraction(BaseModel):
    """
    CRM follow-up interaction log (calls, meetings, notes, WhatsApp/email updates).
    """
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name='interactions',
    )
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='logged_lead_interactions',
    )
    interaction_type = models.CharField(
        max_length=30,
        choices=[
            ('CALL', 'Phone Call'),
            ('MEETING', 'In-Person Meeting'),
            ('WHATSAPP', 'WhatsApp Follow-up'),
            ('EMAIL', 'Email Follow-up'),
            ('NOTE', 'Internal CRM Note'),
        ],
        default='NOTE',
    )
    summary = models.TextField()
    next_follow_up_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Lead Interaction'
        verbose_name_plural = 'Lead Interactions'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.interaction_type} on Lead {self.lead_id} by {self.logged_by.name}"

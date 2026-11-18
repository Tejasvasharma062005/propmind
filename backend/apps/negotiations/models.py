"""
Negotiations models.
"""
from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel
from apps.properties.models import Property
from common.constants.choices import NegotiationStatus


def _default_offer_expiry():
    return timezone.now() + timedelta(days=7)


class NegotiationSession(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='negotiation_sessions'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_negotiations'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_negotiations'
    )
    assigned_negotiator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mediated_negotiations',
    )
    status = models.CharField(
        max_length=30,
        choices=NegotiationStatus.choices,
        default=NegotiationStatus.ACTIVE,
        db_index=True
    )
    current_offer_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00
    )

    class Meta:
        verbose_name = 'Negotiation Session'
        verbose_name_plural = 'Negotiation Sessions'

    def __str__(self) -> str:
        return f"Negotiation: {self.property.title} between {self.buyer.name} & {self.seller.name}"


class Offer(BaseModel):
    session = models.ForeignKey(
        NegotiationSession,
        on_delete=models.CASCADE,
        related_name='offers'
    )
    offered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='placed_offers'
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2
    )
    terms = models.TextField(blank=True, default='')
    expires_at = models.DateTimeField(
        default=_default_offer_expiry,
        help_text="Timestamp after which this offer expires if not accepted/countered"
    )
    status = models.CharField(
        max_length=30,
        choices=[
            ('PENDING', 'Pending'),
            ('ACCEPTED', 'Accepted'),
            ('REJECTED', 'Rejected'),
            ('COUNTERED', 'Countered'),
            ('EXPIRED', 'Expired'),
        ],
        default='PENDING'
    )

    class Meta:
        verbose_name = 'Offer'
        verbose_name_plural = 'Offers'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Offer of ₹{self.amount} by {self.offered_by.name} ({self.status})"

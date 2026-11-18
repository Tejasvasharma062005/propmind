"""
Payments models.
"""
from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.transactions.models import Transaction
from common.constants.choices import PaymentStatus


class Payment(BaseModel):
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,
        blank=True
    )
    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments_made'
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2
    )
    purpose = models.CharField(
        max_length=50,
        default='TOKEN_PAYMENT'
    )
    payment_method = models.CharField(
        max_length=50,
        default='UPI'
    )
    invoice_number = models.CharField(
        max_length=80,
        blank=True,
        default='',
        db_index=True,
    )
    utr_number = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Bank NEFT/RTGS/IMPS UTR or payment reference number"
    )
    gateway_order_id = models.CharField(
        max_length=100,
        blank=True,
        default=''
    )
    gateway_payment_id = models.CharField(
        max_length=100,
        blank=True,
        default=''
    )
    status = models.CharField(
        max_length=30,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_payments',
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    receipt_url = models.URLField(blank=True, default='')

    class Meta:
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Payment of ₹{self.amount} by {self.payer.name} - {self.status}"

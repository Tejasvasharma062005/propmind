"""
Transactions & Transaction Room models.
"""
from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.properties.models import Property
from common.constants.choices import TransactionStatus, TaskStatus, Role


class Transaction(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    negotiation_session = models.ForeignKey(
        'negotiations.NegotiationSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_transactions'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_transactions'
    )
    assigned_advocate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='advocate_transactions',
    )
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='agent_transactions',
    )
    final_sale_price = models.DecimalField(
        max_digits=14,
        decimal_places=2
    )
    token_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )
    advance_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00
    )
    status = models.CharField(
        max_length=30,
        choices=TransactionStatus.choices,
        default=TransactionStatus.TOKEN_PENDING,
        db_index=True
    )
    sub_registrar_office = models.CharField(
        max_length=120,
        blank=True,
        default='Sub-Registrar Indore-1 (Collectorate)',
    )
    deed_registration_number = models.CharField(
        max_length=120,
        blank=True,
        default='',
        help_text="Official SAMPADA / Sub-Registrar conveyance deed registration number"
    )
    handover_notes = models.TextField(blank=True, default='')
    token_paid_at = models.DateTimeField(null=True, blank=True)
    agreement_signed_at = models.DateTimeField(null=True, blank=True)
    registration_date = models.DateField(null=True, blank=True)
    handover_completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Transaction for {self.property.title} - ₹{self.final_sale_price} ({self.status})"


class TransactionTask(BaseModel):
    """
    Checklist task inside a Transaction Room assigned to a specific stakeholder role.
    """
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    title = models.CharField(max_length=200)
    assigned_role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.BUYER,
    )
    status = models.CharField(
        max_length=30,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING,
    )
    order_index = models.PositiveSmallIntegerField(default=1)
    due_date = models.DateField(null=True, blank=True)
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_transaction_tasks',
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Transaction Task'
        verbose_name_plural = 'Transaction Tasks'
        ordering = ['order_index', 'created_at']

    def __str__(self) -> str:
        return f"Task #{self.order_index} ({self.status}): {self.title}"

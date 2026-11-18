"""
Legal advisory models.
"""
from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.properties.models import Property
from apps.transactions.models import Transaction


class TitleSearchReport(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='title_search_reports'
    )
    advocate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='title_searches'
    )
    search_period_years = models.PositiveSmallIntegerField(default=30)
    khasra_details = models.TextField(blank=True, default='')
    encumbrances_found = models.TextField(blank=True, default='None')
    legal_opinion = models.TextField()
    is_clear_title = models.BooleanField(default=True)
    report_file = models.FileField(upload_to='legal/reports/%Y/%m/', null=True, blank=True)

    class Meta:
        verbose_name = 'Title Search Report'
        verbose_name_plural = 'Title Search Reports'

    def __str__(self) -> str:
        return f"Title Search: {self.property.title} (Clear: {self.is_clear_title})"


class LegalDeed(BaseModel):
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='deeds'
    )
    deed_type = models.CharField(max_length=100, default='AGREEMENT_TO_SELL')
    draft_content = models.TextField()
    is_signed = models.BooleanField(default=False)
    signed_document = models.FileField(upload_to='legal/deeds/%Y/%m/', null=True, blank=True)

    class Meta:
        verbose_name = 'Legal Deed'
        verbose_name_plural = 'Legal Deeds'

    def __str__(self) -> str:
        return f"{self.deed_type} for Transaction #{self.transaction.id}"

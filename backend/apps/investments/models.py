"""
Investments models.
"""
from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.properties.models import Property


class InvestmentPool(BaseModel):
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='investment_pools'
    )
    title = models.CharField(max_length=200)
    target_amount = models.DecimalField(max_digits=14, decimal_places=2)
    raised_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    minimum_investment = models.DecimalField(max_digits=12, decimal_places=2, default=50000.00)
    expected_roi_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=12.50)
    holding_period_months = models.PositiveSmallIntegerField(default=36)
    status = models.CharField(max_length=50, default='OPEN')

    class Meta:
        verbose_name = 'Investment Pool'
        verbose_name_plural = 'Investment Pools'

    def __str__(self) -> str:
        return f"{self.title} (₹{self.raised_amount}/₹{self.target_amount})"


class InvestorContribution(BaseModel):
    pool = models.ForeignKey(
        InvestmentPool,
        on_delete=models.CASCADE,
        related_name='contributions'
    )
    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='investments'
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    units_allocated = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=50, default='CONFIRMED')

    class Meta:
        verbose_name = 'Investor Contribution'
        verbose_name_plural = 'Investor Contributions'

    def __str__(self) -> str:
        return f"₹{self.amount} in {self.pool.title} by {self.investor.name}"

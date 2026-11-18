"""
Analytics and market trend models.
"""
from django.db import models
from common.models import BaseModel


class LocalityTrend(BaseModel):
    city = models.CharField(max_length=100, default='Indore')
    locality = models.CharField(max_length=150, db_index=True)
    average_price_sqft = models.DecimalField(max_digits=10, decimal_places=2)
    quarter = models.CharField(max_length=10, default='Q4')
    year = models.PositiveIntegerField(default=2026)
    growth_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)

    class Meta:
        verbose_name = 'Locality Trend'
        verbose_name_plural = 'Locality Trends'
        unique_together = ('city', 'locality', 'quarter', 'year')

    def __str__(self) -> str:
        return f"{self.locality}, {self.city} - ₹{self.average_price_sqft}/sq.ft ({self.quarter} {self.year})"

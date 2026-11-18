from django.contrib import admin
from apps.analytics.models import LocalityTrend

@admin.register(LocalityTrend)
class LocalityTrendAdmin(admin.ModelAdmin):
    list_display = ('locality', 'city', 'average_price_sqft', 'quarter', 'year', 'growth_percentage')
    list_filter = ('city', 'year', 'quarter')

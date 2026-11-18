from rest_framework import serializers
from apps.analytics.models import LocalityTrend

class LocalityTrendSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalityTrend
        fields = ['id', 'city', 'locality', 'average_price_sqft', 'quarter', 'year', 'growth_percentage']

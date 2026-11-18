from rest_framework import serializers
from apps.investments.models import InvestmentPool, InvestorContribution


class InvestorContributionSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source='investor.name', read_only=True)
    pool_title = serializers.CharField(source='pool.title', read_only=True)

    class Meta:
        model = InvestorContribution
        fields = [
            'id',
            'pool',
            'pool_title',
            'investor',
            'investor_name',
            'amount',
            'units_allocated',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'pool', 'investor', 'status', 'created_at']


class InvestmentPoolSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_locality = serializers.CharField(source='property.locality', read_only=True)
    contributions = InvestorContributionSerializer(many=True, read_only=True)

    class Meta:
        model = InvestmentPool
        fields = [
            'id',
            'property',
            'property_title',
            'property_locality',
            'title',
            'target_amount',
            'raised_amount',
            'minimum_investment',
            'expected_roi_percentage',
            'holding_period_months',
            'status',
            'contributions',
            'created_at',
        ]
        read_only_fields = ['id', 'raised_amount', 'created_at']

from rest_framework import serializers
from apps.leads.models import Lead, LeadInteraction
from common.constants.choices import LeadStatus


class LeadInteractionSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.CharField(source='logged_by.name', read_only=True)

    class Meta:
        model = LeadInteraction
        fields = [
            'id',
            'lead',
            'logged_by',
            'logged_by_name',
            'interaction_type',
            'summary',
            'next_follow_up_at',
            'created_at',
        ]
        read_only_fields = ['id', 'lead', 'logged_by', 'created_at']


class LeadSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.name', read_only=True)
    buyer_email = serializers.CharField(source='buyer.email', read_only=True)
    buyer_phone = serializers.CharField(source='buyer.phone', read_only=True)
    assigned_agent_name = serializers.CharField(source='assigned_agent.name', read_only=True, default='')
    property_title = serializers.CharField(source='property.title', read_only=True, default='')
    property_locality = serializers.CharField(source='property.locality', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    interactions = LeadInteractionSerializer(many=True, read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id',
            'property',
            'property_title',
            'property_locality',
            'buyer',
            'buyer_name',
            'buyer_email',
            'buyer_phone',
            'assigned_agent',
            'assigned_agent_name',
            'status',
            'status_display',
            'source',
            'inquiry_message',
            'budget_min',
            'budget_max',
            'next_follow_up_at',
            'interactions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'buyer', 'created_at', 'updated_at']


class LeadCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['property', 'inquiry_message', 'budget_min', 'budget_max', 'source']


class LeadUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=LeadStatus.choices, required=False)

    class Meta:
        model = Lead
        fields = ['status', 'assigned_agent', 'next_follow_up_at']

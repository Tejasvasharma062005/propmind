from rest_framework import serializers
from apps.visits.models import SiteVisit
from common.constants.choices import VisitStatus


class SiteVisitSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_locality = serializers.CharField(source='property.locality', read_only=True)
    visitor_name = serializers.CharField(source='visitor.name', read_only=True)
    visitor_phone = serializers.CharField(source='visitor.phone', read_only=True)
    host_name = serializers.CharField(source='host.name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SiteVisit
        fields = [
            'id',
            'property',
            'property_title',
            'property_locality',
            'visitor',
            'visitor_name',
            'visitor_phone',
            'host',
            'host_name',
            'scheduled_at',
            'status',
            'status_display',
            'visitor_notes',
            'feedback_rating',
            'feedback_comments',
            'created_at',
        ]
        read_only_fields = ['id', 'visitor', 'created_at']


class SiteVisitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteVisit
        fields = ['property', 'scheduled_at', 'visitor_notes']


class SiteVisitUpdateSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=VisitStatus.choices, required=False)

    class Meta:
        model = SiteVisit
        fields = ['status', 'scheduled_at', 'visitor_notes', 'feedback_rating', 'feedback_comments']

from rest_framework import serializers
from apps.legal.models import TitleSearchReport, LegalDeed


class TitleSearchReportSerializer(serializers.ModelSerializer):
    advocate_name = serializers.CharField(source='advocate.name', read_only=True, default='')
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_locality = serializers.CharField(source='property.locality', read_only=True)

    class Meta:
        model = TitleSearchReport
        fields = [
            'id',
            'property',
            'property_title',
            'property_locality',
            'advocate',
            'advocate_name',
            'search_period_years',
            'khasra_details',
            'encumbrances_found',
            'legal_opinion',
            'is_clear_title',
            'report_file',
            'created_at',
        ]
        read_only_fields = ['id', 'advocate', 'created_at']


class LegalDeedSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='transaction.property.title', read_only=True)

    class Meta:
        model = LegalDeed
        fields = [
            'id',
            'transaction',
            'property_title',
            'deed_type',
            'draft_content',
            'is_signed',
            'signed_document',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

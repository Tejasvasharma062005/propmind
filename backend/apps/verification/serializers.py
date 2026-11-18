from rest_framework import serializers
from apps.verification.models import (
    PropertyPassport,
    VerificationItem,
    GovernmentVerificationRecord,
)


class VerificationItemSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    authenticity_level_display = serializers.CharField(source='get_authenticity_level_display', read_only=True)
    verifier_name = serializers.CharField(source='verifier.name', read_only=True, default='')

    class Meta:
        model = VerificationItem
        fields = [
            'id',
            'tier',
            'tier_display',
            'status',
            'status_display',
            'authenticity_level',
            'authenticity_level_display',
            'source_authority',
            'source_reference',
            'verification_method',
            'retrieved_at',
            'freshness_expires_at',
            'risk_level',
            'verifier',
            'verifier_name',
            'notes',
            'evidence_document',
            'verified_at',
        ]


class GovernmentVerificationRecordSerializer(serializers.ModelSerializer):
    authority_display = serializers.CharField(source='get_authority_display', read_only=True)
    integration_mode_display = serializers.CharField(source='get_integration_mode_display', read_only=True)
    authenticity_level_display = serializers.CharField(source='get_authenticity_level_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.name', read_only=True, default='')

    class Meta:
        model = GovernmentVerificationRecord
        fields = [
            'id',
            'property',
            'authority',
            'authority_display',
            'official_domain',
            'responsible_department',
            'integration_mode',
            'integration_mode_display',
            'reference_number',
            'authenticity_level',
            'authenticity_level_display',
            'mapped_tier',
            'query_parameters_json',
            'verified_data_json',
            'verified_by',
            'verified_by_name',
            'retrieved_at',
            'freshness_expires_at',
            'notes',
        ]
        read_only_fields = fields


class PropertyPassportSerializer(serializers.ModelSerializer):
    items = VerificationItemSerializer(many=True, read_only=True)
    government_checks = serializers.SerializerMethodField()
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_locality = serializers.CharField(source='property.locality', read_only=True)
    property_type_display = serializers.CharField(source='property.get_property_type_display', read_only=True)
    property_status = serializers.CharField(source='property.status', read_only=True)
    owner_name = serializers.CharField(source='property.created_by.name', read_only=True)
    authenticity_summary_display = serializers.CharField(source='get_authenticity_summary_display', read_only=True)

    class Meta:
        model = PropertyPassport
        fields = [
            'id',
            'property',
            'property_title',
            'property_locality',
            'property_type_display',
            'property_status',
            'owner_name',
            'overall_score',
            'is_verified',
            'authenticity_summary',
            'authenticity_summary_display',
            'risk_level',
            'risk_notes',
            'identity_status',
            'ownership_status',
            'legal_status',
            'physical_status',
            'financial_status',
            'last_verified_at',
            'items',
            'government_checks',
            'updated_at',
        ]

    def get_government_checks(self, obj: PropertyPassport):
        qs = obj.property.government_verifications.select_related('verified_by').order_by('-retrieved_at')[:20]
        return GovernmentVerificationRecordSerializer(qs, many=True).data

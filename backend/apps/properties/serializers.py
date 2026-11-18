"""
Serializers for Property management and documents.
Implements ABAC privacy redaction for public callers (SEC-01) and
supports frontend alias fields on property creation/update.
"""
from typing import Any
from rest_framework import serializers
from apps.properties.models import Property, PropertyOwner, PropertyAmenity, PropertyDocument
from apps.accounts.serializers import UserSerializer
from common.constants.choices import (
    PropertyType,
    PropertyStatus,
    PropertyDocumentType,
    AuthenticityLevel,
    DocumentReviewStatus,
    Role,
)

PROPERTY_TYPE_ALIASES = {
    'COMMERCIAL_SHOP': PropertyType.SHOP,
    'AGRICULTURAL_LAND': PropertyType.AGRICULTURAL,
    'PENTHOUSE': PropertyType.VILLA,
}


class PropertyAmenitySerializer(serializers.ModelSerializer):
    """Serializer for property amenity details."""
    category_display = serializers.CharField(source='get_amenity_category_display', read_only=True)

    class Meta:
        model = PropertyAmenity
        fields = ['id', 'amenity_name', 'amenity_category', 'category_display']


class PropertyDocumentSerializer(serializers.ModelSerializer):
    """Serializer for property documents with review and provenance metadata."""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    review_status_display = serializers.CharField(source='get_review_status_display', read_only=True)
    authenticity_level_display = serializers.CharField(source='get_authenticity_level_display', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True, default='')

    class Meta:
        model = PropertyDocument
        fields = [
            'id',
            'property',
            'document_type',
            'document_type_display',
            'title',
            'document_file',
            'version',
            'checksum_sha256',
            'review_status',
            'review_status_display',
            'authenticity_level',
            'authenticity_level_display',
            'source_reference',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'review_notes',
            'uploaded_by',
            'uploaded_by_name',
            'uploaded_at',
        ]
        read_only_fields = [
            'id',
            'version',
            'checksum_sha256',
            'reviewed_by',
            'reviewed_at',
            'uploaded_by',
            'uploaded_at',
        ]


class PropertyOwnerSerializer(serializers.ModelSerializer):
    """Serializer for property ownership details."""
    user = UserSerializer(read_only=True)

    class Meta:
        model = PropertyOwner
        fields = ['id', 'user', 'ownership_percentage', 'is_primary']


def _viewer_can_access_private_records(user: Any, obj: Property) -> bool:
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    if user.is_staff or getattr(user, 'is_superuser', False):
        return True
    if hasattr(user, 'has_role') and (
        user.has_role(Role.ADMIN) or user.has_role(Role.ADVOCATE) or user.has_role(Role.VERIFIER)
    ):
        return True
    if obj.created_by_id == user.id or obj.owners.filter(user=user, is_deleted=False).exists():
        return True
    # Buyer in an active or completed transaction for this property
    return obj.transactions.filter(buyer=user, is_deleted=False).exists()


class PropertySerializer(serializers.ModelSerializer):
    """Comprehensive Property serializer with ABAC privacy redaction for unauthorized viewers."""
    property_type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    property_condition_display = serializers.CharField(source='get_property_condition_display', read_only=True)
    occupancy_status_display = serializers.CharField(source='get_occupancy_status_display', read_only=True)
    ownership_type_display = serializers.CharField(source='get_ownership_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    amenities = PropertyAmenitySerializer(many=True, read_only=True)
    documents = PropertyDocumentSerializer(many=True, read_only=True)
    owners = PropertyOwnerSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    is_verified = serializers.SerializerMethodField()
    bhk_count = serializers.IntegerField(source='bedrooms', read_only=True)
    carpet_area_sqft = serializers.DecimalField(source='carpet_area', max_digits=10, decimal_places=2, read_only=True)
    super_builtup_area_sqft = serializers.DecimalField(source='built_up_area', max_digits=10, decimal_places=2, read_only=True)
    passport = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id',
            'created_by',
            'created_by_name',
            'property_type',
            'property_type_display',
            'title',
            'description',
            'price',
            'address',
            'locality',
            'city',
            'state',
            'pincode',
            'latitude',
            'longitude',
            'built_up_area',
            'carpet_area',
            'plot_area',
            'carpet_area_sqft',
            'super_builtup_area_sqft',
            'bedrooms',
            'bhk_count',
            'bathrooms',
            'parking_count',
            'construction_year',
            'property_condition',
            'property_condition_display',
            'occupancy_status',
            'occupancy_status_display',
            'ownership_type',
            'ownership_type_display',
            'status',
            'status_display',
            'is_verified',
            'amenities',
            'documents',
            'owners',
            'passport',
            'media',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'status', 'created_at', 'updated_at']

    def get_is_verified(self, obj: Property) -> bool:
        return obj.status == PropertyStatus.VERIFIED

    def get_passport(self, obj: Property):
        passport = getattr(obj, 'passport', None)
        if not passport:
            return None
        from apps.verification.serializers import PropertyPassportSerializer
        return PropertyPassportSerializer(passport).data

    def get_media(self, obj: Property):
        images = []
        for listing in obj.listings.all():
            for idx, m in enumerate(listing.media.all()):
                if not m.is_deleted:
                    images.append({
                        'id': str(m.id),
                        'property_id': str(obj.id),
                        'media_type': 'IMAGE',
                        'url': m.image.url,
                        'is_featured': m.is_primary,
                        'order': idx + 1,
                    })
        return images

    def to_representation(self, instance: Property) -> dict[str, Any]:
        rep = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request is not None else self.context.get('user')
        if not _viewer_can_access_private_records(user, instance):
            # Redact raw document file download links and owner email/phone PII for public callers
            for doc in rep.get('documents', []):
                doc['document_file'] = None
            for owner in rep.get('owners', []):
                if isinstance(owner.get('user'), dict):
                    first_name = (owner['user'].get('name') or 'Owner').split(' ')[0]
                    owner['user'] = {'name': first_name}
            rep['created_by_name'] = (rep.get('created_by_name') or 'Owner').split(' ')[0]
            rep['address'] = f"{instance.locality}, {instance.city}"
        return rep


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating properties.
    Seamlessly normalizes both backend field names and frontend wizard aliases.
    """
    amenities_list = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        write_only=True
    )

    class Meta:
        model = Property
        fields = [
            'property_type',
            'title',
            'description',
            'price',
            'address',
            'locality',
            'city',
            'state',
            'pincode',
            'latitude',
            'longitude',
            'built_up_area',
            'carpet_area',
            'plot_area',
            'bedrooms',
            'bathrooms',
            'parking_count',
            'construction_year',
            'property_condition',
            'occupancy_status',
            'ownership_type',
            'amenities_list',
        ]
        extra_kwargs = {
            'built_up_area': {'required': False},
        }

    def to_internal_value(self, data: Any) -> Any:
        mutable = dict(data.lists() if hasattr(data, 'lists') else data)
        # Flatten single-element lists from QueryDict if needed
        for k, v in list(mutable.items()):
            if isinstance(v, list) and k not in ('amenities_list', 'amenities') and len(v) == 1:
                mutable[k] = v[0]

        raw_type = mutable.get('property_type')
        if raw_type in PROPERTY_TYPE_ALIASES:
            mutable['property_type'] = PROPERTY_TYPE_ALIASES[raw_type]

        if 'carpet_area' not in mutable and mutable.get('carpet_area_sqft') not in (None, ''):
            mutable['carpet_area'] = mutable.get('carpet_area_sqft')
        if 'built_up_area' not in mutable:
            if mutable.get('super_builtup_area_sqft') not in (None, ''):
                mutable['built_up_area'] = mutable.get('super_builtup_area_sqft')
            elif mutable.get('carpet_area') not in (None, ''):
                mutable['built_up_area'] = mutable.get('carpet_area')
        if 'bedrooms' not in mutable and mutable.get('bhk_count') not in (None, ''):
            mutable['bedrooms'] = mutable.get('bhk_count')
        if 'amenities_list' not in mutable and isinstance(mutable.get('amenities'), list):
            mutable['amenities_list'] = mutable.get('amenities')

        return super().to_internal_value(mutable)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not self.partial and attrs.get('built_up_area') is None:
            if attrs.get('carpet_area') is not None:
                attrs['built_up_area'] = attrs['carpet_area']
            else:
                raise serializers.ValidationError({'built_up_area': 'Either built_up_area or carpet_area is required.'})
        return attrs


class PropertyDocumentUploadSerializer(serializers.Serializer):
    """Serializer for uploading legal documents to a property."""
    document_type = serializers.ChoiceField(choices=PropertyDocumentType.choices)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    source_reference = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    document_file = serializers.FileField(required=False)
    file = serializers.FileField(required=False, write_only=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        uploaded = attrs.get('document_file') or attrs.get('file')
        if not uploaded:
            raise serializers.ValidationError({'document_file': 'A document file is required.'})
        attrs['document_file'] = uploaded
        return attrs


class PropertyDocumentReviewSerializer(serializers.Serializer):
    """Serializer for advocate/verifier/admin review of an uploaded PropertyDocument."""
    review_status = serializers.ChoiceField(choices=DocumentReviewStatus.choices)
    authenticity_level = serializers.ChoiceField(
        choices=AuthenticityLevel.choices,
        required=False,
        default=AuthenticityLevel.PLATFORM_VERIFIED,
    )
    source_reference = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    review_notes = serializers.CharField(max_length=2000, required=False, allow_blank=True, default='')

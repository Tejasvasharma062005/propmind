"""
Listings serializers.

Privacy: public listing responses NEVER include property legal documents,
owner personal details (phone/email), the exact street address or precise
coordinates. Those are only shared later in the deal flow.
"""
import re
from decimal import ROUND_HALF_UP, Decimal

from django.utils import timezone
from rest_framework import serializers

from apps.listings.models import Listing, ListingMedia, ListingReportReason
from apps.properties.models import Property
from common.constants.choices import ListingStatus, ListingType

RERA_PATTERN = re.compile(r'^[A-Za-z0-9/\-]{5,50}$')


class PublicPropertySummarySerializer(serializers.ModelSerializer):
    property_type_display = serializers.CharField(source='get_property_type_display', read_only=True)
    property_condition_display = serializers.CharField(source='get_property_condition_display', read_only=True)
    is_verified = serializers.SerializerMethodField()
    approx_latitude = serializers.SerializerMethodField()
    approx_longitude = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'property_type', 'property_type_display',
            'locality', 'city', 'state', 'pincode',
            'built_up_area', 'carpet_area', 'plot_area',
            'bedrooms', 'bathrooms', 'parking_count', 'construction_year',
            'property_condition', 'property_condition_display',
            'is_verified', 'approx_latitude', 'approx_longitude',
        ]
        read_only_fields = fields

    def get_is_verified(self, obj: Property) -> bool:
        return obj.status == 'VERIFIED'

    @staticmethod
    def _approx(value):
        # ~110 m precision: enough for a map pin, not enough to locate the door
        if value is None:
            return None
        return float(Decimal(value).quantize(Decimal('0.001'), rounding=ROUND_HALF_UP))

    def get_approx_latitude(self, obj: Property):
        return self._approx(obj.latitude)

    def get_approx_longitude(self, obj: Property):
        return self._approx(obj.longitude)


class ListingMediaSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ListingMedia
        fields = ['id', 'url', 'caption', 'display_order', 'is_primary', 'width', 'height', 'created_at']
        read_only_fields = fields

    def get_url(self, obj: ListingMedia) -> str:
        # With S3 + AWS_QUERYSTRING_AUTH this is a short-lived pre-signed URL
        url = obj.image.url
        request = self.context.get('request')
        if request is not None and url.startswith('/'):
            return request.build_absolute_uri(url)
        return url


class ListingSerializer(serializers.ModelSerializer):
    """Public read representation."""
    property_summary = PublicPropertySummarySerializer(source='property', read_only=True)
    listing_type_display = serializers.CharField(source='get_listing_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    listed_by_name = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'property', 'property_summary', 'listed_by_name',
            'listing_type', 'listing_type_display', 'status', 'status_display',
            'asking_price', 'security_deposit', 'maintenance_charges',
            'is_negotiable', 'is_featured', 'available_from', 'rera_number',
            'published_at', 'expires_at', 'views_count',
            'media', 'primary_image', 'is_owner', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_listed_by_name(self, obj: Listing) -> str:
        # First name only - full identity is revealed later in the deal flow
        name = (obj.listed_by.name or '').strip()
        return name.split(' ')[0] if name else 'Owner'

    def _media(self, obj: Listing):
        return [m for m in obj.media.all() if not m.is_deleted]

    def get_media(self, obj: Listing):
        return ListingMediaSerializer(self._media(obj), many=True, context=self.context).data

    def get_primary_image(self, obj: Listing):
        media = self._media(obj)
        primary = next((m for m in media if m.is_primary), media[0] if media else None)
        return ListingMediaSerializer(primary, context=self.context).data['url'] if primary else None

    def get_is_owner(self, obj: Listing) -> bool:
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and user.id == obj.listed_by_id)


class ListingOwnerSerializer(ListingSerializer):
    """Adds moderation details visible only to the lister and staff."""

    class Meta(ListingSerializer.Meta):
        fields = ListingSerializer.Meta.fields + ['rejection_reason', 'reviewed_at', 'report_count']
        read_only_fields = fields


class _ListingWriteValidationMixin:
    def validate_rera_number(self, value: str) -> str:
        value = (value or '').strip().upper()
        if value and not RERA_PATTERN.match(value):
            raise serializers.ValidationError("Enter a valid RERA registration number.")
        return value

    def validate_available_from(self, value):
        if value and value < timezone.localdate():
            raise serializers.ValidationError("Availability date cannot be in the past.")
        return value

    def validate(self, attrs):
        listing_type = attrs.get('listing_type') or getattr(self.instance, 'listing_type', None)
        deposit = attrs.get('security_deposit')
        if listing_type == ListingType.SALE and deposit:
            raise serializers.ValidationError({'security_deposit': "Security deposit applies only to rent/lease listings."})
        return attrs


class ListingCreateSerializer(_ListingWriteValidationMixin, serializers.ModelSerializer):
    property = serializers.PrimaryKeyRelatedField(queryset=Property.objects.all())

    class Meta:
        model = Listing
        fields = [
            'property', 'listing_type', 'asking_price', 'security_deposit',
            'maintenance_charges', 'is_negotiable', 'available_from', 'rera_number',
        ]
        # Duplicate "live listing" rule is conditional; it is enforced in ListingService
        # (DRF's auto-generated unique validator would ignore the status condition).
        validators = []


class ListingUpdateSerializer(_ListingWriteValidationMixin, serializers.ModelSerializer):
    """Property and listing type are immutable; create a new listing instead."""

    class Meta:
        model = Listing
        fields = [
            'asking_price', 'security_deposit', 'maintenance_charges',
            'is_negotiable', 'available_from', 'rera_number',
        ]


class ListingStatusChangeSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        ListingStatus.ACTIVE, ListingStatus.PAUSED, ListingStatus.SOLD,
        ListingStatus.WITHDRAWN, ListingStatus.PENDING_APPROVAL,
    ])


class ListingModerationSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True, max_length=1000, default='')


class ListingReportSerializer(serializers.Serializer):
    reason = serializers.ChoiceField(choices=ListingReportReason.choices)
    details = serializers.CharField(required=False, allow_blank=True, max_length=2000, default='')


class ListingMediaUploadSerializer(serializers.Serializer):
    images = serializers.ListField(child=serializers.ImageField(), allow_empty=False, max_length=10)
    caption = serializers.CharField(required=False, allow_blank=True, max_length=200, default='')

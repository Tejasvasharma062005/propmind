"""
Property models: Property, PropertyOwner, PropertyAmenity, and PropertyDocument.
"""
import hashlib
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel
from common.constants.choices import (
    PropertyType,
    PropertyCondition,
    OccupancyStatus,
    OwnershipType,
    PropertyStatus,
    AmenityCategory,
    PropertyDocumentType,
    AuthenticityLevel,
    DocumentReviewStatus,
)


def property_document_upload_path(instance: 'PropertyDocument', filename: str) -> str:
    ext = (filename.rsplit('.', 1)[-1] if '.' in filename else 'pdf').lower()
    if ext not in ('pdf', 'jpg', 'jpeg', 'png', 'webp'):
        ext = 'pdf'
    return f"properties/documents/{instance.property_id}/{uuid.uuid4().hex}.{ext}"


class Property(BaseModel):
    """
    Core Real Estate Asset record.
    Uses standard Decimal fields for latitude and longitude (no GDAL requirement).
    """
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_properties',
        help_text="User who created this property listing"
    )
    property_type = models.CharField(
        max_length=30,
        choices=PropertyType.choices,
        db_index=True,
        help_text="Type of property asset"
    )
    title = models.CharField(
        max_length=255,
        help_text="Heading or title for the property"
    )
    description = models.TextField(
        help_text="Detailed property narrative and features"
    )
    price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        db_index=True,
        help_text="Listing / expected price in INR"
    )
    address = models.TextField(
        help_text="Street address, building name, flat/plot number"
    )
    locality = models.CharField(
        max_length=150,
        db_index=True,
        help_text="Neighborhood or locality (e.g. Vijay Nagar, Palasia, Super Corridor)"
    )
    city = models.CharField(
        max_length=100,
        default='Indore',
        db_index=True,
        help_text="City"
    )
    state = models.CharField(
        max_length=100,
        default='Madhya Pradesh',
        help_text="State"
    )
    pincode = models.CharField(
        max_length=10,
        db_index=True,
        help_text="Postal Index Code"
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="GPS Latitude"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="GPS Longitude"
    )
    built_up_area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total built-up area in square feet"
    )
    carpet_area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Carpet area in square feet"
    )
    plot_area = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total plot area in square feet"
    )
    bedrooms = models.PositiveSmallIntegerField(
        default=0,
        help_text="Number of bedrooms (BHK count)"
    )
    bathrooms = models.PositiveSmallIntegerField(
        default=0,
        help_text="Number of bathrooms"
    )
    parking_count = models.PositiveSmallIntegerField(
        default=0,
        help_text="Number of dedicated vehicle parking spots"
    )
    construction_year = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Year of construction completion"
    )
    property_condition = models.CharField(
        max_length=30,
        choices=PropertyCondition.choices,
        default=PropertyCondition.READY_TO_MOVE,
        help_text="Construction readiness"
    )
    occupancy_status = models.CharField(
        max_length=30,
        choices=OccupancyStatus.choices,
        default=OccupancyStatus.VACANT,
        help_text="Current occupancy status"
    )
    ownership_type = models.CharField(
        max_length=30,
        choices=OwnershipType.choices,
        default=OwnershipType.FREEHOLD,
        help_text="Legal title nature"
    )
    status = models.CharField(
        max_length=30,
        choices=PropertyStatus.choices,
        default=PropertyStatus.DRAFT,
        db_index=True,
        help_text="Listing lifecycle status"
    )

    class Meta:
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.title} ({self.locality}, {self.city})"


class PropertyOwner(BaseModel):
    """
    Ownership share association between user and property.
    """
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='owners',
        help_text="Property owned"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_properties',
        help_text="Owner user"
    )
    ownership_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100.00,
        help_text="Percentage share of ownership"
    )
    is_primary = models.BooleanField(
        default=True,
        help_text="Whether this user is the primary contact owner"
    )

    class Meta:
        verbose_name = 'Property Owner'
        verbose_name_plural = 'Property Owners'
        unique_together = ('property', 'user')

    def __str__(self) -> str:
        return f"{self.user.name} - {self.property.title} ({self.ownership_percentage}%)"


class PropertyAmenity(BaseModel):
    """
    Amenity associated with a property.
    """
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='amenities',
        help_text="Associated property"
    )
    amenity_name = models.CharField(
        max_length=100,
        help_text="Name of amenity (e.g. Swimming Pool, Lift, Power Backup, Clubhouse)"
    )
    amenity_category = models.CharField(
        max_length=30,
        choices=AmenityCategory.choices,
        default=AmenityCategory.BASIC,
        help_text="Classification group"
    )

    class Meta:
        verbose_name = 'Property Amenity'
        verbose_name_plural = 'Property Amenities'
        unique_together = ('property', 'amenity_name')

    def __str__(self) -> str:
        return f"{self.amenity_name} ({self.property.title})"


class PropertyDocument(BaseModel):
    """
    Vault of legal and municipal title documents attached to a property.
    Includes version tracking, SHA-256 integrity hash, advocate review status,
    and data authenticity provenance level.
    """
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='documents',
        help_text="Associated property"
    )
    document_type = models.CharField(
        max_length=50,
        choices=PropertyDocumentType.choices,
        help_text="Document category"
    )
    title = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text="Descriptive document title"
    )
    document_file = models.FileField(
        upload_to=property_document_upload_path,
        help_text="Encrypted or secured uploaded file"
    )
    version = models.PositiveSmallIntegerField(
        default=1,
        help_text="Document revision version number"
    )
    checksum_sha256 = models.CharField(
        max_length=64,
        blank=True,
        default='',
        db_index=True,
        help_text="SHA-256 hash of uploaded file bytes"
    )
    review_status = models.CharField(
        max_length=30,
        choices=DocumentReviewStatus.choices,
        default=DocumentReviewStatus.PENDING,
        db_index=True,
    )
    authenticity_level = models.CharField(
        max_length=30,
        choices=AuthenticityLevel.choices,
        default=AuthenticityLevel.USER_SUBMITTED,
        db_index=True,
    )
    source_reference = models.CharField(
        max_length=150,
        blank=True,
        default='',
        help_text="Official registration / Khasra / NOC reference number"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_property_documents',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, default='')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_property_documents',
        help_text="User who uploaded this document"
    )
    uploaded_at = models.DateTimeField(
        default=timezone.now,
        help_text="Upload timestamp"
    )

    class Meta:
        verbose_name = 'Property Document'
        verbose_name_plural = 'Property Documents'
        ordering = ['-uploaded_at']

    def __str__(self) -> str:
        return f"{self.document_type} (v{self.version}) - {self.property.title}"

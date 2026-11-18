"""
Listings models.

Security / trust design:
- New listings start in PENDING_APPROVAL and must be approved by an admin
  before they become publicly visible (moderation gate against fraud/spam).
- Only one live (pending/active/paused) listing per property per listing type.
- Media files are stored under random UUID keys (original filenames are never
  used in storage paths), with size, MIME type and SHA-256 checksum recorded
  for integrity checks and duplicate/stolen-photo detection.
- Users can report suspicious listings; reports are tracked for moderation.
"""
import builtins
import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone

from apps.properties.models import Property
from common.constants.choices import ListingStatus, ListingType
from common.models import BaseModel

# Statuses in which a listing is considered "live" (blocks duplicates).
LIVE_LISTING_STATUSES = [
    ListingStatus.PENDING_APPROVAL,
    ListingStatus.ACTIVE,
    ListingStatus.PAUSED,
]


def listing_media_upload_path(instance: "ListingMedia", filename: str) -> str:
    """Store media under a random key; never trust the client-supplied filename."""
    ext = (filename.rsplit('.', 1)[-1] if '.' in filename else 'jpg').lower()
    if ext not in ('jpg', 'jpeg', 'png', 'webp'):
        ext = 'jpg'
    return f"listings/{instance.listing_id}/{uuid.uuid4().hex}.{ext}"


class Listing(BaseModel):
    """Marketplace listing for a property asset."""

    property = models.ForeignKey(
        Property,
        on_delete=models.PROTECT,
        related_name='listings',
        help_text="Target property",
    )
    listed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='property_listings',
        help_text="User creating the listing",
    )
    listing_type = models.CharField(
        max_length=30,
        choices=ListingType.choices,
        default=ListingType.SALE,
        db_index=True,
        help_text="Sale, Rent, or Lease",
    )
    status = models.CharField(
        max_length=30,
        choices=ListingStatus.choices,
        default=ListingStatus.PENDING_APPROVAL,
        db_index=True,
        help_text="Listing marketplace status",
    )

    # Pricing
    asking_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(1)],
        help_text="Asking price or monthly rent in INR",
    )
    security_deposit = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Security deposit for rental listings",
    )
    maintenance_charges = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Monthly society maintenance charges",
    )
    is_negotiable = models.BooleanField(default=True)
    is_featured = models.BooleanField(
        default=False, db_index=True,
        help_text="Promoted listing (admin-controlled only)",
    )
    available_from = models.DateField(default=timezone.localdate)

    # Compliance
    rera_number = models.CharField(
        max_length=50, blank=True, default='',
        help_text="MP RERA registration number (mandatory for registered projects)",
    )

    # Moderation / audit trail
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_listings',
        help_text="Admin who approved/rejected the listing",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default='')
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    expires_at = models.DateTimeField(
        null=True, blank=True, db_index=True,
        help_text="Listing auto-expires after this time and must be renewed",
    )

    # Metrics / trust signals
    views_count = models.PositiveIntegerField(default=0)
    report_count = models.PositiveIntegerField(
        default=0, help_text="Number of open user reports (fraud signal)",
    )

    class Meta:
        verbose_name = 'Listing'
        verbose_name_plural = 'Listings'
        ordering = ['-is_featured', '-created_at']
        indexes = [
            models.Index(fields=['status', 'listing_type']),
            models.Index(fields=['status', 'asking_price']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['property', 'listing_type'],
                condition=Q(is_deleted=False) & Q(status__in=LIVE_LISTING_STATUSES),
                name='uniq_live_listing_per_property_type',
            ),
        ]

    def __str__(self) -> str:
        return f"{self.get_listing_type_display()} - {self.property.title} (₹{self.asking_price})"

    # NB: the `property` field shadows the builtin inside this class body
    @builtins.property
    def is_publicly_visible(self) -> bool:
        if self.is_deleted or self.status != ListingStatus.ACTIVE:
            return False
        return not (self.expires_at and self.expires_at <= timezone.now())


class ListingMedia(BaseModel):
    """Image attached to a listing. A listing can have many images."""

    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='media',
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='uploaded_listing_media',
    )
    image = models.ImageField(upload_to=listing_media_upload_path)
    caption = models.CharField(max_length=200, blank=True, default='')
    display_order = models.PositiveSmallIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    # Integrity metadata (computed server-side, never client-supplied)
    content_type = models.CharField(max_length=50)
    file_size = models.PositiveIntegerField(help_text="Size in bytes")
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)
    checksum_sha256 = models.CharField(max_length=64, db_index=True)

    class Meta:
        verbose_name = 'Listing Media'
        verbose_name_plural = 'Listing Media'
        ordering = ['display_order', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['listing', 'checksum_sha256'],
                condition=Q(is_deleted=False),
                name='uniq_media_checksum_per_listing',
            ),
        ]

    def __str__(self) -> str:
        return f"Media {self.id} for listing {self.listing_id}"


class ListingReportReason(models.TextChoices):
    FRAUD = 'FRAUD', 'Suspected Fraud / Scam'
    FAKE_PHOTOS = 'FAKE_PHOTOS', 'Fake or Misleading Photos'
    WRONG_PRICE = 'WRONG_PRICE', 'Incorrect Price'
    ALREADY_SOLD = 'ALREADY_SOLD', 'Property Already Sold / Rented'
    NOT_OWNER = 'NOT_OWNER', 'Lister Is Not the Owner'
    DUPLICATE = 'DUPLICATE', 'Duplicate Listing'
    OTHER = 'OTHER', 'Other'


class ListingReport(BaseModel):
    """User-submitted report flagging a suspicious listing."""

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reports')
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='listing_reports',
    )
    reason = models.CharField(max_length=30, choices=ListingReportReason.choices)
    details = models.TextField(blank=True, default='', max_length=2000)
    is_resolved = models.BooleanField(default=False, db_index=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='resolved_listing_reports',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_note = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['listing', 'reported_by'],
                condition=Q(is_deleted=False),
                name='uniq_report_per_user_listing',
            ),
        ]

    def __str__(self) -> str:
        return f"Report {self.reason} on {self.listing_id}"

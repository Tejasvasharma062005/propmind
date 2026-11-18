"""
Selectors (read-side queries) for marketplace listings.
"""
from decimal import Decimal, InvalidOperation
from typing import Any, Mapping, Optional

from django.db.models import Q, QuerySet
from django.utils import timezone

from apps.listings.models import Listing, ListingReport
from common.constants.choices import ListingStatus

ORDERING_MAP = {
    'newest': ('-is_featured', '-published_at'),
    'price_asc': ('asking_price',),
    'price_desc': ('-asking_price',),
    'most_viewed': ('-views_count',),
}


def _base_qs() -> QuerySet[Listing]:
    return Listing.objects.select_related('property', 'listed_by').prefetch_related('media')


def _to_decimal(value: Any) -> Optional[Decimal]:
    try:
        return Decimal(str(value)) if value not in (None, '') else None
    except (InvalidOperation, ValueError):
        return None


def _to_int(value: Any) -> Optional[int]:
    try:
        return int(value) if value not in (None, '') else None
    except (TypeError, ValueError):
        return None


def get_public_listings(filters: Mapping[str, Any]) -> QuerySet[Listing]:
    """Approved, non-expired listings visible to everyone, with safe filtering."""
    now = timezone.now()
    qs = _base_qs().filter(
        status=ListingStatus.ACTIVE,
        property__is_deleted=False,
    ).filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))

    if listing_type := filters.get('listing_type') or filters.get('type'):
        qs = qs.filter(listing_type=str(listing_type).upper())
    if city := filters.get('city'):
        qs = qs.filter(property__city__iexact=city)
    if locality := filters.get('locality'):
        qs = qs.filter(property__locality__icontains=locality)
    if property_type := filters.get('property_type'):
        qs = qs.filter(property__property_type=str(property_type).upper())
    if (min_price := _to_decimal(filters.get('min_price'))) is not None:
        qs = qs.filter(asking_price__gte=min_price)
    if (max_price := _to_decimal(filters.get('max_price'))) is not None:
        qs = qs.filter(asking_price__lte=max_price)
    if (bedrooms := _to_int(filters.get('bedrooms') or filters.get('bhk'))) is not None:
        qs = qs.filter(property__bedrooms__gte=bedrooms)
    if str(filters.get('verified_only', '')).lower() in ('1', 'true'):
        qs = qs.filter(property__status='VERIFIED')
    if search := filters.get('search'):
        search = str(search)[:100]
        qs = qs.filter(
            Q(property__title__icontains=search)
            | Q(property__locality__icontains=search)
            | Q(property__description__icontains=search)
        )

    ordering = ORDERING_MAP.get(str(filters.get('sort_by', 'newest')), ORDERING_MAP['newest'])
    return qs.order_by(*ordering)


def get_user_listings(user, status: Optional[str] = None) -> QuerySet[Listing]:
    qs = _base_qs().filter(listed_by=user)
    if status:
        qs = qs.filter(status=status)
    return qs.order_by('-created_at')


def get_listing_for_viewer(listing_id, user) -> Optional[Listing]:
    """
    Return the listing if the viewer may see it:
    everyone sees publicly-visible listings; owners and staff see their own in any state.
    """
    listing = _base_qs().filter(id=listing_id).first()
    if listing is None:
        return None
    if listing.is_publicly_visible:
        return listing
    if user and user.is_authenticated and (user.is_staff or listing.listed_by_id == user.id):
        return listing
    return None


def get_moderation_queue() -> QuerySet[Listing]:
    return _base_qs().filter(status=ListingStatus.PENDING_APPROVAL).order_by('-report_count', 'created_at')


def get_open_reports(listing: Listing) -> QuerySet[ListingReport]:
    return listing.reports.filter(is_resolved=False).select_related('reported_by')

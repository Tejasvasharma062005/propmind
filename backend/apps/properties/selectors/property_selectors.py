"""
Query selectors for property catalog and geographic filtering.
"""
from decimal import Decimal
from typing import Optional
from django.db.models import QuerySet, Q
from apps.accounts.models import User
from apps.properties.models import Property
from common.constants.choices import PropertyStatus


def list_active_properties(
    locality: Optional[str] = None,
    city: Optional[str] = 'Indore',
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lng: Optional[float] = None,
    max_lng: Optional[float] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None,
) -> QuerySet[Property]:
    """Returns active and verified properties with attribute and geographic filtering."""
    qs = Property.objects.filter(status__in=[PropertyStatus.ACTIVE, PropertyStatus.VERIFIED])

    if city:
        qs = qs.filter(city__iexact=city)
    if locality:
        qs = qs.filter(locality__icontains=locality)
    if property_type:
        qs = qs.filter(property_type=property_type)
    if min_price is not None:
        qs = qs.filter(price__gte=min_price)
    if max_price is not None:
        qs = qs.filter(price__lte=max_price)
    if bedrooms is not None:
        qs = qs.filter(bedrooms=bedrooms)

    # Geographic bounding box
    if min_lat is not None and max_lat is not None:
        qs = qs.filter(latitude__gte=Decimal(str(min_lat)), latitude__lte=Decimal(str(max_lat)))
    if min_lng is not None and max_lng is not None:
        qs = qs.filter(longitude__gte=Decimal(str(min_lng)), longitude__lte=Decimal(str(max_lng)))

    # Approximate radius bounding box around (lat, lng) (1 deg lat ~ 111 km)
    if lat is not None and lng is not None and radius_km is not None and radius_km > 0:
        delta = Decimal(str(round(radius_km / 111.0, 6)))
        c_lat = Decimal(str(lat))
        c_lng = Decimal(str(lng))
        qs = qs.filter(
            latitude__gte=c_lat - delta,
            latitude__lte=c_lat + delta,
            longitude__gte=c_lng - delta,
            longitude__lte=c_lng + delta,
        )

    return qs.select_related('created_by').prefetch_related('amenities', 'documents', 'owners__user')


def get_user_properties(user: User) -> QuerySet[Property]:
    """Returns properties owned or created by the user."""
    return Property.objects.filter(
        Q(created_by=user) | Q(owners__user=user)
    ).distinct().select_related('created_by').prefetch_related('amenities', 'documents')

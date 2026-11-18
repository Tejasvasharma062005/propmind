from decimal import Decimal
from django.db.models import Avg, Q, Sum
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from common.utils.response import success_response
from common.constants.choices import ListingStatus, PropertyStatus, NegotiationStatus
from apps.accounts.models import User
from apps.analytics.models import LocalityTrend
from apps.analytics.serializers import LocalityTrendSerializer
from apps.properties.models import Property
from apps.listings.models import Listing
from apps.leads.models import Lead
from apps.visits.models import SiteVisit
from apps.negotiations.models import NegotiationSession
from apps.transactions.models import Transaction
from apps.verification.models import PropertyPassport
from apps.discovery.models import UserFavorite
from apps.communications.models import Notification
from apps.communications.serializers import NotificationSerializer


class LocalityTrendListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        city = request.query_params.get('city', 'Indore')
        trends = LocalityTrend.objects.filter(city__iexact=city).order_by('-average_price_sqft')
        agg = trends.aggregate(
            avg_rate=Avg('average_price_sqft'),
            avg_growth=Avg('growth_percentage'),
        )
        return success_response(
            data={
                'trends': LocalityTrendSerializer(trends, many=True).data,
                'summary': {
                    'city': city,
                    'average_price_sqft': round(float(agg['avg_rate'] or 0), 2),
                    'average_growth_percentage': round(float(agg['avg_growth'] or 0), 2),
                    'total_localities': trends.count(),
                },
            }
        )


class PlatformStatsView(APIView):
    """
    Live public platform metrics for the Landing Page.
    """
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        verified_properties = Property.objects.filter(status__in=[PropertyStatus.VERIFIED, PropertyStatus.ACTIVE]).count()
        active_listings = Listing.objects.filter(status=ListingStatus.ACTIVE).count()
        total_users = User.objects.filter(is_active=True).count()
        top_trend = LocalityTrend.objects.order_by('-growth_percentage').first()

        return success_response(
            data={
                'verified_properties_count': verified_properties,
                'active_listings_count': active_listings,
                'registered_users_count': total_users,
                'top_locality': top_trend.locality if top_trend else 'Super Corridor',
                'top_locality_growth': float(top_trend.growth_percentage) if top_trend else 14.5,
                'top_locality_rate': float(top_trend.average_price_sqft) if top_trend else 4500.0,
            }
        )


class DashboardSummaryView(APIView):
    """
    Real-time role-aware metrics and activity feed for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        is_admin = user.is_staff

        if is_admin:
            active_listings = Listing.objects.filter(status=ListingStatus.ACTIVE).count()
            pending_moderation = Listing.objects.filter(status=ListingStatus.PENDING_APPROVAL).count()
            leads_count = Lead.objects.count()
            visits_count = SiteVisit.objects.count()
            escrow_sum = Transaction.objects.aggregate(total=Sum('final_sale_price'))['total'] or Decimal('0')
            deals_count = Transaction.objects.count()
        else:
            active_listings = Listing.objects.filter(listed_by=user, status=ListingStatus.ACTIVE).count()
            pending_moderation = Listing.objects.filter(listed_by=user, status=ListingStatus.PENDING_APPROVAL).count()
            leads_count = Lead.objects.filter(
                Q(buyer=user) | Q(assigned_agent=user) | Q(property__created_by=user)
            ).distinct().count()
            visits_count = SiteVisit.objects.filter(
                Q(visitor=user) | Q(host=user) | Q(property__created_by=user)
            ).distinct().count()
            user_txns = Transaction.objects.filter(Q(buyer=user) | Q(seller=user)).distinct()
            escrow_sum = user_txns.aggregate(total=Sum('final_sale_price'))['total'] or Decimal('0')
            deals_count = user_txns.count()

        audited_passports = PropertyPassport.objects.filter(overall_score__gt=0).count()
        saved_favorites = UserFavorite.objects.filter(user=user).count()
        active_offers = NegotiationSession.objects.filter(
            Q(buyer=user) | Q(seller=user),
            status=NegotiationStatus.ACTIVE,
        ).distinct().count()

        notifications = Notification.objects.filter(user=user).order_by('-created_at')[:8]
        top_trend = LocalityTrend.objects.order_by('-growth_percentage').first()

        return success_response(
            data={
                'active_listings_count': active_listings,
                'pending_moderation_count': pending_moderation,
                'leads_count': leads_count,
                'visits_count': visits_count,
                'escrow_volume': float(escrow_sum),
                'deals_count': deals_count,
                'audited_passports_count': audited_passports,
                'saved_favorites_count': saved_favorites,
                'active_offers_count': active_offers,
                'notifications': NotificationSerializer(notifications, many=True).data,
                'spotlight_trend': LocalityTrendSerializer(top_trend).data if top_trend else None,
            }
        )

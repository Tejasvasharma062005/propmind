"""
Listings API views.
"""
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.listings.models import Listing
from apps.listings.selectors import (
    get_listing_for_viewer,
    get_moderation_queue,
    get_public_listings,
    get_user_listings,
)
from apps.listings.serializers import (
    ListingCreateSerializer,
    ListingMediaSerializer,
    ListingMediaUploadSerializer,
    ListingModerationSerializer,
    ListingOwnerSerializer,
    ListingReportSerializer,
    ListingSerializer,
    ListingStatusChangeSerializer,
    ListingUpdateSerializer,
)
from apps.listings.services import ListingService
from common.exceptions import NotFound
from common.permissions import IsAdmin
from common.utils.response import error_response, paginated_response, success_response

MAX_PAGE_SIZE = 50


def _pagination_params(request: Request) -> tuple[int, int]:
    try:
        page = max(int(request.query_params.get('page', 1)), 1)
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = min(max(int(request.query_params.get('page_size', 20)), 1), MAX_PAGE_SIZE)
    except (TypeError, ValueError):
        page_size = 20
    return page, page_size


def _paginate(request: Request, qs, serializer_class) -> Response:
    page, page_size = _pagination_params(request)
    total = qs.count()
    start = (page - 1) * page_size
    data = serializer_class(qs[start:start + page_size], many=True, context={'request': request}).data
    return paginated_response(data, total, page, page_size)


def _serializer_for(request: Request, listing: Listing):
    user = request.user
    if user.is_authenticated and (user.is_staff or listing.listed_by_id == user.id):
        return ListingOwnerSerializer
    return ListingSerializer


def _get_managed_listing(listing_id) -> Listing:
    listing = Listing.objects.select_related('property', 'listed_by').filter(id=listing_id).first()
    if listing is None:
        raise NotFound("Listing not found.")
    return listing


class ListingListCreateView(APIView):
    throttle_scope = 'listing_create'

    def get_permissions(self):
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    def get_throttles(self):
        return [ScopedRateThrottle()] if self.request.method == 'POST' else super().get_throttles()

    @extend_schema(summary="Search approved marketplace listings", responses=ListingSerializer(many=True))
    def get(self, request: Request) -> Response:
        return _paginate(request, get_public_listings(request.query_params), ListingSerializer)

    @extend_schema(summary="Create a listing (enters moderation queue)", request=ListingCreateSerializer,
                   responses=ListingOwnerSerializer)
    def post(self, request: Request) -> Response:
        serializer = ListingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid listing data.", errors=serializer.errors)
        listing = ListingService.create_listing(request.user, serializer.validated_data)
        return success_response(
            data=ListingOwnerSerializer(listing, context={'request': request}).data,
            message="Listing submitted for review. It will go live once approved.",
            status_code=status.HTTP_201_CREATED,
        )


class MyListingsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="List my listings in any status", responses=ListingOwnerSerializer(many=True))
    def get(self, request: Request) -> Response:
        qs = get_user_listings(request.user, request.query_params.get('status'))
        return _paginate(request, qs, ListingOwnerSerializer)


class ListingDetailView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    @extend_schema(summary="Get listing details", responses=ListingSerializer)
    def get(self, request: Request, id) -> Response:
        listing = get_listing_for_viewer(id, request.user)
        if listing is None:
            return error_response("Listing not found.", status_code=status.HTTP_404_NOT_FOUND)
        if listing.is_publicly_visible:
            ListingService.increment_view_count(listing, request.user)
        serializer_class = _serializer_for(request, listing)
        return success_response(data=serializer_class(listing, context={'request': request}).data)

    @extend_schema(summary="Update listing", request=ListingUpdateSerializer, responses=ListingOwnerSerializer)
    def patch(self, request: Request, id) -> Response:
        listing = _get_managed_listing(id)
        serializer = ListingUpdateSerializer(listing, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Invalid listing data.", errors=serializer.errors)
        listing = ListingService.update_listing(request.user, listing, serializer.validated_data)
        return success_response(
            data=ListingOwnerSerializer(listing, context={'request': request}).data,
            message="Listing updated.",
        )

    @extend_schema(summary="Withdraw and delete listing")
    def delete(self, request: Request, id) -> Response:
        listing = _get_managed_listing(id)
        ListingService.delete_listing(request.user, listing)
        return success_response(message="Listing withdrawn.")


class ListingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Pause / resume / mark sold / withdraw / renew a listing",
                   request=ListingStatusChangeSerializer, responses=ListingOwnerSerializer)
    def post(self, request: Request, id) -> Response:
        serializer = ListingStatusChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid status.", errors=serializer.errors)
        listing = ListingService.change_status(request.user, _get_managed_listing(id), serializer.validated_data['status'])
        return success_response(
            data=ListingOwnerSerializer(listing, context={'request': request}).data,
            message="Listing status updated.",
        )


class ListingMediaView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'listing_media_upload'

    @extend_schema(summary="Upload one or more photos (field: images)", request=ListingMediaUploadSerializer,
                   responses=ListingMediaSerializer(many=True))
    def post(self, request: Request, id) -> Response:
        serializer = ListingMediaUploadSerializer(data={
            'images': request.FILES.getlist('images'),
            'caption': request.data.get('caption', ''),
        })
        if not serializer.is_valid():
            return error_response("Invalid upload.", errors=serializer.errors)
        listing = _get_managed_listing(id)
        media = ListingService.upload_media(
            request.user, listing, serializer.validated_data['images'], serializer.validated_data['caption'],
        )
        return success_response(
            data=ListingMediaSerializer(media, many=True, context={'request': request}).data,
            message=f"{len(media)} photo(s) uploaded.",
            status_code=status.HTTP_201_CREATED,
        )


class ListingMediaDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Delete a photo")
    def delete(self, request: Request, id, media_id) -> Response:
        ListingService.delete_media(request.user, _get_managed_listing(id), media_id)
        return success_response(message="Photo deleted.")


class ListingMediaPrimaryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Set cover photo", request=None, responses=ListingMediaSerializer)
    def post(self, request: Request, id, media_id) -> Response:
        media = ListingService.set_primary_media(request.user, _get_managed_listing(id), media_id)
        return success_response(data=ListingMediaSerializer(media, context={'request': request}).data,
                                message="Cover photo updated.")


class ListingReportView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'listing_report'

    @extend_schema(summary="Report a suspicious listing", request=ListingReportSerializer)
    def post(self, request: Request, id) -> Response:
        serializer = ListingReportSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid report.", errors=serializer.errors)
        listing = get_listing_for_viewer(id, request.user)
        if listing is None:
            return error_response("Listing not found.", status_code=status.HTTP_404_NOT_FOUND)
        ListingService.report_listing(request.user, listing, **serializer.validated_data)
        return success_response(message="Thank you. Our trust & safety team will review this listing.",
                                status_code=status.HTTP_201_CREATED)


class ModerationQueueView(APIView):
    permission_classes = [IsAdmin]

    @extend_schema(summary="Listings awaiting moderation (admin)", responses=ListingOwnerSerializer(many=True))
    def get(self, request: Request) -> Response:
        return _paginate(request, get_moderation_queue(), ListingOwnerSerializer)


class ListingModerateView(APIView):
    permission_classes = [IsAdmin]

    @extend_schema(summary="Approve or reject a listing (admin)", request=ListingModerationSerializer,
                   responses=ListingOwnerSerializer)
    def post(self, request: Request, id) -> Response:
        serializer = ListingModerationSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid moderation decision.", errors=serializer.errors)
        listing = ListingService.moderate(request.user, _get_managed_listing(id), **serializer.validated_data)
        return success_response(data=ListingOwnerSerializer(listing, context={'request': request}).data,
                                message=f"Listing {serializer.validated_data['decision']}d.")

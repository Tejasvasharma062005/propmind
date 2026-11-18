from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from common.utils.response import success_response, error_response
from apps.visits.models import SiteVisit
from apps.visits.serializers import (
    SiteVisitSerializer,
    SiteVisitCreateSerializer,
    SiteVisitUpdateSerializer,
)
from apps.communications.models import Notification
from common.constants.choices import Role


class SiteVisitListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        if user.is_staff or user.has_role(Role.ADMIN):
            qs = SiteVisit.objects.all()
        else:
            qs = SiteVisit.objects.filter(
                Q(visitor=user) | Q(host=user) | Q(property__created_by=user)
            ).distinct()
        qs = qs.select_related('property', 'visitor', 'host').order_by('-scheduled_at')
        return success_response(data=SiteVisitSerializer(qs, many=True).data)

    def post(self, request: Request) -> Response:
        serializer = SiteVisitCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        prop = serializer.validated_data['property']
        visit = serializer.save(visitor=request.user, host=prop.created_by)
        if prop.created_by_id != request.user.id:
            Notification.objects.create(
                user=prop.created_by,
                title=f"Site Visit Scheduled: {prop.title}",
                body=f"{request.user.name} requested a site visit on {visit.scheduled_at.strftime('%d %b %Y %I:%M %p')}.",
                notification_type="VISIT",
                action_url="/dashboard/visits",
            )
        return success_response(
            data=SiteVisitSerializer(visit).data,
            message="Site visit scheduled.",
            status_code=status.HTTP_201_CREATED,
        )


class SiteVisitDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request: Request, id: str) -> Response:
        user = request.user
        visit = SiteVisit.objects.select_related('property', 'visitor', 'host').filter(id=id).first()
        if not visit:
            return error_response("Site visit not found.", status_code=status.HTTP_404_NOT_FOUND)

        if not (
            user.is_staff
            or user.has_role(Role.ADMIN)
            or visit.visitor_id == user.id
            or visit.host_id == user.id
            or visit.property.created_by_id == user.id
        ):
            return error_response("Not authorized to update this site visit.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = SiteVisitUpdateSerializer(visit, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        visit = serializer.save()
        return success_response(data=SiteVisitSerializer(visit).data, message="Site visit updated.")

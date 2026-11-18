from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from common.utils.response import success_response, error_response
from common.services.audit_service import AuditService
from apps.accounts.models import User
from apps.leads.models import Lead
from apps.leads.serializers import (
    LeadSerializer,
    LeadCreateSerializer,
    LeadUpdateSerializer,
    LeadInteractionSerializer,
)
from apps.communications.models import Notification
from common.constants.choices import Role


def _can_manage_lead(user: User, lead: Lead) -> bool:
    return bool(
        user.is_staff
        or user.has_role(Role.ADMIN)
        or lead.assigned_agent_id == user.id
        or (lead.property and lead.property.created_by_id == user.id)
    )


class LeadListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        if user.is_staff or user.has_role(Role.ADMIN):
            qs = Lead.objects.all()
        else:
            qs = Lead.objects.filter(
                Q(buyer=user)
                | Q(assigned_agent=user)
                | Q(property__created_by=user)
            ).distinct()

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        qs = (
            qs.select_related('property', 'buyer', 'assigned_agent')
            .prefetch_related('interactions__logged_by')
            .order_by('-created_at')
        )
        return success_response(data=LeadSerializer(qs, many=True).data)

    def post(self, request: Request) -> Response:
        serializer = LeadCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        lead = serializer.save(buyer=request.user)
        if lead.property and lead.property.created_by_id != request.user.id:
            Notification.objects.create(
                user=lead.property.created_by,
                title=f"New Buyer Inquiry: {lead.property.title}",
                body=f"{request.user.name} inquired: {lead.inquiry_message[:140]}",
                notification_type="LEAD",
                action_url="/dashboard/leads",
            )
        AuditService.log(
            action='LEAD_CREATED',
            target_type='Lead',
            target_id=lead.id,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=LeadSerializer(lead).data,
            message="Inquiry submitted successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class LeadDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request: Request, id: str) -> Response:
        user = request.user
        lead = Lead.objects.select_related('property', 'buyer', 'assigned_agent').filter(id=id).first()
        if not lead:
            return error_response("Lead not found.", status_code=status.HTTP_404_NOT_FOUND)

        if not _can_manage_lead(user, lead):
            return error_response("You do not have permission to update this lead.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = LeadUpdateSerializer(lead, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        lead = serializer.save()
        AuditService.log(
            action='LEAD_UPDATED',
            target_type='Lead',
            target_id=lead.id,
            actor=user,
            request=request,
            metadata={'status': lead.status, 'assigned_agent': str(lead.assigned_agent_id or '')},
        )
        return success_response(data=LeadSerializer(lead).data, message="Lead status updated.")


class LeadInteractionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, id: str) -> Response:
        lead = Lead.objects.select_related('property', 'buyer').filter(id=id).first()
        if not lead:
            return error_response("Lead not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not (_can_manage_lead(request.user, lead) or lead.buyer_id == request.user.id):
            return error_response("Not authorized to log interactions for this lead.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = LeadInteractionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        interaction = serializer.save(lead=lead, logged_by=request.user)
        if interaction.next_follow_up_at:
            lead.next_follow_up_at = interaction.next_follow_up_at
            lead.save(update_fields=['next_follow_up_at', 'updated_at'])
        return success_response(
            data=LeadInteractionSerializer(interaction).data,
            message="Follow-up note logged.",
            status_code=status.HTTP_201_CREATED,
        )


class AgentDirectoryView(APIView):
    """
    Lists verified Agents/Professionals available for lead or visit assignment.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        agents = (
            User.objects.filter(
                Q(user_roles__role__in=[Role.AGENT, Role.NEGOTIATOR, Role.ADMIN], user_roles__is_active=True)
                | Q(is_staff=True)
            )
            .distinct()
            .order_by('name')[:50]
        )
        data = [{'id': str(a.id), 'name': a.name, 'email': a.email, 'phone': a.phone} for a in agents]
        return success_response(data=data)

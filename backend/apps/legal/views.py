from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from common.utils.response import success_response, error_response
from common.permissions.base_permissions import HasRole
from common.constants.choices import Role, VerificationTier, VerificationStatus
from apps.legal.models import TitleSearchReport, LegalDeed
from apps.legal.serializers import TitleSearchReportSerializer, LegalDeedSerializer
from apps.verification.services.verification_service import VerificationService


class TitleSearchReportListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        property_id = request.query_params.get('property_id')
        qs = TitleSearchReport.objects.select_related('property', 'advocate').order_by('-created_at')
        if property_id:
            qs = qs.filter(property_id=property_id)
        return success_response(data=TitleSearchReportSerializer(qs, many=True).data)

    def post(self, request: Request) -> Response:
        user = request.user
        if not (user.is_staff or user.has_role(Role.ADMIN) or user.has_role(Role.ADVOCATE)):
            return error_response("Only licensed advocates or administrators can submit title search reports.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = TitleSearchReportSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        report = serializer.save(advocate=user)
        # Automatically sync the LEGAL tier on the Property Passport
        tier_status = VerificationStatus.VERIFIED if report.is_clear_title else VerificationStatus.FLAGGED
        VerificationService.update_tier_status(
            property_id=str(report.property_id),
            tier=VerificationTier.LEGAL,
            status_val=tier_status,
            verifier=user,
            notes=f"{report.search_period_years}-yr search by {user.name}: {report.legal_opinion[:300]}",
        )
        return success_response(
            data=TitleSearchReportSerializer(report).data,
            message="Title search report filed and Property Passport updated.",
            status_code=status.HTTP_201_CREATED,
        )


class LegalDeedListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        transaction_id = request.query_params.get('transaction_id')
        qs = LegalDeed.objects.select_related('transaction', 'transaction__property').order_by('-created_at')
        if transaction_id:
            qs = qs.filter(transaction_id=transaction_id)
        return success_response(data=LegalDeedSerializer(qs, many=True).data)

    def post(self, request: Request) -> Response:
        serializer = LegalDeedSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        deed = serializer.save()
        return success_response(
            data=LegalDeedSerializer(deed).data,
            message="Legal deed drafted successfully.",
            status_code=status.HTTP_201_CREATED,
        )

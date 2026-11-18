from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from common.utils.response import success_response, error_response
from common.services.audit_service import AuditService
from apps.properties.models import Property
from apps.verification.models import PropertyPassport
from apps.verification.services.verification_service import VerificationService
from apps.verification.services.government_adapters import GovernmentAdapterRegistry
from apps.verification.selectors.verification_selectors import get_passport_by_property_id
from apps.verification.serializers import (
    PropertyPassportSerializer,
    GovernmentVerificationRecordSerializer,
)
from common.permissions.base_permissions import HasRole
from common.constants.choices import (
    Role,
    VerificationTier,
    VerificationStatus,
    AuthenticityLevel,
)


class VerificationQueueView(APIView):
    """
    Lists Property Passports for verification staff/advocates/admins,
    or the authenticated user's own properties' passports.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        is_verifier = (
            user.is_staff
            or user.has_role(Role.ADMIN)
            or user.has_role(Role.VERIFIER)
            or user.has_role(Role.ADVOCATE)
        )
        if is_verifier:
            props = Property.objects.all().order_by('-created_at')[:50]
        else:
            props = Property.objects.filter(created_by=user).order_by('-created_at')

        for p in props:
            VerificationService.get_or_create_passport(str(p.id))

        if is_verifier:
            qs = (
                PropertyPassport.objects.select_related('property', 'property__created_by')
                .prefetch_related('items', 'property__government_verifications')
                .order_by('-updated_at')
            )
        else:
            qs = (
                PropertyPassport.objects.filter(property__created_by=user)
                .select_related('property', 'property__created_by')
                .prefetch_related('items', 'property__government_verifications')
                .order_by('-updated_at')
            )

        return success_response(data=PropertyPassportSerializer(qs, many=True).data)


class PropertyPassportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request, property_id: str) -> Response:
        passport = get_passport_by_property_id(property_id)
        if not passport:
            passport = VerificationService.get_or_create_passport(property_id)
        return success_response(data=PropertyPassportSerializer(passport).data)


class VerifyTierView(APIView):
    permission_classes = [HasRole(Role.ADMIN, Role.VERIFIER, Role.ADVOCATE)]

    def post(self, request: Request, property_id: str) -> Response:
        tier = request.data.get('tier')
        status_val = request.data.get('status')
        notes = request.data.get('notes', '')
        authenticity_level = request.data.get('authenticity_level', AuthenticityLevel.PLATFORM_VERIFIED)
        source_authority = request.data.get('source_authority', '')
        source_reference = request.data.get('source_reference', '')
        verification_method = request.data.get('verification_method', 'MANUAL_PLATFORM_AUDIT')

        if not tier or not status_val:
            return error_response("Both 'tier' and 'status' are required.")
        if tier not in VerificationTier.values:
            return error_response(f"Invalid tier '{tier}'.")
        if status_val not in VerificationStatus.values:
            return error_response(f"Invalid status '{status_val}'.")
        if authenticity_level not in AuthenticityLevel.values:
            authenticity_level = AuthenticityLevel.PLATFORM_VERIFIED

        passport = VerificationService.update_tier_status(
            property_id=property_id,
            tier=tier,
            status_val=status_val,
            verifier=request.user,
            notes=notes,
            authenticity_level=authenticity_level,
            source_authority=source_authority,
            source_reference=source_reference,
            verification_method=verification_method,
        )
        AuditService.log(
            action='PASSPORT_TIER_VERIFIED',
            target_type='PropertyPassport',
            target_id=passport.id,
            actor=request.user,
            request=request,
            metadata={
                'property_id': str(property_id),
                'tier': tier,
                'status': status_val,
                'authenticity_level': authenticity_level,
                'source_reference': source_reference,
            },
        )
        return success_response(
            data=PropertyPassportSerializer(passport).data,
            message=f"Tier '{tier}' verification updated to {status_val} ({authenticity_level})."
        )


class GovernmentSourceListView(APIView):
    """
    Lists all 6 Madhya Pradesh & Indore government sources, their official domains,
    permitted fields, and live API vs. manual reference audit status.
    """
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return success_response(data=GovernmentAdapterRegistry.list_sources())


class PropertyGovernmentCheckView(APIView):
    """
    Lists or records an official government source check (MP Bhulekh, MP RERA,
    MP IGRS SAMPADA, IMC Indore, IDA, MP T&CP) for a property with full provenance.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, property_id: str) -> Response:
        prop = Property.objects.filter(id=property_id).first()
        if not prop:
            return error_response("Property not found.", status_code=status.HTTP_404_NOT_FOUND)
        qs = prop.government_verifications.select_related('verified_by').order_by('-retrieved_at')
        return success_response(data=GovernmentVerificationRecordSerializer(qs, many=True).data)

    def post(self, request: Request, property_id: str) -> Response:
        prop = Property.objects.filter(id=property_id).first()
        if not prop:
            return error_response("Property not found.", status_code=status.HTTP_404_NOT_FOUND)

        authority = request.data.get('authority', '')
        reference_number = request.data.get('reference_number', '')
        metadata = request.data.get('metadata') or {}
        notes = request.data.get('notes', '')
        is_verified = bool(request.data.get('is_verified', True))
        has_signed_certificate = bool(request.data.get('has_signed_gov_certificate', False))

        adapter = GovernmentAdapterRegistry.get_adapter(authority)
        record = adapter.record_verification(
            property_obj=prop,
            reference_number=reference_number,
            submitted_metadata=metadata,
            actor=request.user,
            is_verified_by_reviewer=is_verified,
            has_signed_gov_certificate=has_signed_certificate,
            notes=notes,
        )
        AuditService.log(
            action='GOVERNMENT_SOURCE_CHECK_RECORDED',
            target_type='GovernmentVerificationRecord',
            target_id=record.id,
            actor=request.user,
            request=request,
            metadata={
                'property_id': str(prop.id),
                'authority': record.authority,
                'reference_number': record.reference_number,
                'integration_mode': record.integration_mode,
                'authenticity_level': record.authenticity_level,
            },
        )
        return success_response(
            data=GovernmentVerificationRecordSerializer(record).data,
            message=f"{record.get_authority_display()} provenance record saved ({record.get_authenticity_level_display()}).",
            status_code=status.HTTP_201_CREATED,
        )

"""
Users module API views.
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.accounts.models import User
from apps.users.models import KYCRecord, ProfessionalProfile
from apps.users.serializers import (
    UserDetailSerializer,
    UserProfileUpdateSerializer,
    KYCSubmitSerializer,
    KYCRecordSerializer,
    KYCAdminReviewSerializer,
    ProfessionalProfileSerializer,
    AssignRoleSerializer,
    AuditLogSerializer,
)
from apps.users.services.user_service import UserService
from apps.users.selectors.user_selectors import get_user_detail, get_user_kyc_status
from apps.communications.models import Notification
from common.models import AuditLog
from common.permissions.base_permissions import IsAdmin
from common.services.audit_service import AuditService
from common.utils.response import success_response, error_response


class UserMeView(APIView):
    """
    Retrieves or updates the authenticated user's profile.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(
        responses={200: UserDetailSerializer},
        summary="Get Current User Profile"
    )
    def get(self, request: Request) -> Response:
        user = get_user_detail(request.user.id)
        serializer = UserDetailSerializer(user)
        return success_response(
            data=serializer.data,
            message="Profile fetched successfully."
        )

    @extend_schema(
        request=UserProfileUpdateSerializer,
        responses={200: UserDetailSerializer},
        summary="Update Current User Profile"
    )
    def patch(self, request: Request) -> Response:
        profile = getattr(request.user, 'profile', None)
        serializer = UserProfileUpdateSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Profile update validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        avatar_file = request.FILES.get('avatar')
        UserService.update_profile(
            user_id=request.user.id,
            data=serializer.validated_data,
            avatar_file=avatar_file
        )
        AuditService.log(
            action='USER_PROFILE_UPDATED',
            target_type='User',
            target_id=request.user.id,
            actor=request.user,
            request=request,
        )

        refreshed_user = get_user_detail(request.user.id)
        return success_response(
            data=UserDetailSerializer(refreshed_user).data,
            message="Profile updated successfully."
        )


class UserDetailView(APIView):
    """
    Retrieves any user's authorized profile by UUID (restricted to self or Admin).
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: UserDetailSerializer},
        summary="Get User by ID"
    )
    def get(self, request: Request, id: str) -> Response:
        if str(request.user.id) != str(id) and not (request.user.is_staff or IsAdmin().has_permission(request, self)):
            return error_response(
                message="You do not have permission to view another user's private profile.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        user = get_user_detail(id)
        if not user:
            return error_response(
                message="User not found.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        return success_response(
            data=UserDetailSerializer(user).data,
            message="User retrieved successfully."
        )


class KYCSubmitView(APIView):
    """
    Submits identity verification documents for KYC review.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'kyc_submit'

    @extend_schema(
        request=KYCSubmitSerializer,
        responses={201: KYCRecordSerializer},
        summary="Submit KYC Documents"
    )
    def post(self, request: Request) -> Response:
        serializer = KYCSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="KYC submission validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        kyc_record = UserService.submit_kyc(
            user_id=request.user.id,
            document_type=data['document_type'],
            document_number=data['document_number'],
            front_image=data['front_image'],
            selfie_image=data['selfie_image'],
            back_image=data.get('back_image')
        )
        AuditService.log(
            action='KYC_SUBMITTED',
            target_type='KYCRecord',
            target_id=kyc_record.id,
            actor=request.user,
            request=request,
            metadata={'document_type': kyc_record.document_type},
        )

        return success_response(
            data=KYCRecordSerializer(kyc_record).data,
            message="KYC documents submitted successfully. Verification under review.",
            status_code=status.HTTP_201_CREATED
        )


class KYCStatusView(APIView):
    """
    Returns the current KYC status of the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: KYCRecordSerializer},
        summary="Get KYC Status"
    )
    def get(self, request: Request) -> Response:
        record = get_user_kyc_status(request.user)
        if not record:
            return success_response(
                data={"status": "NOT_SUBMITTED", "message": "No KYC documents submitted yet."}
            )

        return success_response(
            data=KYCRecordSerializer(record).data,
            message="KYC status retrieved."
        )


class KYCAdminQueueView(APIView):
    """
    Lists KYC records for administrator compliance review.
    """
    permission_classes = [IsAdmin]

    def get(self, request: Request) -> Response:
        status_filter = request.query_params.get('status')
        qs = KYCRecord.objects.select_related('user', 'reviewed_by').order_by('-created_at')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return success_response(data=KYCRecordSerializer(qs[:100], many=True).data)


class KYCAdminReviewView(APIView):
    """
    Approves or rejects a KYC record (Admin only).
    """
    permission_classes = [IsAdmin]

    def post(self, request: Request, id: str) -> Response:
        serializer = KYCAdminReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid KYC review payload.", errors=serializer.errors)

        record = UserService.review_kyc(
            kyc_id=id,
            admin_user=request.user,
            decision=serializer.validated_data['decision'],
            rejection_reason=serializer.validated_data.get('rejection_reason', ''),
        )
        AuditService.log(
            action=f"KYC_{record.status}",
            target_type='KYCRecord',
            target_id=record.id,
            actor=request.user,
            request=request,
            metadata={'user_id': str(record.user_id), 'document_type': record.document_type},
        )
        Notification.objects.create(
            user=record.user,
            title=f"KYC Verification {record.get_status_display()}",
            body=(
                f"Your {record.get_document_type_display()} KYC submission has been approved."
                if record.status == 'APPROVED'
                else f"Your KYC submission requires revision: {record.rejection_reason}"
            ),
            notification_type='KYC',
            action_url='/dashboard/kyc',
        )
        return success_response(
            data=KYCRecordSerializer(record).data,
            message=f"KYC record {serializer.validated_data['decision']}d.",
        )


class ProfessionalProfileView(APIView):
    """
    Retrieves or creates/updates the authenticated user's professional credential profile.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request: Request) -> Response:
        prof = ProfessionalProfile.objects.filter(user=request.user).first()
        if not prof:
            return success_response(data=None, message="No professional profile registered.")
        return success_response(data=ProfessionalProfileSerializer(prof).data)

    def post(self, request: Request) -> Response:
        prof = ProfessionalProfile.objects.filter(user=request.user).first()
        serializer = ProfessionalProfileSerializer(prof, data=request.data, partial=bool(prof))
        if not serializer.is_valid():
            return error_response("Professional profile validation failed.", errors=serializer.errors)
        saved = serializer.save(user=request.user)
        AuditService.log(
            action='PROFESSIONAL_PROFILE_SUBMITTED',
            target_type='ProfessionalProfile',
            target_id=saved.id,
            actor=request.user,
            request=request,
            metadata={'profession': saved.profession, 'license_number': saved.license_number},
        )
        return success_response(
            data=ProfessionalProfileSerializer(saved).data,
            message="Professional credentials saved.",
            status_code=status.HTTP_201_CREATED if not prof else status.HTTP_200_OK,
        )


class AssignRoleView(APIView):
    """
    Grants a platform role to a specified user (Admin only).
    """
    permission_classes = [IsAdmin]

    @extend_schema(
        request=AssignRoleSerializer,
        responses={200: OpenApiResponse(description="Role assigned successfully")},
        summary="Assign User Role"
    )
    def post(self, request: Request) -> Response:
        serializer = AssignRoleSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Role assignment validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        user_role = UserService.assign_role(
            user_id=serializer.validated_data['user_id'],
            role=serializer.validated_data['role'],
            assigned_by=request.user
        )
        AuditService.log(
            action='ROLE_ASSIGNED',
            target_type='UserRole',
            target_id=user_role.id,
            actor=request.user,
            request=request,
            metadata={'target_user_id': str(user_role.user_id), 'role': user_role.role},
        )

        return success_response(
            data={
                "user_id": str(user_role.user_id),
                "role": user_role.role,
                "is_active": user_role.is_active
            },
            message=f"Role '{user_role.role}' assigned successfully."
        )


class AdminUsersListView(APIView):
    """
    Lists platform users with their roles and KYC status (Admin only).
    """
    permission_classes = [IsAdmin]

    def get(self, request: Request) -> Response:
        qs = User.objects.select_related('profile', 'professional_profile').prefetch_related('user_roles', 'kyc_records').order_by('-created_at')[:100]
        return success_response(data=UserDetailSerializer(qs, many=True).data)


class AdminAuditLogListView(APIView):
    """
    Lists immutable platform audit logs (Admin only).
    """
    permission_classes = [IsAdmin]

    def get(self, request: Request) -> Response:
        action = request.query_params.get('action')
        qs = AuditLog.objects.all().order_by('-created_at')
        if action:
            qs = qs.filter(action__icontains=action)
        return success_response(data=AuditLogSerializer(qs[:100], many=True).data)

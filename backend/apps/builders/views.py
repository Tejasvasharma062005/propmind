from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from common.utils.response import success_response, error_response
from common.services.audit_service import AuditService
from apps.builders.models import BuilderProfile, Project, ProjectUnit
from apps.builders.serializers import (
    BuilderProfileSerializer,
    ProjectSerializer,
    ProjectUnitSerializer,
)
from common.constants.choices import Role


class BuilderProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        profile = BuilderProfile.objects.filter(user=request.user).first()
        if not profile:
            return success_response(data=None)
        return success_response(data=BuilderProfileSerializer(profile).data)

    def post(self, request: Request) -> Response:
        profile = BuilderProfile.objects.filter(user=request.user).first()
        serializer = BuilderProfileSerializer(profile, data=request.data, partial=bool(profile))
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        saved = serializer.save(user=request.user)
        return success_response(
            data=BuilderProfileSerializer(saved).data,
            message="Builder profile saved.",
            status_code=status.HTTP_201_CREATED if not profile else status.HTTP_200_OK,
        )


class ProjectListView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    def get(self, request: Request) -> Response:
        qs = Project.objects.all().select_related('builder').prefetch_related('units').order_by('-created_at')
        return success_response(data=ProjectSerializer(qs, many=True).data)

    def post(self, request: Request) -> Response:
        user = request.user
        if not (user.is_staff or user.has_role(Role.ADMIN) or user.has_role(Role.BUILDER)):
            return error_response("Only registered Builders or Administrators can create projects.", status_code=status.HTTP_403_FORBIDDEN)

        builder_profile = BuilderProfile.objects.filter(user=user).first()
        if not builder_profile:
            builder_profile = BuilderProfile.objects.create(
                user=user,
                company_name=f"{user.name} Developers",
                rera_number=request.data.get('rera_registration_number') or f"P-IND-{user.id.hex[:6].upper()}",
            )

        serializer = ProjectSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        project = serializer.save(builder=builder_profile)
        AuditService.log(
            action='BUILDER_PROJECT_CREATED',
            target_type='Project',
            target_id=project.id,
            actor=user,
            request=request,
            metadata={'name': project.name, 'rera': project.rera_registration_number},
        )
        return success_response(
            data=ProjectSerializer(project).data,
            message="RERA Project registered.",
            status_code=status.HTTP_201_CREATED,
        )


class ProjectUnitListCreateView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    def get(self, request: Request, project_id: str) -> Response:
        qs = ProjectUnit.objects.filter(project_id=project_id).order_by('tower_or_block', 'floor_number', 'unit_number')
        return success_response(data=ProjectUnitSerializer(qs, many=True).data)

    def post(self, request: Request, project_id: str) -> Response:
        project = Project.objects.select_related('builder').filter(id=project_id).first()
        if not project:
            return error_response("Project not found.", status_code=status.HTTP_404_NOT_FOUND)
        if project.builder.user_id != request.user.id and not request.user.is_staff:
            return error_response("Only the project builder can add inventory units.", status_code=status.HTTP_403_FORBIDDEN)

        serializer = ProjectUnitSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        unit = serializer.save(project=project)
        return success_response(
            data=ProjectUnitSerializer(unit).data,
            message="Project unit added to inventory.",
            status_code=status.HTTP_201_CREATED,
        )

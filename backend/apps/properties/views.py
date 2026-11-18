"""
Property API views.
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.properties.models import Property
from apps.properties.serializers import (
    PropertySerializer,
    PropertyCreateUpdateSerializer,
    PropertyDocumentUploadSerializer,
    PropertyDocumentReviewSerializer,
    PropertyDocumentSerializer,
)
from apps.properties.services.property_service import PropertyService
from apps.properties.selectors.property_selectors import list_active_properties
from common.services.audit_service import AuditService
from common.utils.response import success_response, error_response, paginated_response


def _opt_float(val):
    try:
        return float(val) if val not in (None, '') else None
    except (TypeError, ValueError):
        return None


class PropertyListCreateView(APIView):
    """
    List active properties or create a new property record.
    """
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        summary="List active properties",
        responses={200: PropertySerializer(many=True)}
    )
    def get(self, request: Request) -> Response:
        locality = request.query_params.get('locality')
        city = request.query_params.get('city', 'Indore')
        property_type = request.query_params.get('property_type')
        min_price = _opt_float(request.query_params.get('min_price'))
        max_price = _opt_float(request.query_params.get('max_price'))
        bedrooms = request.query_params.get('bedrooms') or request.query_params.get('bhk')

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        qs = list_active_properties(
            locality=locality,
            city=city,
            property_type=property_type,
            min_price=min_price,
            max_price=max_price,
            bedrooms=int(bedrooms) if bedrooms else None,
            min_lat=_opt_float(request.query_params.get('min_lat')),
            max_lat=_opt_float(request.query_params.get('max_lat')),
            min_lng=_opt_float(request.query_params.get('min_lng')),
            max_lng=_opt_float(request.query_params.get('max_lng')),
            lat=_opt_float(request.query_params.get('lat')),
            lng=_opt_float(request.query_params.get('lng')),
            radius_km=_opt_float(request.query_params.get('radius_km')),
        )

        total_count = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        paged_qs = qs[start:end]

        serializer = PropertySerializer(paged_qs, many=True, context={'request': request})
        return paginated_response(
            data=serializer.data,
            total_count=total_count,
            page=page,
            page_size=page_size,
            message="Properties retrieved successfully."
        )

    @extend_schema(
        request=PropertyCreateUpdateSerializer,
        responses={201: PropertySerializer},
        summary="Create Property"
    )
    def post(self, request: Request) -> Response:
        serializer = PropertyCreateUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Property creation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        prop = PropertyService.create_property(
            user_id=request.user.id,
            data=serializer.validated_data
        )
        AuditService.log(
            action='PROPERTY_CREATED',
            target_type='Property',
            target_id=prop.id,
            actor=request.user,
            request=request,
            metadata={'title': prop.title, 'locality': prop.locality},
        )

        full_prop = PropertyService.get_property(prop.id, user=request.user)
        return success_response(
            data=PropertySerializer(full_prop, context={'request': request}).data,
            message="Property draft created successfully.",
            status_code=status.HTTP_201_CREATED
        )


class PropertyDetailView(APIView):
    """
    Retrieve, update or soft-delete a specific property.
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        responses={200: PropertySerializer},
        summary="Get Property Details"
    )
    def get(self, request: Request, id: str) -> Response:
        prop = PropertyService.get_property(id, user=request.user if request.user.is_authenticated else None)
        return success_response(
            data=PropertySerializer(prop, context={'request': request}).data,
            message="Property details retrieved."
        )

    @extend_schema(
        request=PropertyCreateUpdateSerializer,
        responses={200: PropertySerializer},
        summary="Update Property"
    )
    def patch(self, request: Request, id: str) -> Response:
        serializer = PropertyCreateUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message="Property update validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        updated_prop = PropertyService.update_property(
            property_id=id,
            user_id=request.user.id,
            data=serializer.validated_data
        )
        AuditService.log(
            action='PROPERTY_UPDATED',
            target_type='Property',
            target_id=updated_prop.id,
            actor=request.user,
            request=request,
        )

        full_prop = PropertyService.get_property(updated_prop.id, user=request.user)
        return success_response(
            data=PropertySerializer(full_prop, context={'request': request}).data,
            message="Property updated successfully."
        )

    @extend_schema(
        responses={200: OpenApiResponse(description="Property deleted successfully")},
        summary="Delete Property (Soft Delete)"
    )
    def delete(self, request: Request, id: str) -> Response:
        prop = PropertyService.get_property(id, user=request.user)
        if not PropertyService.check_ownership_or_admin(prop, request.user):
            return error_response(
                message="You do not have permission to delete this property.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        prop.delete()
        AuditService.log(
            action='PROPERTY_DELETED',
            target_type='Property',
            target_id=prop.id,
            actor=request.user,
            request=request,
        )
        return success_response(
            message="Property soft-deleted successfully."
        )


class PropertyDocumentUploadView(APIView):
    """
    Upload title or verification documents for a property.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        request=PropertyDocumentUploadSerializer,
        responses={201: PropertyDocumentSerializer},
        summary="Upload Property Document"
    )
    def post(self, request: Request, id: str) -> Response:
        serializer = PropertyDocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Document upload validation failed.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        doc = PropertyService.add_document(
            property_id=id,
            user_id=request.user.id,
            document_type=data['document_type'],
            document_file=data['document_file'],
            title=data.get('title', ''),
            source_reference=data.get('source_reference', ''),
        )
        AuditService.log(
            action='PROPERTY_DOCUMENT_UPLOADED',
            target_type='PropertyDocument',
            target_id=doc.id,
            actor=request.user,
            request=request,
            metadata={
                'property_id': str(id),
                'document_type': doc.document_type,
                'version': doc.version,
                'checksum_sha256': doc.checksum_sha256,
            },
        )

        return success_response(
            data=PropertyDocumentSerializer(doc).data,
            message="Document uploaded and attached successfully.",
            status_code=status.HTTP_201_CREATED
        )


class PropertyDocumentReviewView(APIView):
    """
    Advocate / Verifier / Admin review of an uploaded PropertyDocument.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, id: str, doc_id: str) -> Response:
        serializer = PropertyDocumentReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Invalid document review payload.", errors=serializer.errors)

        doc = PropertyService.review_document(
            property_id=id,
            document_id=doc_id,
            reviewer=request.user,
            **serializer.validated_data,
        )
        AuditService.log(
            action='PROPERTY_DOCUMENT_REVIEWED',
            target_type='PropertyDocument',
            target_id=doc.id,
            actor=request.user,
            request=request,
            metadata={
                'property_id': str(id),
                'review_status': doc.review_status,
                'authenticity_level': doc.authenticity_level,
            },
        )
        return success_response(
            data=PropertyDocumentSerializer(doc).data,
            message="Document review recorded.",
        )


class PropertySubmitVerificationView(APIView):
    """
    Submit a property for Property Passport verification.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: PropertySerializer},
        summary="Submit Property for Verification"
    )
    def post(self, request: Request, id: str) -> Response:
        prop = PropertyService.submit_for_verification(
            property_id=id,
            user_id=request.user.id
        )
        AuditService.log(
            action='PROPERTY_SUBMITTED_FOR_VERIFICATION',
            target_type='Property',
            target_id=prop.id,
            actor=request.user,
            request=request,
        )

        full_prop = PropertyService.get_property(prop.id, user=request.user)
        return success_response(
            data=PropertySerializer(full_prop, context={'request': request}).data,
            message="Property submitted for verification. Field & title checks initiated."
        )


class MyPropertiesView(APIView):
    """
    Properties the current user created or co-owns (used e.g. by the listing editor).
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="List properties I own or created")
    def get(self, request: Request) -> Response:
        from django.db.models import Q

        qs = (
            Property.objects.filter(
                Q(created_by=request.user)
                | Q(owners__user=request.user, owners__is_deleted=False)
            )
            .distinct()
            .order_by('-created_at')
        )
        data = [
            {
                'id': str(p.id),
                'title': p.title,
                'property_type': p.property_type,
                'property_type_display': p.get_property_type_display(),
                'locality': p.locality,
                'city': p.city,
                'status': p.status,
            }
            for p in qs[:200]
        ]
        return success_response(data=data)

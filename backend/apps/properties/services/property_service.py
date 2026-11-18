"""
Property domain service handling lifecycle, verification triggers, and document attachments.
"""
import hashlib
from typing import Any, Optional
import uuid
from django.db import transaction
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone

from apps.accounts.models import User
from apps.properties.models import Property, PropertyOwner, PropertyAmenity, PropertyDocument
from common.constants.choices import (
    PropertyStatus,
    Role,
    AuthenticityLevel,
    DocumentReviewStatus,
)
from common.exceptions import NotFound, PermissionDenied, BusinessRuleViolation


class PropertyService:
    """
    Encapsulates all business operations for properties, ownership verification,
    and document vault management.
    """

    @classmethod
    def check_ownership_or_admin(cls, property_obj: Property, user: User) -> bool:
        """
        Validates whether the user is an owner, creator, or platform admin.
        """
        if user.is_staff or user.has_role(Role.ADMIN):
            return True
        if property_obj.created_by_id == user.id:
            return True
        return property_obj.owners.filter(user=user).exists()

    @classmethod
    @transaction.atomic
    def create_property(cls, user_id: str | uuid.UUID, data: dict[str, Any]) -> Property:
        """
        Creates a new Property asset, creates the primary PropertyOwner entry,
        and attaches any provided amenities.
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("User not found.")

        amenities_data = data.pop('amenities_list', [])

        prop = Property.objects.create(
            created_by=user,
            status=PropertyStatus.DRAFT,
            **data
        )

        PropertyOwner.objects.create(
            property=prop,
            user=user,
            ownership_percentage=100.00,
            is_primary=True
        )

        if amenities_data:
            amenity_objects = [
                PropertyAmenity(
                    property=prop,
                    amenity_name=amenity.strip()
                )
                for amenity in amenities_data if amenity.strip()
            ]
            PropertyAmenity.objects.bulk_create(amenity_objects, ignore_conflicts=True)

        return prop

    @classmethod
    @transaction.atomic
    def update_property(
        cls,
        property_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
        data: dict[str, Any]
    ) -> Property:
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise NotFound("Property does not exist.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("User does not exist.")

        if not cls.check_ownership_or_admin(prop, user):
            raise PermissionDenied("You do not have permission to modify this property.")

        amenities_data = data.pop('amenities_list', None)

        for key, value in data.items():
            setattr(prop, key, value)

        prop.save()

        if amenities_data is not None:
            prop.amenities.all().delete()
            amenity_objects = [
                PropertyAmenity(
                    property=prop,
                    amenity_name=amenity.strip()
                )
                for amenity in amenities_data if amenity.strip()
            ]
            PropertyAmenity.objects.bulk_create(amenity_objects, ignore_conflicts=True)

        return prop

    @classmethod
    def get_property(
        cls,
        property_id: str | uuid.UUID,
        user: Optional[User] = None
    ) -> Property:
        try:
            prop = (
                Property.objects.filter(id=property_id)
                .select_related('created_by')
                .prefetch_related('owners__user', 'amenities', 'documents__uploaded_by', 'documents__reviewed_by')
                .first()
            )
        except Exception:
            prop = None

        if not prop:
            raise NotFound("Property not found.")

        if prop.status == PropertyStatus.DRAFT:
            if not user or not user.is_authenticated:
                raise PermissionDenied("This property draft is only visible to the owner.")
            if not cls.check_ownership_or_admin(prop, user):
                raise PermissionDenied("This property draft is only visible to the owner.")

        return prop

    @classmethod
    @transaction.atomic
    def submit_for_verification(
        cls,
        property_id: str | uuid.UUID,
        user_id: str | uuid.UUID
    ) -> Property:
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise NotFound("Property not found.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("User not found.")

        if not cls.check_ownership_or_admin(prop, user):
            raise PermissionDenied("You do not have permission to submit this property for verification.")

        if not prop.documents.exists():
            raise BusinessRuleViolation("At least one title or ownership document must be uploaded before submitting for verification.")

        prop.status = PropertyStatus.UNDER_VERIFICATION
        prop.save(update_fields=['status', 'updated_at'])

        # Initialize the PropertyPassport verification case if not already created
        from apps.verification.services.verification_service import VerificationService
        VerificationService.get_or_create_passport(str(prop.id))

        return prop

    @classmethod
    @transaction.atomic
    def add_document(
        cls,
        property_id: str | uuid.UUID,
        user_id: str | uuid.UUID,
        document_type: str,
        document_file: UploadedFile,
        title: str = '',
        source_reference: str = '',
    ) -> PropertyDocument:
        """
        Attaches a title or legal deed document to the property document vault
        with SHA-256 checksum and automatic version increment.
        """
        try:
            prop = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise NotFound("Property not found.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("User not found.")

        if not cls.check_ownership_or_admin(prop, user):
            raise PermissionDenied("You do not have permission to upload documents for this property.")

        raw_bytes = document_file.read()
        checksum = hashlib.sha256(raw_bytes).hexdigest()
        document_file.seek(0)

        existing_versions = PropertyDocument.objects.filter(
            property=prop,
            document_type=document_type,
        ).count()

        doc = PropertyDocument.objects.create(
            property=prop,
            document_type=document_type,
            title=title.strip() or dict(PropertyDocument._meta.get_field('document_type').choices).get(document_type, document_type),
            document_file=document_file,
            version=existing_versions + 1,
            checksum_sha256=checksum,
            review_status=DocumentReviewStatus.PENDING,
            authenticity_level=AuthenticityLevel.USER_SUBMITTED,
            source_reference=source_reference.strip(),
            uploaded_by=user,
        )

        return doc

    @classmethod
    @transaction.atomic
    def review_document(
        cls,
        *,
        property_id: str | uuid.UUID,
        document_id: str | uuid.UUID,
        reviewer: User,
        review_status: str,
        authenticity_level: str = AuthenticityLevel.PLATFORM_VERIFIED,
        source_reference: str = '',
        review_notes: str = '',
    ) -> PropertyDocument:
        if not (
            reviewer.is_staff
            or reviewer.has_role(Role.ADMIN)
            or reviewer.has_role(Role.ADVOCATE)
            or reviewer.has_role(Role.VERIFIER)
        ):
            raise PermissionDenied("Only advocates, verifiers, or administrators can review property documents.")

        doc = PropertyDocument.objects.filter(id=document_id, property_id=property_id).first()
        if not doc:
            raise NotFound("Property document not found.")

        doc.review_status = review_status
        doc.authenticity_level = authenticity_level
        if source_reference.strip():
            doc.source_reference = source_reference.strip()
        doc.reviewed_by = reviewer
        doc.reviewed_at = timezone.now()
        doc.review_notes = review_notes.strip()
        doc.save(
            update_fields=[
                'review_status',
                'authenticity_level',
                'source_reference',
                'reviewed_by',
                'reviewed_at',
                'review_notes',
                'updated_at',
            ]
        )
        return doc

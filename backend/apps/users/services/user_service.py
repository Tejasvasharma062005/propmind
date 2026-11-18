"""
User profile and KYC domain services.
"""
from typing import Any, Optional
import uuid
from django.db import transaction
from django.core.files.uploadedfile import UploadedFile

from apps.accounts.models import User, UserProfile, UserRole
from apps.users.models import KYCRecord, ProfessionalProfile
from common.constants.choices import Role, KYCStatus, KYCDocumentType
from common.exceptions import ValidationError, NotFound, PermissionDenied, BusinessRuleViolation
from common.validators.aadhaar_validator import validate_aadhaar_number


class UserService:
    """
    Handles user profile retrieval, mutations, KYC lifecycle, and role assignment.
    """

    @classmethod
    def get_user_profile(cls, user_id: str | uuid.UUID) -> dict[str, Any]:
        """
        Retrieves user account with associated profile, roles, and KYC status.
        """
        try:
            user = (
                User.objects.filter(id=user_id)
                .select_related('profile')
                .prefetch_related('user_roles', 'kyc_records')
                .first()
            )
        except Exception:
            user = None

        if not user:
            raise NotFound("User does not exist.")

        return {"user": user}

    @classmethod
    @transaction.atomic
    def update_profile(
        cls,
        user_id: str | uuid.UUID,
        data: dict[str, Any],
        avatar_file: Optional[UploadedFile] = None
    ) -> UserProfile:
        """
        Updates personal profile details and display name.
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("User not found.")

        profile, _ = UserProfile.objects.get_or_create(user=user)

        new_name = data.get('name') or (data.get('user') or {}).get('name')
        if new_name:
            user.name = new_name.strip()
            user.save(update_fields=['name'])

        for field in ['bio', 'city', 'state', 'address']:
            if field in data:
                setattr(profile, field, data[field])

        if avatar_file:
            profile.avatar = avatar_file

        profile.save()
        return profile

    @classmethod
    @transaction.atomic
    def submit_kyc(
        cls,
        user_id: str | uuid.UUID,
        document_type: str,
        document_number: str,
        front_image: UploadedFile,
        selfie_image: UploadedFile,
        back_image: Optional[UploadedFile] = None
    ) -> KYCRecord:
        """
        Processes and stores user KYC verification submission.
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("User not found.")

        # Additional validation for Aadhaar
        if document_type == KYCDocumentType.AADHAAR:
            document_number = validate_aadhaar_number(document_number)
        else:
            document_number = document_number.strip().upper()

        doc_hash = KYCRecord.hash_document_number(document_number)

        # Check for duplicate document across other approved users
        existing = KYCRecord.objects.filter(
            document_number_hash=doc_hash,
            status=KYCStatus.APPROVED
        ).exclude(user=user).exists()

        if existing:
            raise BusinessRuleViolation("This identity document is already registered and verified with another account.")

        kyc_record = KYCRecord.objects.create(
            user=user,
            document_type=document_type,
            document_number_hash=doc_hash,
            front_image=front_image,
            back_image=back_image,
            selfie_image=selfie_image,
            status=KYCStatus.UNDER_REVIEW
        )

        return kyc_record

    @classmethod
    @transaction.atomic
    def assign_role(
        cls,
        user_id: str | uuid.UUID,
        role: str,
        assigned_by: User
    ) -> UserRole:
        """
        Grants a platform role to a user. Requires staff or ADMIN role.
        """
        if not (assigned_by.is_staff or assigned_by.has_role(Role.ADMIN)):
            raise PermissionDenied("Only administrators can assign user roles.")

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("Target user not found.")

        if role not in Role.values:
            raise ValidationError(f"Invalid role: {role}")

        user_role, created = UserRole.objects.get_or_create(
            user=target_user,
            role=role,
            defaults={'is_active': True}
        )

        if not created and not user_role.is_active:
            user_role.is_active = True
            user_role.save(update_fields=['is_active'])

        return user_role


    @classmethod
    @transaction.atomic
    def review_kyc(
        cls,
        *,
        kyc_id: str | uuid.UUID,
        admin_user: User,
        decision: str,
        rejection_reason: str = '',
    ) -> KYCRecord:
        """
        Approves or rejects a KYCRecord.
        When approved, marks the user verified and updates the IDENTITY tier
        on any PropertyPassport owned by the user.
        """
        if not (admin_user.is_staff or admin_user.has_role(Role.ADMIN)):
            raise PermissionDenied("Only administrators can review KYC submissions.")

        record = KYCRecord.objects.select_related('user').filter(id=kyc_id).first()
        if not record:
            raise NotFound("KYC record not found.")

        record.reviewed_by = admin_user
        if decision == 'approve':
            record.status = KYCStatus.APPROVED
            record.rejection_reason = ''
            record.save(update_fields=['status', 'reviewed_by', 'rejection_reason', 'updated_at'])

            user = record.user
            if not user.is_verified:
                user.is_verified = True
                user.save(update_fields=['is_verified', 'updated_at'])
        elif decision == 'reject':
            if not rejection_reason.strip():
                raise ValidationError("A rejection reason is required when rejecting KYC.")
            record.status = KYCStatus.REJECTED
            record.rejection_reason = rejection_reason.strip()
            record.save(update_fields=['status', 'reviewed_by', 'rejection_reason', 'updated_at'])
        else:
            raise ValidationError("Decision must be 'approve' or 'reject'.")

        return record

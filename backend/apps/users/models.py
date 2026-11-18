"""
Users models: KYCRecord and ProfessionalProfile.
Uses randomized UUID storage keys so client-supplied filenames are never exposed.
"""
import hashlib
import uuid
from django.db import models
from django.conf import settings
from common.models import BaseModel
from common.constants.choices import KYCDocumentType, KYCStatus, ProfessionType


def _safe_ext(filename: str, allowed=('jpg', 'jpeg', 'png', 'webp', 'pdf'), default='jpg') -> str:
    ext = (filename.rsplit('.', 1)[-1] if '.' in filename else default).lower()
    return ext if ext in allowed else default


def kyc_document_upload_path(instance: 'KYCRecord', filename: str) -> str:
    return f"kyc/documents/{instance.user_id}/{uuid.uuid4().hex}.{_safe_ext(filename)}"


def kyc_selfie_upload_path(instance: 'KYCRecord', filename: str) -> str:
    return f"kyc/selfies/{instance.user_id}/{uuid.uuid4().hex}.{_safe_ext(filename)}"


def professional_license_upload_path(instance: 'ProfessionalProfile', filename: str) -> str:
    return f"professionals/licenses/{instance.user_id}/{uuid.uuid4().hex}.{_safe_ext(filename)}"


class KYCRecord(BaseModel):
    """
    Verification record for user identity documents (Aadhaar, PAN, Passport).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='kyc_records',
        help_text="User submitting this KYC record"
    )
    document_type = models.CharField(
        max_length=30,
        choices=KYCDocumentType.choices,
        help_text="Type of official identity document"
    )
    document_number_hash = models.CharField(
        max_length=128,
        help_text="SHA-256 hash of the identity document number for uniqueness and privacy"
    )
    front_image = models.ImageField(
        upload_to=kyc_document_upload_path,
        help_text="Front face of the identity document"
    )
    back_image = models.ImageField(
        upload_to=kyc_document_upload_path,
        null=True,
        blank=True,
        help_text="Back face of the identity document (if applicable)"
    )
    selfie_image = models.ImageField(
        upload_to=kyc_selfie_upload_path,
        help_text="Live verification selfie of user"
    )
    status = models.CharField(
        max_length=30,
        choices=KYCStatus.choices,
        default=KYCStatus.PENDING,
        db_index=True,
        help_text="Review lifecycle status"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_kyc_records',
        help_text="Admin or Compliance staff who audited this record"
    )
    rejection_reason = models.TextField(
        blank=True,
        default='',
        help_text="Reason for rejection if status is REJECTED"
    )

    class Meta:
        verbose_name = 'KYC Record'
        verbose_name_plural = 'KYC Records'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"KYC ({self.document_type}) for {self.user.email} - Status: {self.status}"

    @staticmethod
    def hash_document_number(doc_num: str) -> str:
        """Hash document number using SHA-256 for privacy."""
        return hashlib.sha256(doc_num.strip().upper().encode('utf-8')).hexdigest()


class ProfessionalProfile(BaseModel):
    """
    Profile for licensed real estate professionals (Agents, Advocates, Verifiers, Negotiators).
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='professional_profile',
        help_text="User owning this professional credential"
    )
    profession = models.CharField(
        max_length=30,
        choices=ProfessionType.choices,
        help_text="Professional designation"
    )
    license_number = models.CharField(
        max_length=100,
        unique=True,
        help_text="Official RERA or Bar Council registration / license number"
    )
    license_document = models.FileField(
        upload_to=professional_license_upload_path,
        null=True,
        blank=True,
        help_text="Proof of professional accreditation / RERA certificate"
    )
    agency_name = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text="Associated real estate brokerage, law firm, or agency"
    )
    years_experience = models.PositiveIntegerField(
        default=0,
        help_text="Total years of professional practice in the local market"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether platform admin has certified this professional"
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_professionals',
        help_text="Platform administrator who verified these credentials"
    )

    class Meta:
        verbose_name = 'Professional Profile'
        verbose_name_plural = 'Professional Profiles'

    def __str__(self) -> str:
        return f"{self.user.name} - {self.profession} ({self.license_number})"

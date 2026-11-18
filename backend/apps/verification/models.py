"""
Verification, Digital Property Passport, and Government Provenance Models.
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel
from apps.properties.models import Property
from common.constants.choices import (
    VerificationTier,
    VerificationStatus,
    AuthenticityLevel,
    GovernmentSourceAuthority,
    IntegrationMode,
    RiskLevel,
)


def verification_evidence_upload_path(instance: 'VerificationItem', filename: str) -> str:
    ext = (filename.rsplit('.', 1)[-1] if '.' in filename else 'pdf').lower()
    if ext not in ('pdf', 'jpg', 'jpeg', 'png', 'webp'):
        ext = 'pdf'
    return f"verifications/evidence/{instance.passport_id}/{uuid.uuid4().hex}.{ext}"


class PropertyPassport(BaseModel):
    """
    Property Passport score, 5-category trust checklist, authenticity classification,
    and risk summary.
    """
    property = models.OneToOneField(
        Property,
        on_delete=models.CASCADE,
        related_name='passport',
        help_text="Target property"
    )
    overall_score = models.PositiveIntegerField(
        default=0,
        help_text="Trust score 0-100%"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether property has achieved full 5-pillar platform verification"
    )
    authenticity_summary = models.CharField(
        max_length=30,
        choices=AuthenticityLevel.choices,
        default=AuthenticityLevel.VERIFICATION_PENDING,
        help_text="Highest verified authenticity classification across pillars"
    )
    risk_level = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        default=RiskLevel.LOW,
    )
    risk_notes = models.TextField(blank=True, default='')
    identity_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.NOT_STARTED
    )
    ownership_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.NOT_STARTED
    )
    legal_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.NOT_STARTED
    )
    physical_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.NOT_STARTED
    )
    financial_status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.NOT_STARTED
    )
    last_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of latest verification"
    )

    class Meta:
        verbose_name = 'Property Passport'
        verbose_name_plural = 'Property Passports'

    def __str__(self) -> str:
        return f"Passport for {self.property.title} ({self.overall_score}%)"

    def recalculate_score(self) -> int:
        statuses = [
            self.identity_status,
            self.ownership_status,
            self.legal_status,
            self.physical_status,
            self.financial_status,
        ]
        verified_count = sum(1 for s in statuses if s == VerificationStatus.VERIFIED)
        flagged_count = sum(1 for s in statuses if s in (VerificationStatus.FLAGGED, VerificationStatus.REJECTED))
        score = int((verified_count / 5.0) * 100)
        self.overall_score = score
        self.is_verified = (score == 100 and flagged_count == 0)
        if verified_count > 0:
            self.last_verified_at = timezone.now()

        if flagged_count > 0:
            self.risk_level = RiskLevel.HIGH
            self.authenticity_summary = AuthenticityLevel.UNABLE_TO_VERIFY
        elif self.is_verified:
            self.risk_level = RiskLevel.LOW
            item_levels = set(self.items.values_list('authenticity_level', flat=True))
            if item_levels == {AuthenticityLevel.GOVERNMENT_VERIFIED}:
                self.authenticity_summary = AuthenticityLevel.GOVERNMENT_VERIFIED
            else:
                self.authenticity_summary = AuthenticityLevel.PLATFORM_VERIFIED
        elif verified_count > 0:
            self.authenticity_summary = AuthenticityLevel.PLATFORM_VERIFIED
        else:
            self.authenticity_summary = AuthenticityLevel.VERIFICATION_PENDING

        self.save(
            update_fields=[
                'overall_score',
                'is_verified',
                'authenticity_summary',
                'risk_level',
                'last_verified_at',
                'updated_at',
            ]
        )
        return score


class VerificationItem(BaseModel):
    """
    Individual category verification audit trail with explicit data provenance.
    """
    passport = models.ForeignKey(
        PropertyPassport,
        on_delete=models.CASCADE,
        related_name='items'
    )
    tier = models.CharField(
        max_length=30,
        choices=VerificationTier.choices
    )
    status = models.CharField(
        max_length=30,
        choices=VerificationStatus.choices,
        default=VerificationStatus.NOT_STARTED
    )
    authenticity_level = models.CharField(
        max_length=30,
        choices=AuthenticityLevel.choices,
        default=AuthenticityLevel.VERIFICATION_PENDING,
        help_text="Distinguishes Government Verified vs Platform Verified vs User Submitted"
    )
    source_authority = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="Official authority or source checked (e.g. MP_BHULEKH, MP_RERA)"
    )
    source_reference = models.CharField(
        max_length=150,
        blank=True,
        default='',
        help_text="Khasra number, RERA ID, Sub-Registrar deed number, or IMC service ID"
    )
    verification_method = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Method used (e.g. MANUAL_OFFICIAL_PORTAL_AUDIT, PHYSICAL_SURVEY)"
    )
    retrieved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when external source record was retrieved/checked"
    )
    freshness_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when this verification check expires"
    )
    risk_level = models.CharField(
        max_length=20,
        choices=RiskLevel.choices,
        default=RiskLevel.LOW,
    )
    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conducted_verifications'
    )
    notes = models.TextField(
        blank=True,
        default=''
    )
    evidence_document = models.FileField(
        upload_to=verification_evidence_upload_path,
        null=True,
        blank=True
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = 'Verification Item'
        verbose_name_plural = 'Verification Items'
        unique_together = ('passport', 'tier')

    def __str__(self) -> str:
        return f"{self.tier} verification for {self.passport.property.title} -> {self.status} ({self.authenticity_level})"


class GovernmentVerificationRecord(BaseModel):
    """
    Provenance record of an official Madhya Pradesh / Indore government source check.
    Explicitly records whether the check ran via an authorized live API or a manual
    audit against an official government reference number.
    """
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='government_verifications',
    )
    authority = models.CharField(
        max_length=40,
        choices=GovernmentSourceAuthority.choices,
        db_index=True,
    )
    official_domain = models.CharField(max_length=120)
    responsible_department = models.CharField(max_length=200)
    integration_mode = models.CharField(
        max_length=50,
        choices=IntegrationMode.choices,
        default=IntegrationMode.PENDING_AUTHORIZATION_MANUAL_AUDIT,
    )
    reference_number = models.CharField(
        max_length=150,
        db_index=True,
        help_text="Official Khasra / RERA / SAMPADA Deed / IMC Tax Service / T&CP Sanction number"
    )
    authenticity_level = models.CharField(
        max_length=30,
        choices=AuthenticityLevel.choices,
        default=AuthenticityLevel.VERIFICATION_PENDING,
    )
    mapped_tier = models.CharField(
        max_length=30,
        choices=VerificationTier.choices,
        default=VerificationTier.LEGAL,
    )
    query_parameters_json = models.JSONField(default=dict, blank=True)
    verified_data_json = models.JSONField(default=dict, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='government_checks_conducted',
    )
    retrieved_at = models.DateTimeField(default=timezone.now)
    freshness_expires_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        verbose_name = 'Government Verification Record'
        verbose_name_plural = 'Government Verification Records'
        ordering = ['-retrieved_at']

    def __str__(self) -> str:
        return f"{self.authority} [{self.reference_number}] -> {self.authenticity_level}"

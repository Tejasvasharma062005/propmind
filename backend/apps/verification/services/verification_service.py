from datetime import timedelta
from django.utils import timezone
from apps.verification.models import PropertyPassport, VerificationItem
from apps.properties.models import Property
from common.constants.choices import (
    VerificationTier,
    VerificationStatus,
    PropertyStatus,
    AuthenticityLevel,
    RiskLevel,
)


class VerificationService:
    @classmethod
    def get_or_create_passport(cls, property_id: str) -> PropertyPassport:
        prop = Property.objects.get(id=property_id)
        passport, created = PropertyPassport.objects.get_or_create(property=prop)
        if created or passport.items.count() < 5:
            for tier in VerificationTier.values:
                VerificationItem.objects.get_or_create(passport=passport, tier=tier)
        return passport

    @classmethod
    def update_tier_status(
        cls,
        *,
        property_id: str,
        tier: str,
        status_val: str,
        verifier,
        notes: str = '',
        authenticity_level: str = AuthenticityLevel.PLATFORM_VERIFIED,
        source_authority: str = '',
        source_reference: str = '',
        verification_method: str = 'MANUAL_PLATFORM_AUDIT',
        freshness_days: int = 90,
    ) -> PropertyPassport:
        passport = cls.get_or_create_passport(property_id)
        item, _ = VerificationItem.objects.get_or_create(passport=passport, tier=tier)
        now = timezone.now()

        item.status = status_val
        item.verifier = verifier
        item.notes = notes
        item.verification_method = verification_method
        if source_authority:
            item.source_authority = source_authority
        if source_reference:
            item.source_reference = source_reference
        item.retrieved_at = now
        item.freshness_expires_at = now + timedelta(days=freshness_days)

        if status_val == VerificationStatus.VERIFIED:
            item.verified_at = now
            item.authenticity_level = authenticity_level
            item.risk_level = RiskLevel.LOW
        elif status_val in (VerificationStatus.FLAGGED, VerificationStatus.REJECTED):
            item.authenticity_level = AuthenticityLevel.UNABLE_TO_VERIFY
            item.risk_level = RiskLevel.HIGH
        else:
            item.authenticity_level = AuthenticityLevel.VERIFICATION_PENDING
            item.risk_level = RiskLevel.MEDIUM

        item.save()

        field_map = {
            VerificationTier.IDENTITY: 'identity_status',
            VerificationTier.OWNERSHIP: 'ownership_status',
            VerificationTier.LEGAL: 'legal_status',
            VerificationTier.PHYSICAL: 'physical_status',
            VerificationTier.FINANCIAL: 'financial_status',
        }
        if tier in field_map:
            setattr(passport, field_map[tier], status_val)
            passport.save()

        passport.recalculate_score()
        if passport.is_verified:
            prop = passport.property
            prop.status = PropertyStatus.VERIFIED
            prop.save(update_fields=['status', 'updated_at'])

        return passport

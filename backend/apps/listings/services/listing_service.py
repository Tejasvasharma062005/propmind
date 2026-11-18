"""
Listing service layer: all write-side business rules for listings.
"""
import uuid
from datetime import timedelta
from typing import Any, Iterable

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from apps.listings.models import (
    LIVE_LISTING_STATUSES,
    Listing,
    ListingMedia,
    ListingReport,
)
from apps.properties.models import Property
from common.constants.choices import ListingStatus, PropertyStatus
from common.exceptions import BusinessRuleViolation, NotFound, PermissionDenied, ValidationError
from common.validators.image_validator import process_uploaded_image

LISTING_VALIDITY_DAYS = getattr(settings, 'LISTING_VALIDITY_DAYS', 90)
MAX_MEDIA_PER_LISTING = getattr(settings, 'LISTING_MAX_MEDIA', 20)
MAX_FILES_PER_UPLOAD = 10
AUTO_HIDE_REPORT_THRESHOLD = getattr(settings, 'LISTING_AUTO_HIDE_REPORTS', 5)

EDITABLE_STATUSES = {
    ListingStatus.PENDING_APPROVAL,
    ListingStatus.ACTIVE,
    ListingStatus.PAUSED,
    ListingStatus.REJECTED,
}
CLOSED_STATUSES = {ListingStatus.SOLD, ListingStatus.WITHDRAWN}

# Owner-initiated transitions: current status -> allowed target statuses.
# Approval (-> ACTIVE from PENDING_APPROVAL) is reserved for moderators.
OWNER_TRANSITIONS: dict[str, set[str]] = {
    ListingStatus.PENDING_APPROVAL: {ListingStatus.WITHDRAWN},
    ListingStatus.ACTIVE: {ListingStatus.PAUSED, ListingStatus.SOLD, ListingStatus.WITHDRAWN},
    ListingStatus.PAUSED: {ListingStatus.ACTIVE, ListingStatus.SOLD, ListingStatus.WITHDRAWN},
    ListingStatus.REJECTED: {ListingStatus.PENDING_APPROVAL, ListingStatus.WITHDRAWN},
    ListingStatus.EXPIRED: {ListingStatus.PENDING_APPROVAL, ListingStatus.WITHDRAWN},
}


def _is_staff(user) -> bool:
    return bool(user.is_staff or getattr(user, 'is_superuser', False))


def _user_controls_property(user, prop: Property) -> bool:
    return prop.created_by_id == user.id or prop.owners.filter(user=user, is_deleted=False).exists()


def _assert_can_manage(user, listing: Listing) -> None:
    if listing.listed_by_id != user.id and not _is_staff(user):
        raise PermissionDenied("You do not have permission to manage this listing.")


class ListingService:
    # ------------------------------------------------------------------ #
    # Listing lifecycle
    # ------------------------------------------------------------------ #
    @classmethod
    @transaction.atomic
    def create_listing(cls, user, data: dict[str, Any]) -> Listing:
        if not getattr(user, 'is_verified', False):
            raise PermissionDenied("Verify your phone/email before publishing listings.")

        prop: Property = data['property']
        if prop.is_deleted:
            raise NotFound("Property not found.")
        if not _user_controls_property(user, prop) and not _is_staff(user):
            raise PermissionDenied("You can only create listings for properties you own.")
        if prop.status in (PropertyStatus.SOLD, PropertyStatus.WITHDRAWN):
            raise BusinessRuleViolation("This property is no longer available for listing.")

        if Listing.objects.filter(
            property=prop,
            listing_type=data['listing_type'],
            status__in=LIVE_LISTING_STATUSES,
        ).exists():
            raise BusinessRuleViolation("A live listing of this type already exists for this property.")

        try:
            with transaction.atomic():
                listing = Listing.objects.create(
                    listed_by=user,
                    status=ListingStatus.PENDING_APPROVAL,
                    **data,
                )
        except IntegrityError:
            raise BusinessRuleViolation("A live listing of this type already exists for this property.")

        if prop.status == PropertyStatus.DRAFT:
            prop.status = PropertyStatus.ACTIVE
            prop.save(update_fields=['status', 'updated_at'])
        return listing

    @classmethod
    @transaction.atomic
    def update_listing(cls, user, listing: Listing, data: dict[str, Any]) -> Listing:
        _assert_can_manage(user, listing)
        if listing.status not in EDITABLE_STATUSES:
            raise BusinessRuleViolation(f"A listing in status {listing.status} cannot be edited.")

        for attr, value in data.items():
            setattr(listing, attr, value)

        update_fields = list(data.keys()) + ['updated_at']
        # Editing a rejected listing re-submits it for moderation
        if listing.status == ListingStatus.REJECTED:
            listing.status = ListingStatus.PENDING_APPROVAL
            listing.rejection_reason = ''
            update_fields += ['status', 'rejection_reason']
        listing.save(update_fields=update_fields)
        return listing

    @classmethod
    @transaction.atomic
    def change_status(cls, user, listing: Listing, new_status: str) -> Listing:
        _assert_can_manage(user, listing)
        allowed = OWNER_TRANSITIONS.get(listing.status, set())
        if new_status not in allowed:
            raise BusinessRuleViolation(f"Cannot change listing from {listing.status} to {new_status}.")

        if new_status == ListingStatus.ACTIVE:
            # Resuming a paused listing is only allowed if it was approved and has not expired
            if listing.reviewed_at is None:
                raise BusinessRuleViolation("This listing has not been approved yet.")
            if listing.expires_at and listing.expires_at <= timezone.now():
                listing.status = ListingStatus.EXPIRED
                listing.save(update_fields=['status', 'updated_at'])
                raise BusinessRuleViolation("This listing has expired. Renew it to resubmit for approval.")

        listing.status = new_status
        fields = ['status', 'updated_at']
        if new_status == ListingStatus.PENDING_APPROVAL:
            listing.rejection_reason = ''
            fields.append('rejection_reason')
        listing.save(update_fields=fields)
        return listing

    @classmethod
    @transaction.atomic
    def delete_listing(cls, user, listing: Listing) -> None:
        _assert_can_manage(user, listing)
        listing.status = ListingStatus.WITHDRAWN
        listing.save(update_fields=['status', 'updated_at'])
        listing.delete()  # soft delete (keeps audit trail)

    @classmethod
    def increment_view_count(cls, listing: Listing, viewer) -> None:
        if viewer and viewer.is_authenticated and viewer.id == listing.listed_by_id:
            return
        Listing.objects.filter(id=listing.id).update(views_count=F('views_count') + 1)

    # ------------------------------------------------------------------ #
    # Moderation (admin only - enforced in views)
    # ------------------------------------------------------------------ #
    @classmethod
    @transaction.atomic
    def moderate(cls, admin_user, listing: Listing, decision: str, reason: str = '') -> Listing:
        if listing.status != ListingStatus.PENDING_APPROVAL:
            raise BusinessRuleViolation("Only listings pending approval can be moderated.")
        now = timezone.now()
        listing.reviewed_by = admin_user
        listing.reviewed_at = now
        if decision == 'approve':
            if not listing.media.exists():
                raise BusinessRuleViolation("A listing needs at least one photo before approval.")
            listing.status = ListingStatus.ACTIVE
            listing.rejection_reason = ''
            listing.published_at = listing.published_at or now
            listing.expires_at = now + timedelta(days=LISTING_VALIDITY_DAYS)
        elif decision == 'reject':
            if not reason.strip():
                raise ValidationError("A rejection reason is required.")
            listing.status = ListingStatus.REJECTED
            listing.rejection_reason = reason.strip()
        else:
            raise ValidationError("Decision must be 'approve' or 'reject'.")
        listing.save()
        return listing

    @classmethod
    def expire_stale_listings(cls) -> int:
        """Mark listings past their expiry as EXPIRED. Intended for a periodic Celery task."""
        return Listing.objects.filter(
            status__in=[ListingStatus.ACTIVE, ListingStatus.PAUSED],
            expires_at__lte=timezone.now(),
        ).update(status=ListingStatus.EXPIRED, updated_at=timezone.now())

    # ------------------------------------------------------------------ #
    # Media
    # ------------------------------------------------------------------ #
    @classmethod
    @transaction.atomic
    def upload_media(cls, user, listing: Listing, files: Iterable, caption: str = '') -> list[ListingMedia]:
        _assert_can_manage(user, listing)
        if listing.status in CLOSED_STATUSES:
            raise BusinessRuleViolation("Cannot add photos to a closed listing.")

        files = list(files)
        if not files:
            raise ValidationError("No images were provided.")
        if len(files) > MAX_FILES_PER_UPLOAD:
            raise ValidationError(f"Upload at most {MAX_FILES_PER_UPLOAD} images at a time.")

        # Lock the listing row to make the count check race-free
        Listing.objects.select_for_update().filter(id=listing.id).first()
        existing = listing.media.count()
        if existing + len(files) > MAX_MEDIA_PER_LISTING:
            raise ValidationError(f"A listing can have at most {MAX_MEDIA_PER_LISTING} photos.")

        has_primary = listing.media.filter(is_primary=True).exists()
        created: list[ListingMedia] = []
        seen_checksums: set[str] = set()

        for index, uploaded in enumerate(files):
            processed = process_uploaded_image(uploaded)
            if processed.checksum_sha256 in seen_checksums or listing.media.filter(
                checksum_sha256=processed.checksum_sha256
            ).exists():
                raise ValidationError(f"'{uploaded.name}' has already been uploaded to this listing.")
            seen_checksums.add(processed.checksum_sha256)

            media = ListingMedia(
                listing=listing,
                uploaded_by=user,
                caption=caption[:200],
                display_order=existing + index,
                is_primary=not has_primary and index == 0,
                content_type=processed.content_type,
                file_size=processed.size,
                width=processed.width,
                height=processed.height,
                checksum_sha256=processed.checksum_sha256,
            )
            media.image.save(f"upload.{processed.extension}", processed.content, save=False)
            media.save()
            created.append(media)

        return created

    @classmethod
    @transaction.atomic
    def delete_media(cls, user, listing: Listing, media_id: uuid.UUID) -> None:
        _assert_can_manage(user, listing)
        media = listing.media.filter(id=media_id).first()
        if media is None:
            raise NotFound("Photo not found.")
        was_primary = media.is_primary
        media.image.delete(save=False)  # remove the object from storage (privacy)
        media.hard_delete()
        if was_primary:
            next_media = listing.media.order_by('display_order', 'created_at').first()
            if next_media:
                next_media.is_primary = True
                next_media.save(update_fields=['is_primary', 'updated_at'])

    @classmethod
    @transaction.atomic
    def set_primary_media(cls, user, listing: Listing, media_id: uuid.UUID) -> ListingMedia:
        _assert_can_manage(user, listing)
        media = listing.media.filter(id=media_id).first()
        if media is None:
            raise NotFound("Photo not found.")
        listing.media.filter(is_primary=True).update(is_primary=False)
        media.is_primary = True
        media.save(update_fields=['is_primary', 'updated_at'])
        return media

    # ------------------------------------------------------------------ #
    # Reporting
    # ------------------------------------------------------------------ #
    @classmethod
    @transaction.atomic
    def report_listing(cls, user, listing: Listing, reason: str, details: str = '') -> ListingReport:
        if listing.listed_by_id == user.id:
            raise BusinessRuleViolation("You cannot report your own listing.")
        if ListingReport.objects.filter(listing=listing, reported_by=user).exists():
            raise BusinessRuleViolation("You have already reported this listing.")
        try:
            with transaction.atomic():
                report = ListingReport.objects.create(
                    listing=listing, reported_by=user, reason=reason, details=details,
                )
        except IntegrityError:
            raise BusinessRuleViolation("You have already reported this listing.")

        Listing.objects.filter(id=listing.id).update(report_count=F('report_count') + 1)
        listing.refresh_from_db(fields=['report_count', 'status'])

        # Safety net: hide heavily-reported listings until a moderator reviews them
        if listing.report_count >= AUTO_HIDE_REPORT_THRESHOLD and listing.status == ListingStatus.ACTIVE:
            listing.status = ListingStatus.PENDING_APPROVAL
            listing.save(update_fields=['status', 'updated_at'])
        return report

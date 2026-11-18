"""
Tests for the listings module: moderation gate, ownership, privacy, media security, reporting.
"""
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.listings.models import Listing, ListingMedia
from apps.properties.models import Property
from common.constants.choices import ListingStatus

BASE = '/api/v1/listings/'


def make_image(name='photo.jpg', size=(400, 300), fmt='JPEG', color=(200, 100, 50), exif_gps=False):
    buf = BytesIO()
    img = Image.new('RGB', size, color)
    kwargs = {}
    if exif_gps:
        exif = Image.Exif()
        exif[0x8825] = {1: 'N', 2: (22.0, 43.0, 10.0)}  # GPSInfo
        kwargs['exif'] = exif
    img.save(buf, format=fmt, **kwargs)
    mime = {'JPEG': 'image/jpeg', 'PNG': 'image/png'}[fmt]
    return SimpleUploadedFile(name, buf.getvalue(), content_type=mime)


class ListingTestBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user('owner@test.in', '9876543210', 'Ravi Sharma', 'Pass@1234', is_verified=True)
        cls.other = User.objects.create_user('other@test.in', '9876543211', 'Other User', 'Pass@1234', is_verified=True)
        cls.unverified = User.objects.create_user('unv@test.in', '9876543212', 'Unverified', 'Pass@1234')
        cls.admin = User.objects.create_superuser('admin@test.in', '9876543213', 'Admin', 'Pass@1234')
        cls.prop = Property.objects.create(
            created_by=cls.owner, property_type='APARTMENT', title='3BHK Vijay Nagar',
            description='Nice flat', address='Flat 501, Secret Tower, Scheme 54', locality='Vijay Nagar',
            pincode='452010', built_up_area=1500, bedrooms=3,
            latitude='22.753412', longitude='75.893456',
        )

    def setUp(self):
        self.client = APIClient()

    def create_listing(self, user=None, **overrides):
        self.client.force_authenticate(user or self.owner)
        payload = {'property': str(self.prop.id), 'listing_type': 'SALE', 'asking_price': '7500000'}
        payload.update(overrides)
        return self.client.post(BASE, payload, format='json')

    def approved_listing(self):
        resp = self.create_listing()
        listing = Listing.objects.get(id=resp.data['data']['id'])
        self.client.force_authenticate(self.owner)
        self.client.post(f'{BASE}{listing.id}/media/', {'images': [make_image()]}, format='multipart')
        self.client.force_authenticate(self.admin)
        self.client.post(f'{BASE}{listing.id}/moderate/', {'decision': 'approve'}, format='json')
        listing.refresh_from_db()
        self.client.force_authenticate(None)
        return listing


class ListingCreationTests(ListingTestBase):
    def test_new_listing_enters_moderation_and_is_hidden(self):
        resp = self.create_listing()
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data['data']['status'], ListingStatus.PENDING_APPROVAL)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(BASE).data['pagination']['total_count'], 0)
        self.assertEqual(self.client.get(f"{BASE}{resp.data['data']['id']}/").status_code, 404)

    def test_unverified_user_cannot_list(self):
        self.assertEqual(self.create_listing(user=self.unverified).status_code, 403)

    def test_cannot_list_someone_elses_property(self):
        self.assertEqual(self.create_listing(user=self.other).status_code, 403)

    def test_duplicate_live_listing_blocked(self):
        self.create_listing()
        self.assertEqual(self.create_listing().status_code, 422)

    def test_can_relist_after_previous_listing_closed(self):
        first_id = self.create_listing().data['data']['id']
        Listing.objects.filter(id=first_id).update(status=ListingStatus.SOLD)
        self.assertEqual(self.create_listing().status_code, 201)

    def test_client_cannot_set_featured_or_status(self):
        resp = self.create_listing(is_featured=True, status='ACTIVE')
        self.assertEqual(resp.status_code, 201)
        listing = Listing.objects.get(id=resp.data['data']['id'])
        self.assertFalse(listing.is_featured)
        self.assertEqual(listing.status, ListingStatus.PENDING_APPROVAL)

    def test_deposit_rejected_for_sale(self):
        self.assertEqual(self.create_listing(security_deposit='50000').status_code, 400)


class ModerationTests(ListingTestBase):
    def test_non_admin_cannot_moderate(self):
        listing_id = self.create_listing().data['data']['id']
        resp = self.client.post(f'{BASE}{listing_id}/moderate/', {'decision': 'approve'}, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_approval_requires_photo(self):
        listing_id = self.create_listing().data['data']['id']
        self.client.force_authenticate(self.admin)
        resp = self.client.post(f'{BASE}{listing_id}/moderate/', {'decision': 'approve'}, format='json')
        self.assertEqual(resp.status_code, 422)

    def test_approved_listing_is_public_with_expiry(self):
        listing = self.approved_listing()
        self.assertEqual(listing.status, ListingStatus.ACTIVE)
        self.assertIsNotNone(listing.expires_at)
        self.assertEqual(self.client.get(BASE).data['pagination']['total_count'], 1)

    def test_reject_requires_reason_and_edit_resubmits(self):
        listing_id = self.create_listing().data['data']['id']
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(f'{BASE}{listing_id}/moderate/', {'decision': 'reject'}, format='json').status_code, 400)
        self.client.post(f'{BASE}{listing_id}/moderate/', {'decision': 'reject', 'reason': 'Blurry photos'}, format='json')
        self.client.force_authenticate(self.owner)
        detail = self.client.get(f'{BASE}{listing_id}/').data['data']
        self.assertEqual(detail['rejection_reason'], 'Blurry photos')
        self.client.patch(f'{BASE}{listing_id}/', {'asking_price': '7000000'}, format='json')
        self.assertEqual(Listing.objects.get(id=listing_id).status, ListingStatus.PENDING_APPROVAL)

    def test_expired_listing_hidden(self):
        listing = self.approved_listing()
        Listing.objects.filter(id=listing.id).update(expires_at=timezone.now() - timezone.timedelta(minutes=1))
        self.assertEqual(self.client.get(BASE).data['pagination']['total_count'], 0)


class PrivacyTests(ListingTestBase):
    def test_public_payload_hides_sensitive_data(self):
        listing = self.approved_listing()
        data = self.client.get(f'{BASE}{listing.id}/').data['data']
        summary = data['property_summary']
        for forbidden in ('address', 'documents', 'owners', 'latitude', 'longitude'):
            self.assertNotIn(forbidden, summary)
        self.assertNotIn('listed_by', data)
        self.assertNotIn('rejection_reason', data)
        self.assertEqual(data['listed_by_name'], 'Ravi')
        self.assertEqual(summary['approx_latitude'], 22.753)
        self.assertNotIn('Secret Tower', str(data))


class OwnershipTests(ListingTestBase):
    def test_other_user_cannot_edit_delete_or_upload(self):
        listing_id = self.create_listing().data['data']['id']
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.patch(f'{BASE}{listing_id}/', {'asking_price': '1'}, format='json').status_code, 403)
        self.assertEqual(self.client.delete(f'{BASE}{listing_id}/').status_code, 403)
        resp = self.client.post(f'{BASE}{listing_id}/media/', {'images': [make_image()]}, format='multipart')
        self.assertEqual(resp.status_code, 403)

    def test_owner_cannot_self_approve_via_status(self):
        listing_id = self.create_listing().data['data']['id']
        resp = self.client.post(f'{BASE}{listing_id}/status/', {'status': 'ACTIVE'}, format='json')
        self.assertEqual(resp.status_code, 422)

    def test_pause_and_resume(self):
        listing = self.approved_listing()
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.post(f'{BASE}{listing.id}/status/', {'status': 'PAUSED'}, format='json').status_code, 200)
        self.assertEqual(self.client.post(f'{BASE}{listing.id}/status/', {'status': 'ACTIVE'}, format='json').status_code, 200)


class MediaSecurityTests(ListingTestBase):
    def setUp(self):
        super().setUp()
        self.listing_id = self.create_listing().data['data']['id']

    def upload(self, *files):
        return self.client.post(f'{BASE}{self.listing_id}/media/', {'images': list(files)}, format='multipart')

    def test_multiple_images_upload_and_primary(self):
        resp = self.upload(make_image('original_photo.jpg', color=(1, 2, 3)), make_image('b.png', fmt='PNG', color=(4, 5, 6)))
        self.assertEqual(resp.status_code, 201, resp.data)
        media = list(ListingMedia.objects.filter(listing_id=self.listing_id))
        self.assertEqual(len(media), 2)
        self.assertEqual(sum(m.is_primary for m in media), 1)
        for m in media:
            self.assertNotIn('original_photo.jpg', m.image.name)
            self.assertEqual(len(m.checksum_sha256), 64)

    def test_gps_exif_is_stripped(self):
        self.assertEqual(self.upload(make_image(exif_gps=True)).status_code, 201)
        media = ListingMedia.objects.get(listing_id=self.listing_id)
        with media.image.open('rb') as f:
            self.assertEqual(len(Image.open(f).getexif()), 0)

    def test_non_image_rejected(self):
        fake = SimpleUploadedFile('evil.jpg', b'<?php system($_GET["c"]); ?>', content_type='image/jpeg')
        self.assertEqual(self.upload(fake).status_code, 400)

    def test_tiny_image_rejected(self):
        self.assertEqual(self.upload(make_image(size=(50, 50))).status_code, 400)

    def test_duplicate_image_rejected(self):
        self.upload(make_image())
        self.assertEqual(self.upload(make_image()).status_code, 400)


class ReportingTests(ListingTestBase):
    def test_report_once_and_not_own(self):
        listing = self.approved_listing()
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.post(f'{BASE}{listing.id}/report/', {'reason': 'FRAUD'}, format='json').status_code, 422)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.post(f'{BASE}{listing.id}/report/', {'reason': 'FRAUD'}, format='json').status_code, 201)
        self.assertEqual(self.client.post(f'{BASE}{listing.id}/report/', {'reason': 'FRAUD'}, format='json').status_code, 422)

    def test_heavily_reported_listing_auto_hidden(self):
        listing = self.approved_listing()
        for i in range(5):
            reporter = User.objects.create_user(f'r{i}@t.in', f'98765400{i:02d}', f'R{i}', 'Pass@1234', is_verified=True)
            self.client.force_authenticate(reporter)
            self.client.post(f'{BASE}{listing.id}/report/', {'reason': 'FRAUD'}, format='json')
        listing.refresh_from_db()
        self.assertEqual(listing.status, ListingStatus.PENDING_APPROVAL)

import hashlib
import hmac
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.properties.models import Property, PropertyOwner
from apps.transactions.models import Transaction
from common.models import AuditLog
from common.constants.choices import (
    PropertyStatus,
    TransactionStatus,
    AuthenticityLevel,
    IntegrationMode,
    TaskStatus,
)


class FullPlatformIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        call_command('seed_indore')
        self.admin = User.objects.get(email='admin@propvault.in')
        self.buyer = User.objects.get(email='buyer@propvault.in')
        self.advocate = User.objects.get(email='advocate@propvault.in')

    def test_seed_and_public_analytics(self):
        trends_res = self.client.get('/api/v1/analytics/trends/')
        self.assertEqual(trends_res.status_code, 200)
        self.assertGreaterEqual(trends_res.data['data']['summary']['total_localities'], 20)

        stats_res = self.client.get('/api/v1/analytics/platform-stats/')
        self.assertEqual(stats_res.status_code, 200)
        self.assertGreaterEqual(stats_res.data['data']['verified_properties_count'], 4)

    def test_dashboard_summary_and_verification_queue(self):
        self.client.force_authenticate(self.admin)
        dash = self.client.get('/api/v1/analytics/dashboard-summary/')
        self.assertEqual(dash.status_code, 200)
        self.assertGreaterEqual(dash.data['data']['active_listings_count'], 4)

        queue = self.client.get('/api/v1/verification/queue/')
        self.assertEqual(queue.status_code, 200)
        self.assertGreaterEqual(len(queue.data['data']), 4)

    @override_settings(DEBUG=False)
    def test_sec03_dev_otp_hidden_when_debug_false(self):
        res = self.client.post(
            '/api/v1/auth/register/',
            {
                'name': 'Prod Seller',
                'email': 'prodseller@propvault.in',
                'phone': '9826099111',
                'password': 'Password@123',
                'roles': ['SELLER'],
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertNotIn('dev_otp', res.data['data'])

    def test_sec01_public_property_detail_redacts_documents_and_owner_pii(self):
        prop = Property.objects.first()
        self.client.force_authenticate(self.admin)
        pdf_file = SimpleUploadedFile('original_deed.pdf', b'%PDF-1.4 sample deed bytes', content_type='application/pdf')
        up_res = self.client.post(
            f'/api/v1/properties/{prop.id}/documents/',
            {'document_type': 'SALE_DEED', 'title': 'Registered Sale Deed', 'document_file': pdf_file},
            format='multipart',
        )
        self.assertEqual(up_res.status_code, 201, up_res.data)
        # Ensure original filename is never stored in path
        self.assertNotIn('original_deed.pdf', up_res.data['data']['document_file'])
        self.assertEqual(len(up_res.data['data']['checksum_sha256']), 64)

        # Anonymous public request must NOT expose document_file URL, owner email/phone, or exact street address
        self.client.force_authenticate(None)
        pub_res = self.client.get(f'/api/v1/properties/{prop.id}/')
        self.assertEqual(pub_res.status_code, 200)
        pub_data = pub_res.data['data']
        self.assertIsNone(pub_data['documents'][0]['document_file'])
        self.assertNotIn('email', pub_data['owners'][0]['user'])
        self.assertNotIn('phone', pub_data['owners'][0]['user'])
        self.assertNotIn('Plot 42', pub_data['address'])

        # Authorized owner or advocate sees full document URL and address
        self.client.force_authenticate(self.advocate)
        auth_res = self.client.get(f'/api/v1/properties/{prop.id}/')
        self.assertIsNotNone(auth_res.data['data']['documents'][0]['document_file'])

    def test_frontend_wizard_property_creation_and_document_review(self):
        self.client.force_authenticate(self.admin)
        # Send exact frontend CreatePropertyPage payload (aliases)
        create_res = self.client.post(
            '/api/v1/properties/',
            {
                'property_type': 'COMMERCIAL_SHOP',
                'title': 'Prime Retail Showroom in Vijay Nagar Square',
                'description': 'High-footfall retail showroom on main AB Road corridor with dedicated parking.',
                'price': 16500000,
                'address': 'Showroom G-4, Century Plaza, Vijay Nagar',
                'locality': 'Vijay Nagar',
                'city': 'Indore',
                'state': 'Madhya Pradesh',
                'pincode': '452010',
                'carpet_area_sqft': 1200,
                'super_builtup_area_sqft': 1450,
                'bhk_count': 0,
                'bathrooms': 1,
                'amenities': ['Reserved Car Parking', 'Power Backup (100%)'],
            },
            format='json',
        )
        self.assertEqual(create_res.status_code, 201, create_res.data)
        prop_id = create_res.data['data']['id']
        self.assertEqual(create_res.data['data']['property_type'], 'SHOP')

        # Upload legal document using 'file' alias
        deed = SimpleUploadedFile('khasra.pdf', b'%PDF-1.4 khasra content', content_type='application/pdf')
        doc_res = self.client.post(
            f'/api/v1/properties/{prop_id}/documents/',
            {'document_type': 'KHASRA_KHATONI', 'title': 'Khasra Copy', 'file': deed, 'source_reference': 'KH-412/2'},
            format='multipart',
        )
        self.assertEqual(doc_res.status_code, 201, doc_res.data)
        doc_id = doc_res.data['data']['id']
        self.assertEqual(doc_res.data['data']['authenticity_level'], AuthenticityLevel.USER_SUBMITTED)

        # Advocate reviews and approves the document
        self.client.force_authenticate(self.advocate)
        rev_res = self.client.post(
            f'/api/v1/properties/{prop_id}/documents/{doc_id}/review/',
            {
                'review_status': 'APPROVED',
                'authenticity_level': AuthenticityLevel.PLATFORM_VERIFIED,
                'review_notes': 'Cross-checked with MP Bhulekh Khasra 412/2.',
            },
            format='json',
        )
        self.assertEqual(rev_res.status_code, 200)
        self.assertEqual(rev_res.data['data']['review_status'], 'APPROVED')
        self.assertEqual(rev_res.data['data']['authenticity_level'], AuthenticityLevel.PLATFORM_VERIFIED)

    def test_government_adapters_and_provenance_engine(self):
        sources_res = self.client.get('/api/v1/verification/government-sources/')
        self.assertEqual(sources_res.status_code, 200)
        self.assertEqual(len(sources_res.data['data']), 6)

        prop = Property.objects.first()
        self.client.force_authenticate(self.advocate)
        gov_res = self.client.post(
            f'/api/v1/verification/properties/{prop.id}/government-checks/',
            {
                'authority': 'MP_RERA',
                'reference_number': 'P-IND-26-99012',
                'notes': 'Verified project registration on rera.mp.gov.in',
                'is_verified': True,
                'has_signed_gov_certificate': False,
            },
            format='json',
        )
        self.assertEqual(gov_res.status_code, 201, gov_res.data)
        self.assertEqual(gov_res.data['data']['integration_mode'], IntegrationMode.PENDING_AUTHORIZATION_MANUAL_AUDIT)
        self.assertEqual(gov_res.data['data']['authenticity_level'], AuthenticityLevel.PLATFORM_VERIFIED)

    def test_lead_and_visit_lifecycle_with_interactions(self):
        prop = Property.objects.first()
        self.client.force_authenticate(self.buyer)

        lead_res = self.client.post(
            '/api/v1/leads/',
            {'property': str(prop.id), 'inquiry_message': 'Ready to inspect this week.', 'budget_max': '15000000'},
            format='json',
        )
        self.assertEqual(lead_res.status_code, 201)
        lead_id = lead_res.data['data']['id']

        self.client.force_authenticate(self.admin)
        patch_lead = self.client.patch(f'/api/v1/leads/{lead_id}/', {'status': 'CONTACTED'}, format='json')
        self.assertEqual(patch_lead.status_code, 200)
        self.assertEqual(patch_lead.data['data']['status'], 'CONTACTED')

        note_res = self.client.post(
            f'/api/v1/leads/{lead_id}/interactions/',
            {'interaction_type': 'CALL', 'summary': 'Spoke with buyer; site visit confirmed for Saturday.'},
            format='json',
        )
        self.assertEqual(note_res.status_code, 201)

    def test_negotiation_to_escrow_conveyance_completion(self):
        prop = Property.objects.filter(locality='Nipania').first()
        self.client.force_authenticate(self.buyer)

        # 1. Buyer submits initial offer
        neg_res = self.client.post(
            '/api/v1/negotiations/',
            {'property_id': str(prop.id), 'amount': '9000000', 'terms': 'Fast closing'},
            format='json',
        )
        self.assertEqual(neg_res.status_code, 201)
        session_id = neg_res.data['data']['id']

        # 2. Seller counter-offers
        self.client.force_authenticate(self.admin)
        counter_res = self.client.post(
            f'/api/v1/negotiations/{session_id}/counter/',
            {'amount': '9400000', 'terms': 'Final price'},
            format='json',
        )
        self.assertEqual(counter_res.status_code, 200)

        # 3. Buyer accepts counter-offer -> auto-creates Escrow Transaction + 5 TransactionTasks
        self.client.force_authenticate(self.buyer)
        accept_res = self.client.post(
            f'/api/v1/negotiations/{session_id}/respond/',
            {'decision': 'accept'},
            format='json',
        )
        self.assertEqual(accept_res.status_code, 200, accept_res.data)

        txn = Transaction.objects.filter(property=prop, buyer=self.buyer).first()
        self.assertIsNotNone(txn)
        self.assertEqual(txn.status, TransactionStatus.TOKEN_PENDING)
        self.assertEqual(txn.tasks.count(), 5)

        # 4. Run all 5 escrow milestones through to registry completion
        for action in ('PAY_TOKEN', 'DRAFT_AGREEMENT', 'PAY_ADVANCE', 'SCHEDULE_REGISTRY', 'COMPLETE_REGISTRY'):
            res = self.client.post(
                f'/api/v1/transactions/{txn.id}/milestone/',
                {'action': action, 'utr_number': f'UTR-{action}', 'deed_registration_number': 'MPIGR-IND-2026-8812'},
                format='json',
            )
            self.assertEqual(res.status_code, 200, res.data)

        txn.refresh_from_db()
        prop.refresh_from_db()
        self.assertEqual(txn.status, TransactionStatus.COMPLETED)
        self.assertEqual(prop.status, PropertyStatus.SOLD)
        self.assertEqual(txn.tasks.filter(status=TaskStatus.COMPLETED).count(), 5)
        self.assertTrue(PropertyOwner.objects.filter(property=prop, user=self.buyer, is_primary=True).exists())

    def test_builders_investments_and_audit_logs(self):
        self.client.force_authenticate(self.admin)
        proj_res = self.client.post(
            '/api/v1/builders/projects/',
            {
                'name': 'Indore Metro Enclave',
                'locality': 'Super Corridor',
                'rera_registration_number': 'P-IND-26-77123',
                'total_units': 80,
                'available_units': 80,
                'status': 'UNDER_CONSTRUCTION',
            },
            format='json',
        )
        self.assertEqual(proj_res.status_code, 201, proj_res.data)

        pools_res = self.client.get('/api/v1/investments/pools/')
        self.assertEqual(pools_res.status_code, 200)
        pool_id = pools_res.data['data'][0]['id']

        self.client.force_authenticate(self.buyer)
        contrib_res = self.client.post(
            f'/api/v1/investments/pools/{pool_id}/contribute/',
            {'amount': '500000'},
            format='json',
        )
        self.assertEqual(contrib_res.status_code, 201, contrib_res.data)

        self.client.force_authenticate(self.admin)
        logs_res = self.client.get('/api/v1/users/audit-logs/')
        self.assertEqual(logs_res.status_code, 200)
        self.assertGreaterEqual(len(logs_res.data['data']), 2)
        self.assertGreaterEqual(AuditLog.objects.count(), 2)

    def test_payment_signature_verification(self):
        self.client.force_authenticate(self.buyer)
        order_id = 'order_test_123'
        payment_id = 'pay_test_456'
        secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '') or settings.SECRET_KEY
        sig = hmac.new(secret.encode(), f'{order_id}|{payment_id}'.encode(), hashlib.sha256).hexdigest()

        res = self.client.post(
            '/api/v1/payments/verify-signature/',
            {'razorpay_order_id': order_id, 'razorpay_payment_id': payment_id, 'razorpay_signature': sig},
            format='json',
        )
        self.assertEqual(res.status_code, 200)

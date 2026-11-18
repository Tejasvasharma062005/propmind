"""
Unit and integration tests for accounts and authentication endpoints.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, OTPRecord
from common.constants.choices import Role, OTPPurpose


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reg_data = {
            "email": "buyer@example.com",
            "phone": "9876543210",
            "name": "Rajesh Kumar",
            "password": "StrongPassword123!",
            "roles": [Role.BUYER]
        }

    def test_register_and_verify_otp(self):
        # 1. Register
        response = self.client.post('/api/v1/auth/register/', self.reg_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        user_id = response.data['data']['user']['id']

        user = User.objects.get(id=user_id)
        self.assertFalse(user.is_verified)

        # 2. Get the generated OTP record
        otp_rec = OTPRecord.objects.filter(user=user, purpose=OTPPurpose.REGISTRATION).first()
        self.assertIsNotNone(otp_rec)

        # 3. Verify with correct OTP (we need the raw otp; in tests we can generate a known one)
        otp_rec.otp_hash = OTPRecord.hash_otp("123456")
        otp_rec.save()

        verify_res = self.client.post('/api/v1/auth/verify-otp/', {
            "user_id": user_id,
            "otp": "123456",
            "purpose": OTPPurpose.REGISTRATION
        }, format='json')
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_res.data['data']['is_verified'])
        self.assertIn('access', verify_res.data['data']['tokens'])

    def test_login(self):
        user = User.objects.create_user(
            email="seller@example.com",
            phone="+919876543211",
            name="Amit Sharma",
            password="Password123!"
        )
        response = self.client.post('/api/v1/auth/login/', {
            "email_or_phone": "seller@example.com",
            "password": "Password123!"
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data['data']['tokens'])

    def test_reregister_unverified_account_and_resend_otp(self):
        # 1. First registration (unverified)
        res1 = self.client.post('/api/v1/auth/register/', self.reg_data, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        user_id_1 = res1.data['data']['user_id']

        # 2. Second registration with same email before verifying OTP should succeed and reuse user_id
        updated_reg = {**self.reg_data, "roles": [Role.BUYER, Role.AGENT]}
        res2 = self.client.post('/api/v1/auth/register/', updated_reg, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data['data']['user_id'], user_id_1)

        # 3. Resend OTP endpoint works
        resend_res = self.client.post('/api/v1/auth/resend-otp/', {
            "user_id": user_id_1,
            "purpose": OTPPurpose.REGISTRATION
        }, format='json')
        self.assertEqual(resend_res.status_code, status.HTTP_200_OK)
        self.assertEqual(resend_res.data['data']['user_id'], user_id_1)

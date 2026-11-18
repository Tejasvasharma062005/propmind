"""
Unit and integration tests for users module.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from common.constants.choices import Role


class UserModuleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="testuser@example.com",
            phone="+919876543220",
            name="Vikram Singh",
            password="Password123!",
            is_verified=True
        )
        self.client.force_authenticate(user=self.user)

    def test_get_current_user_profile(self):
        response = self.client.get('/api/v1/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['email'], "testuser@example.com")

    def test_update_user_profile(self):
        response = self.client.patch('/api/v1/users/me/', {
            "name": "Vikram Singh Chouhan",
            "city": "Indore",
            "bio": "Real estate investor in Indore"
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['name'], "Vikram Singh Chouhan")

"""
Unit and integration tests for property management.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.properties.models import Property
from common.constants.choices import PropertyType, PropertyStatus


class PropertyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="seller@example.com",
            phone="+919876543230",
            name="Ramesh Gupta",
            password="Password123!",
            is_verified=True
        )
        self.client.force_authenticate(user=self.user)

    def test_create_and_fetch_property(self):
        payload = {
            "property_type": PropertyType.APARTMENT,
            "title": "Luxury 3 BHK Flat in Vijay Nagar",
            "description": "Spacious flat with modular kitchen and scenic view",
            "price": "8500000.00",
            "address": "Flat 402, Royal Palms, Scheme 54",
            "locality": "Vijay Nagar",
            "city": "Indore",
            "state": "Madhya Pradesh",
            "pincode": "452010",
            "built_up_area": "1650.00",
            "carpet_area": "1350.00",
            "bedrooms": 3,
            "bathrooms": 3,
            "parking_count": 1,
            "amenities_list": ["Swimming Pool", "Clubhouse", "24/7 Security"]
        }

        response = self.client.post('/api/v1/properties/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        prop_id = response.data['data']['id']

        # Get details
        detail_res = self.client.get(f'/api/v1/properties/{prop_id}/')
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data['data']['title'], "Luxury 3 BHK Flat in Vijay Nagar")
        self.assertEqual(len(detail_res.data['data']['amenities']), 3)

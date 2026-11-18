from rest_framework import serializers
from apps.discovery.models import SavedSearch, UserFavorite
from apps.properties.serializers import PropertySerializer

class SavedSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedSearch
        fields = ['id', 'title', 'filters_json', 'notify_email', 'created_at']
        read_only_fields = ['id', 'created_at']

class UserFavoriteSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)

    class Meta:
        model = UserFavorite
        fields = ['id', 'property', 'property_details', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']

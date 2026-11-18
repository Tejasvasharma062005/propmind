from rest_framework import serializers
from apps.negotiations.models import NegotiationSession, Offer


class OfferSerializer(serializers.ModelSerializer):
    offered_by_name = serializers.CharField(source='offered_by.name', read_only=True)

    class Meta:
        model = Offer
        fields = [
            'id',
            'session',
            'offered_by',
            'offered_by_name',
            'amount',
            'terms',
            'expires_at',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'session', 'offered_by', 'created_at']


class NegotiationSessionSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_locality = serializers.CharField(source='property.locality', read_only=True)
    property_price = serializers.DecimalField(source='property.price', max_digits=14, decimal_places=2, read_only=True)
    buyer_name = serializers.CharField(source='buyer.name', read_only=True)
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    assigned_negotiator_name = serializers.CharField(source='assigned_negotiator.name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    offers = OfferSerializer(many=True, read_only=True)

    class Meta:
        model = NegotiationSession
        fields = [
            'id',
            'property',
            'property_title',
            'property_locality',
            'property_price',
            'buyer',
            'buyer_name',
            'seller',
            'seller_name',
            'assigned_negotiator',
            'assigned_negotiator_name',
            'status',
            'status_display',
            'current_offer_amount',
            'offers',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'buyer', 'seller', 'created_at', 'updated_at']

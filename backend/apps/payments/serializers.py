from rest_framework import serializers
from apps.payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    payer_name = serializers.CharField(source='payer.name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'transaction',
            'payer',
            'payer_name',
            'amount',
            'purpose',
            'payment_method',
            'invoice_number',
            'utr_number',
            'gateway_order_id',
            'gateway_payment_id',
            'status',
            'status_display',
            'verified_by',
            'verified_by_name',
            'verified_at',
            'receipt_url',
            'created_at',
        ]
        read_only_fields = ['id', 'payer', 'verified_by', 'verified_at', 'created_at']

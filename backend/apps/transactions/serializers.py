from rest_framework import serializers
from apps.transactions.models import Transaction, TransactionTask
from apps.payments.serializers import PaymentSerializer
from apps.legal.serializers import LegalDeedSerializer


class TransactionTaskSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_role_display = serializers.CharField(source='get_assigned_role_display', read_only=True)
    completed_by_name = serializers.CharField(source='completed_by.name', read_only=True, default='')

    class Meta:
        model = TransactionTask
        fields = [
            'id',
            'transaction',
            'order_index',
            'title',
            'assigned_role',
            'assigned_role_display',
            'status',
            'status_display',
            'due_date',
            'completed_by',
            'completed_by_name',
            'completed_at',
            'notes',
        ]
        read_only_fields = ['id', 'transaction', 'completed_by', 'completed_at']


class TransactionSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_locality = serializers.CharField(source='property.locality', read_only=True)
    buyer_name = serializers.CharField(source='buyer.name', read_only=True)
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    assigned_advocate_name = serializers.CharField(source='assigned_advocate.name', read_only=True, default='')
    assigned_agent_name = serializers.CharField(source='assigned_agent.name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    deeds = LegalDeedSerializer(many=True, read_only=True)
    tasks = TransactionTaskSerializer(many=True, read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'property',
            'property_title',
            'property_locality',
            'negotiation_session',
            'buyer',
            'buyer_name',
            'seller',
            'seller_name',
            'assigned_advocate',
            'assigned_advocate_name',
            'assigned_agent',
            'assigned_agent_name',
            'final_sale_price',
            'token_amount',
            'advance_amount',
            'status',
            'status_display',
            'sub_registrar_office',
            'deed_registration_number',
            'handover_notes',
            'token_paid_at',
            'agreement_signed_at',
            'registration_date',
            'handover_completed_at',
            'payments',
            'deeds',
            'tasks',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

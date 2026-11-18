from django.contrib import admin
from apps.payments.models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payer', 'amount', 'purpose', 'status', 'created_at')
    list_filter = ('status', 'purpose')

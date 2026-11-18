from django.contrib import admin
from apps.transactions.models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('property', 'buyer', 'seller', 'final_sale_price', 'status', 'created_at')
    list_filter = ('status',)

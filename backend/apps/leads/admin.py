from django.contrib import admin
from apps.leads.models import Lead

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('buyer', 'property', 'assigned_agent', 'status', 'created_at')
    list_filter = ('status',)

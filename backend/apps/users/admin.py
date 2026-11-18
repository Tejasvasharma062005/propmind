"""
Django admin for Users app models.
"""
from django.contrib import admin
from apps.users.models import KYCRecord, ProfessionalProfile


@admin.register(KYCRecord)
class KYCRecordAdmin(admin.ModelAdmin):
    list_display = ('user', 'document_type', 'status', 'reviewed_by', 'created_at')
    list_filter = ('status', 'document_type')
    search_fields = ('user__email', 'user__name')
    readonly_fields = ('document_number_hash', 'created_at', 'updated_at')


@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'profession', 'license_number', 'agency_name', 'is_verified', 'created_at')
    list_filter = ('profession', 'is_verified')
    search_fields = ('user__email', 'user__name', 'license_number', 'agency_name')

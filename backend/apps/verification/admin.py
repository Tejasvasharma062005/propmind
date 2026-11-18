from django.contrib import admin
from apps.verification.models import PropertyPassport, VerificationItem

class VerificationItemInline(admin.TabularInline):
    model = VerificationItem
    extra = 0

@admin.register(PropertyPassport)
class PropertyPassportAdmin(admin.ModelAdmin):
    list_display = ('property', 'overall_score', 'is_verified', 'last_verified_at')
    inlines = [VerificationItemInline]

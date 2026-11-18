from django.contrib import admin
from apps.visits.models import SiteVisit

@admin.register(SiteVisit)
class SiteVisitAdmin(admin.ModelAdmin):
    list_display = ('property', 'visitor', 'scheduled_at', 'status')
    list_filter = ('status',)

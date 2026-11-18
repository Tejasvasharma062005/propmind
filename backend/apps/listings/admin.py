from django.contrib import admin

from apps.listings.models import Listing, ListingMedia, ListingReport


class ListingMediaInline(admin.TabularInline):
    model = ListingMedia
    extra = 0
    fields = ('image', 'is_primary', 'display_order', 'content_type', 'file_size', 'checksum_sha256')
    readonly_fields = ('content_type', 'file_size', 'checksum_sha256')


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('property', 'listing_type', 'asking_price', 'status', 'report_count',
                    'is_featured', 'views_count', 'expires_at', 'created_at')
    list_filter = ('listing_type', 'status', 'is_featured')
    search_fields = ('property__title', 'listed_by__email', 'rera_number')
    readonly_fields = ('views_count', 'report_count', 'reviewed_by', 'reviewed_at', 'published_at')
    inlines = [ListingMediaInline]


@admin.register(ListingReport)
class ListingReportAdmin(admin.ModelAdmin):
    list_display = ('listing', 'reason', 'reported_by', 'is_resolved', 'created_at')
    list_filter = ('reason', 'is_resolved')
    search_fields = ('listing__property__title', 'reported_by__email')

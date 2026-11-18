"""
Django admin for properties module.
"""
from django.contrib import admin
from apps.properties.models import Property, PropertyOwner, PropertyAmenity, PropertyDocument


class PropertyOwnerInline(admin.TabularInline):
    model = PropertyOwner
    extra = 1


class PropertyAmenityInline(admin.TabularInline):
    model = PropertyAmenity
    extra = 1


class PropertyDocumentInline(admin.TabularInline):
    model = PropertyDocument
    extra = 0
    readonly_fields = ('uploaded_by', 'uploaded_at')


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'locality', 'city', 'property_type', 'price', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'property_type', 'city', 'locality', 'property_condition')
    search_fields = ('title', 'address', 'locality', 'pincode', 'created_by__email')
    inlines = [PropertyOwnerInline, PropertyAmenityInline, PropertyDocumentInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PropertyOwner)
class PropertyOwnerAdmin(admin.ModelAdmin):
    list_display = ('property', 'user', 'ownership_percentage', 'is_primary')
    search_fields = ('property__title', 'user__email', 'user__name')


@admin.register(PropertyAmenity)
class PropertyAmenityAdmin(admin.ModelAdmin):
    list_display = ('property', 'amenity_name', 'amenity_category')
    list_filter = ('amenity_category',)
    search_fields = ('property__title', 'amenity_name')


@admin.register(PropertyDocument)
class PropertyDocumentAdmin(admin.ModelAdmin):
    list_display = ('property', 'document_type', 'uploaded_by', 'uploaded_at')
    list_filter = ('document_type',)
    search_fields = ('property__title', 'uploaded_by__email')
    readonly_fields = ('uploaded_at',)

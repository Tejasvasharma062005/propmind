from django.contrib import admin
from apps.discovery.models import SavedSearch, UserFavorite

admin.site.register(SavedSearch)
admin.site.register(UserFavorite)

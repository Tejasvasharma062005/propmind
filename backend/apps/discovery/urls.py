from django.urls import path
from apps.discovery.views import SavedSearchListCreateView, UserFavoriteToggleView

app_name = 'discovery'

urlpatterns = [
    path('saved-searches/', SavedSearchListCreateView.as_view(), name='saved-searches'),
    path('favorites/', UserFavoriteToggleView.as_view(), name='favorites'),
]

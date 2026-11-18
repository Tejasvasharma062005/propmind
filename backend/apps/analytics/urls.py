from django.urls import path
from apps.analytics.views import (
    LocalityTrendListView,
    PlatformStatsView,
    DashboardSummaryView,
)

app_name = 'analytics'

urlpatterns = [
    path('trends/', LocalityTrendListView.as_view(), name='locality-trends'),
    path('platform-stats/', PlatformStatsView.as_view(), name='platform-stats'),
    path('dashboard-summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]

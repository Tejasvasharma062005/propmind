from django.urls import path
from apps.verification.views import (
    VerificationQueueView,
    PropertyPassportView,
    VerifyTierView,
    GovernmentSourceListView,
    PropertyGovernmentCheckView,
)

app_name = 'verification'

urlpatterns = [
    path('queue/', VerificationQueueView.as_view(), name='verification-queue'),
    path('government-sources/', GovernmentSourceListView.as_view(), name='government-sources'),
    path('properties/<uuid:property_id>/passport/', PropertyPassportView.as_view(), name='property-passport'),
    path('properties/<uuid:property_id>/verify-tier/', VerifyTierView.as_view(), name='verify-tier'),
    path('properties/<uuid:property_id>/government-checks/', PropertyGovernmentCheckView.as_view(), name='property-government-checks'),
]

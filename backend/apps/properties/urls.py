"""
Property URL configuration.
"""
from django.urls import path
from apps.properties.views import (
    PropertyListCreateView,
    PropertyDetailView,
    PropertyDocumentUploadView,
    PropertyDocumentReviewView,
    PropertySubmitVerificationView,
    MyPropertiesView,
)

app_name = 'properties'

urlpatterns = [
    path('', PropertyListCreateView.as_view(), name='property-list-create'),
    path('mine/', MyPropertiesView.as_view(), name='my-properties'),
    path('<uuid:id>/', PropertyDetailView.as_view(), name='property-detail'),
    path('<uuid:id>/documents/', PropertyDocumentUploadView.as_view(), name='property-document-upload'),
    path('<uuid:id>/documents/<uuid:doc_id>/review/', PropertyDocumentReviewView.as_view(), name='property-document-review'),
    path('<uuid:id>/submit-for-verification/', PropertySubmitVerificationView.as_view(), name='property-submit-verification'),
    path('<uuid:id>/submit-verification/', PropertySubmitVerificationView.as_view(), name='property-submit-verification-alias'),
]

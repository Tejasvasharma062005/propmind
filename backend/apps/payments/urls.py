from django.urls import path
from apps.payments.views import (
    PaymentListView,
    PaymentVerifySignatureView,
    PaymentReconcileView,
)

app_name = 'payments'

urlpatterns = [
    path('', PaymentListView.as_view(), name='payment-list'),
    path('verify-signature/', PaymentVerifySignatureView.as_view(), name='payment-verify-signature'),
    path('<uuid:id>/reconcile/', PaymentReconcileView.as_view(), name='payment-reconcile'),
]

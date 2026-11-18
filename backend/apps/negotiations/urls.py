from django.urls import path
from apps.negotiations.views import (
    NegotiationSessionListView,
    NegotiationCounterView,
    NegotiationRespondView,
)

app_name = 'negotiations'

urlpatterns = [
    path('', NegotiationSessionListView.as_view(), name='negotiation-list'),
    path('<uuid:id>/counter/', NegotiationCounterView.as_view(), name='negotiation-counter'),
    path('<uuid:id>/respond/', NegotiationRespondView.as_view(), name='negotiation-respond'),
]

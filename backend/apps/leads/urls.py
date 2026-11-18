from django.urls import path
from apps.leads.views import (
    LeadListCreateView,
    LeadDetailView,
    LeadInteractionListCreateView,
    AgentDirectoryView,
)

app_name = 'leads'

urlpatterns = [
    path('', LeadListCreateView.as_view(), name='lead-list-create'),
    path('agents/', AgentDirectoryView.as_view(), name='lead-agents'),
    path('<uuid:id>/', LeadDetailView.as_view(), name='lead-detail'),
    path('<uuid:id>/interactions/', LeadInteractionListCreateView.as_view(), name='lead-interactions'),
]

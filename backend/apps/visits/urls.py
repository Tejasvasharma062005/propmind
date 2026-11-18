from django.urls import path
from apps.visits.views import SiteVisitListCreateView, SiteVisitDetailView

app_name = 'visits'

urlpatterns = [
    path('', SiteVisitListCreateView.as_view(), name='visit-list-create'),
    path('<uuid:id>/', SiteVisitDetailView.as_view(), name='visit-detail'),
]

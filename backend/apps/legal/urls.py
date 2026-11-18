from django.urls import path
from apps.legal.views import TitleSearchReportListView, LegalDeedListCreateView

app_name = 'legal'

urlpatterns = [
    path('title-reports/', TitleSearchReportListView.as_view(), name='title-report-list'),
    path('deeds/', LegalDeedListCreateView.as_view(), name='legal-deed-list'),
]

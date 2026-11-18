from django.urls import path
from apps.builders.views import (
    BuilderProfileView,
    ProjectListView,
    ProjectUnitListCreateView,
)

app_name = 'builders'

urlpatterns = [
    path('profile/', BuilderProfileView.as_view(), name='builder-profile'),
    path('projects/', ProjectListView.as_view(), name='project-list'),
    path('projects/<uuid:project_id>/units/', ProjectUnitListCreateView.as_view(), name='project-units'),
]

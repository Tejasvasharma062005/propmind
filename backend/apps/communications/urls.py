from django.urls import path
from apps.communications.views import NotificationListView

app_name = 'communications'

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
]

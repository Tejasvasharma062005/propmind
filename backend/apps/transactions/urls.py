from django.urls import path
from apps.transactions.views import (
    TransactionListView,
    TransactionMilestoneView,
    TransactionTaskDetailView,
)

app_name = 'transactions'

urlpatterns = [
    path('', TransactionListView.as_view(), name='transaction-list'),
    path('<uuid:id>/milestone/', TransactionMilestoneView.as_view(), name='transaction-milestone'),
    path('<uuid:id>/tasks/<uuid:task_id>/', TransactionTaskDetailView.as_view(), name='transaction-task-detail'),
]

"""
Users URL configuration.
"""
from django.urls import path
from apps.users.views import (
    UserMeView,
    UserDetailView,
    KYCSubmitView,
    KYCStatusView,
    KYCAdminQueueView,
    KYCAdminReviewView,
    ProfessionalProfileView,
    AssignRoleView,
    AdminUsersListView,
    AdminAuditLogListView,
)

app_name = 'users'

urlpatterns = [
    path('me/', UserMeView.as_view(), name='user-me'),
    path('professional-profile/', ProfessionalProfileView.as_view(), name='professional-profile'),
    path('kyc/submit/', KYCSubmitView.as_view(), name='kyc-submit'),
    path('kyc/status/', KYCStatusView.as_view(), name='kyc-status'),
    path('kyc/queue/', KYCAdminQueueView.as_view(), name='kyc-admin-queue'),
    path('kyc/<uuid:id>/review/', KYCAdminReviewView.as_view(), name='kyc-admin-review'),
    path('roles/assign/', AssignRoleView.as_view(), name='role-assign'),
    path('admin/list/', AdminUsersListView.as_view(), name='admin-users-list'),
    path('audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-logs'),
    path('<uuid:id>/', UserDetailView.as_view(), name='user-detail'),
]

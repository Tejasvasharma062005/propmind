from django.urls import path

from apps.listings import views

app_name = 'listings'

urlpatterns = [
    path('', views.ListingListCreateView.as_view(), name='listing-list-create'),
    path('mine/', views.MyListingsView.as_view(), name='my-listings'),
    path('moderation/', views.ModerationQueueView.as_view(), name='moderation-queue'),
    path('<uuid:id>/', views.ListingDetailView.as_view(), name='listing-detail'),
    path('<uuid:id>/status/', views.ListingStatusView.as_view(), name='listing-status'),
    path('<uuid:id>/moderate/', views.ListingModerateView.as_view(), name='listing-moderate'),
    path('<uuid:id>/report/', views.ListingReportView.as_view(), name='listing-report'),
    path('<uuid:id>/media/', views.ListingMediaView.as_view(), name='listing-media'),
    path('<uuid:id>/media/<uuid:media_id>/', views.ListingMediaDetailView.as_view(), name='listing-media-detail'),
    path('<uuid:id>/media/<uuid:media_id>/primary/', views.ListingMediaPrimaryView.as_view(),
         name='listing-media-primary'),
]

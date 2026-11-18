"""
Master URL routing configuration for PropVault.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


class HealthCheckView(APIView):
    """
    Health check endpoint returning platform status, timestamp, and version.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "ok",
            "timestamp": timezone.now().isoformat(),
            "version": getattr(settings, 'APP_VERSION', '1.0.0'),
            "platform": "PropVault Real Estate Operating Platform"
        })


api_v1_patterns = [
    path('auth/', include('apps.accounts.urls', namespace='accounts')),
    path('users/', include('apps.users.urls', namespace='users')),
    path('properties/', include('apps.properties.urls', namespace='properties')),
    path('listings/', include('apps.listings.urls', namespace='listings')),
    path('verification/', include('apps.verification.urls', namespace='verification')),
    path('discovery/', include('apps.discovery.urls', namespace='discovery')),
    path('leads/', include('apps.leads.urls', namespace='leads')),
    path('visits/', include('apps.visits.urls', namespace='visits')),
    path('negotiations/', include('apps.negotiations.urls', namespace='negotiations')),
    path('transactions/', include('apps.transactions.urls', namespace='transactions')),
    path('legal/', include('apps.legal.urls', namespace='legal')),
    path('payments/', include('apps.payments.urls', namespace='payments')),
    path('builders/', include('apps.builders.urls', namespace='builders')),
    path('investments/', include('apps.investments.urls', namespace='investments')),
    path('communications/', include('apps.communications.urls', namespace='communications')),
    path('analytics/', include('apps.analytics.urls', namespace='analytics')),
]

urlpatterns = [
    # Admin Site
    path('admin/', admin.site.urls),

    # Health Check
    path('api/health/', HealthCheckView.as_view(), name='health-check'),

    # API v1 Versioning
    path('api/v1/', include(api_v1_patterns)),

    # OpenAPI 3 Schema & Interactive Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    try:
        import debug_toolbar
        urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    except ImportError:
        pass

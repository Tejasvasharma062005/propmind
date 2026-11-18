from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from common.utils.response import success_response
from apps.communications.models import Notification
from apps.communications.serializers import NotificationSerializer

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        qs = Notification.objects.filter(user=request.user)
        return success_response(data=NotificationSerializer(qs, many=True).data)

    def patch(self, request: Request) -> Response:
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return success_response(message="All notifications marked as read.")

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from common.utils.response import success_response, error_response
from apps.discovery.models import SavedSearch, UserFavorite
from apps.discovery.serializers import SavedSearchSerializer, UserFavoriteSerializer


class SavedSearchListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        qs = SavedSearch.objects.filter(user=request.user)
        return success_response(data=SavedSearchSerializer(qs, many=True).data)

    def post(self, request: Request) -> Response:
        serializer = SavedSearchSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        search = serializer.save(user=request.user)
        return success_response(data=SavedSearchSerializer(search).data, message="Search criteria saved.")


class UserFavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        qs = UserFavorite.objects.filter(user=request.user).select_related('property')
        return success_response(data=UserFavoriteSerializer(qs, many=True).data)

    def post(self, request: Request) -> Response:
        property_id = request.data.get('property_id')
        notes = request.data.get('notes', '')
        fav = UserFavorite.objects.filter(user=request.user, property_id=property_id).first()
        if fav:
            fav.delete()
            return success_response(message="Removed from favorites.", data={"is_favorited": False})
        else:
            fav = UserFavorite.objects.create(user=request.user, property_id=property_id, notes=notes)
            return success_response(message="Added to favorites.", data={"is_favorited": True})

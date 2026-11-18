"""
Standardized API Response format utilities for PropVault.
"""
from typing import Any, Optional
from rest_framework import status
from rest_framework.response import Response


def success_response(
    data: Any = None,
    message: str = "Operation completed successfully.",
    status_code: int = status.HTTP_200_OK,
    headers: Optional[dict[str, str]] = None
) -> Response:
    """
    Standard successful JSON response wrapper.
    Format:
    {
        "success": true,
        "message": "...",
        "data": {...}
    }
    """
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    return Response(payload, status=status_code, headers=headers)


def error_response(
    message: str = "An error occurred during the request.",
    errors: Any = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    headers: Optional[dict[str, str]] = None
) -> Response:
    """
    Standard error JSON response wrapper.
    Format:
    {
        "success": false,
        "message": "...",
        "errors": [...]
    }
    """
    payload = {
        "success": False,
        "message": message,
        "errors": errors if errors is not None else []
    }
    return Response(payload, status=status_code, headers=headers)


def paginated_response(
    data: list[Any],
    total_count: int,
    page: int,
    page_size: int,
    message: str = "Records retrieved successfully."
) -> Response:
    """
    Standard paginated JSON response wrapper.
    """
    total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 1
    has_next = page < total_pages
    has_previous = page > 1

    payload = {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_previous": has_previous,
        }
    }
    return Response(payload, status=status.HTTP_200_OK)

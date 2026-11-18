"""
Custom DRF exception handler providing unified error payloads across PropVault.
"""
import logging
from typing import Any
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException

from .exceptions import BaseAppException

logger = logging.getLogger(__name__)


def custom_exception_handler(exc: Exception, context: dict[str, Any]) -> Response:
    """
    Returns uniform error response:
    {
        "success": false,
        "message": "Human-readable description",
        "errors": [ ... detailed error elements ... ]
    }
    """
    # Transform Django native Http404 and ValidationError
    if isinstance(exc, Http404):
        exc = APIException(detail="The requested resource was not found.", code="not_found")
        exc.status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            exc = APIException(detail=exc.message_dict)
        elif hasattr(exc, 'messages'):
            exc = APIException(detail=exc.messages)
        else:
            exc = APIException(detail=str(exc))
        exc.status_code = status.HTTP_400_BAD_REQUEST

    response = exception_handler(exc, context)

    if response is not None:
        message = "An error occurred while processing your request."
        errors = response.data

        if isinstance(errors, dict):
            if 'detail' in errors:
                message = str(errors['detail'])
                # keep remaining keys if any
                err_dict = {k: v for k, v in errors.items() if k != 'detail'}
                errors = err_dict if err_dict else [message]
            else:
                first_key = next(iter(errors))
                val = errors[first_key]
                if isinstance(val, list) and val:
                    message = f"{first_key}: {val[0]}"
                else:
                    message = f"Validation failed on {first_key}"
        elif isinstance(errors, list):
            if errors and isinstance(errors[0], str):
                message = errors[0]

        if isinstance(exc, BaseAppException) and getattr(exc, 'errors', None):
            errors = exc.errors

        response.data = {
            "success": False,
            "message": message,
            "errors": errors
        }
    else:
        # Unhandled 500 error
        logger.exception("Unhandled server exception: %s", str(exc), exc_info=exc)
        response = Response(
            {
                "success": False,
                "message": "An internal server error occurred. Please contact support.",
                "errors": [str(exc)]
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response

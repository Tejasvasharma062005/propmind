"""
Custom application exception classes for PropVault.
"""
from typing import Any, Optional
from rest_framework import status
from rest_framework.exceptions import APIException


class BaseAppException(APIException):
    """Base application exception."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = "A server error occurred."
    default_code = "error"

    def __init__(self, detail: Optional[str] = None, code: Optional[str] = None, errors: Any = None):
        super().__init__(detail=detail, code=code)
        self.errors = errors if errors is not None else []


class ValidationError(BaseAppException):
    """Raised when domain or input validation fails."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Input validation failed."
    default_code = "validation_error"


class PermissionDenied(BaseAppException):
    """Raised when an action violates authorization / access rules."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have permission to perform this action."
    default_code = "permission_denied"


class NotFound(BaseAppException):
    """Raised when a requested resource does not exist."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "The requested resource was not found."
    default_code = "not_found"


class BusinessRuleViolation(BaseAppException):
    """Raised when a business constraint is violated (e.g. invalid state transition)."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "This operation violates platform business rules."
    default_code = "business_rule_violation"

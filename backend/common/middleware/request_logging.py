"""
Middleware for structured request and latency logging.
"""
import time
import logging
from typing import Callable
from django.http import HttpRequest, HttpResponse

logger = logging.getLogger('common.middleware.request_logging')


class RequestLoggingMiddleware:
    """
    Logs every incoming HTTP request: method, path, response status, and duration in ms.
    """
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        start_time = time.monotonic()
        
        response = self.get_response(request)
        
        duration_ms = (time.monotonic() - start_time) * 1000.0
        status_code = response.status_code
        method = request.method
        path = request.get_full_path()
        user = getattr(request, 'user', None)
        user_identifier = getattr(user, 'email', 'Anonymous') if user and user.is_authenticated else 'Anonymous'

        log_message = (
            f"[{method}] {path} -> {status_code} | "
            f"duration={duration_ms:.2f}ms | user={user_identifier}"
        )

        if status_code >= 500:
            logger.error(log_message)
        elif status_code >= 400:
            logger.warning(log_message)
        else:
            logger.info(log_message)

        response['X-Response-Time-Ms'] = f"{duration_ms:.2f}"
        return response

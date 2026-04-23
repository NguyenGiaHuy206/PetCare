import json
import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Configure structured JSON logging
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
)

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests with structured JSON output."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        request_id = request.headers.get("x-request-id", "")

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000
            log_data = {
                "event": "request_error",
                "method": request.method,
                "path": request.url.path,
                "query": str(request.url.query) if request.url.query else None,
                "status_code": 500,
                "duration_ms": round(duration_ms, 2),
                "request_id": request_id,
                "error": str(exc),
            }
            logger.error(json.dumps(log_data))
            raise

        duration_ms = (time.time() - start_time) * 1000

        # Extract user_id if authenticated
        user_id = None
        if hasattr(request.state, "user_id"):
            user_id = request.state.user_id

        log_data = {
            "event": "request_completed",
            "method": request.method,
            "path": request.url.path,
            "query": str(request.url.query) if request.url.query else None,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "request_id": request_id,
            "user_id": user_id,
        }

        log_level = "info"
        if response.status_code >= 500:
            log_level = "error"
        elif response.status_code >= 400:
            log_level = "warning"

        getattr(logger, log_level)(json.dumps(log_data))

        return response

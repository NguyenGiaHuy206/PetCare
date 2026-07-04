import json
import logging
from typing import Callable

from fastapi import Request, Response, status
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware to handle all exceptions and return consistent error responses."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except RequestValidationError as exc:
            return Response(
                content=json.dumps(
                    {"error": f"Validation error: {exc.errors()}"}),
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                media_type="application/json",
            )
        except SQLAlchemyError as exc:
            logger.error(f"Database error: {exc}", exc_info=True)
            return Response(
                content=json.dumps({"error": "Database error"}),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                media_type="application/json",
            )
        except ValueError as exc:
            return Response(
                content=json.dumps({"error": str(exc)}),
                status_code=status.HTTP_400_BAD_REQUEST,
                media_type="application/json",
            )
        except PermissionError as exc:
            return Response(
                content=json.dumps({"error": str(exc)}),
                status_code=status.HTTP_403_FORBIDDEN,
                media_type="application/json",
            )
        except Exception as exc:
            logger.error(f"Unexpected error: {exc}", exc_info=True)
            return Response(
                content=json.dumps({"error": "Internal server error"}),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                media_type="application/json",
            )

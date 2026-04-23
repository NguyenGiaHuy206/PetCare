import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from src.api import auth, bookings, care_logs, orders, payments, pets, products, reports, storage, users
from src.middleware.error_handler import ErrorHandlerMiddleware
from src.middleware.logging import LoggingMiddleware
from src.persistence.database import Base, engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting up...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    yield
    # Shutdown
    logger.info("Shutting down...")
    await engine.dispose()
    logger.info("Database connection closed")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="PetCare API",
        description="Pet Care & E-Commerce REST API",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Add middleware (order matters - add in reverse order of execution)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173",
                       "http://localhost:5174", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(ErrorHandlerMiddleware)
    app.add_middleware(LoggingMiddleware)

    # Include routers
    app.include_router(auth.router)
    app.include_router(pets.router)
    app.include_router(bookings.router)
    app.include_router(care_logs.router)
    app.include_router(storage.router)
    app.include_router(products.router)
    app.include_router(orders.router)
    app.include_router(payments.router)
    app.include_router(reports.router)
    app.include_router(users.router)

    # Health check endpoint
    @app.get("/health")
    async def health_check() -> dict:
        """Health check endpoint."""
        return {"status": "ok"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

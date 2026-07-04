from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


_engine = None
_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        from src.settings import settings
        _engine = create_async_engine(
            settings.database_url,
            echo=False,
            future=True,
            pool_pre_ping=True,
        )
    return _engine


def get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
            autocommit=False,
        )
    return _session_factory


class _LazyEngine:
    """Proxy that forwards attribute access to the real engine (created lazily)."""

    def __getattr__(self, name):
        return getattr(get_engine(), name)

    def __call__(self, *args, **kwargs):
        return get_engine()(*args, **kwargs)


class _LazySessionLocal:
    """Proxy that forwards calls to the real session factory (created lazily)."""

    def __call__(self, *args, **kwargs):
        return get_session_factory()(*args, **kwargs)

    def __getattr__(self, name):
        return getattr(get_session_factory(), name)


# Backward-compatible names
engine = _LazyEngine()
AsyncSessionLocal = _LazySessionLocal()


async def get_db() -> AsyncSession:
    """Dependency function to get database session."""
    async with get_session_factory()() as session:
        yield session

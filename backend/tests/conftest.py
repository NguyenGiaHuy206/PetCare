from src.services.auth_service import AuthService
from src.persistence.models import User, UserRole
from src.persistence.database import Base
from src.main import create_app
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch, MagicMock

# Set test database URL BEFORE importing any src modules
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_db():
    """Create a fresh in-memory test database for each test."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    TestSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False)
    async with TestSessionLocal() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
def stripe_mock():
    """Mock Stripe API calls."""
    with patch("stripe.checkout.Session.create") as mock_create:
        mock_create.return_value = MagicMock(
            id="cs_test_123456789",
            payment_status="unpaid",
            url="https://checkout.stripe.com/test"
        )
        yield mock_create


@pytest_asyncio.fixture
async def regular_user(test_db):
    """Create a regular test user."""
    service = AuthService(test_db)
    user = await service.register(
        email="user@test.com", password="password123", full_name="Test User"
    )
    await test_db.commit()
    return user


@pytest_asyncio.fixture
async def admin_user(test_db):
    """Create an admin test user."""
    service = AuthService(test_db)
    user = await service.register(
        email="admin@test.com", password="password123", full_name="Admin User"
    )
    user.role = UserRole.ADMIN
    await test_db.commit()
    return user


@pytest_asyncio.fixture
async def user_token(regular_user):
    """Generate JWT token for regular user."""
    service = AuthService(None)
    return service.create_access_token(regular_user.id)


@pytest_asyncio.fixture
async def admin_token(admin_user):
    """Generate JWT token for admin user."""
    service = AuthService(None)
    return service.create_access_token(admin_user.id)


@pytest_asyncio.fixture
async def async_client(test_db, stripe_mock):
    """Create async test client with shared DB session.
    Note: regular_user and admin_user removed as dependencies —
    tests that need them should declare them explicitly.
    """
    app = create_app()

    from src.api.deps import get_db

    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

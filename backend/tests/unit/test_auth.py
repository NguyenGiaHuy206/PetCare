import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(async_client: AsyncClient) -> None:
    """Test successful user registration."""
    response = await async_client.post(
        "/auth/register",
        json={
            "email": "newuser@test.com",  # ✅ fixed: matches assertion below
            "password": "password123",
            "full_name": "New User",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@test.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "user"


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient, regular_user) -> None:
    """Test registration with duplicate email is rejected."""
    response = await async_client.post(
        "/auth/register",
        json={
            "email": "user@test.com",
            "password": "password123",
            "full_name": "Another User",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, regular_user) -> None:
    """Test successful login."""
    response = await async_client.post(
        "/auth/login",
        json={
            "email": "user@test.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_email(async_client: AsyncClient) -> None:
    """Test login with invalid email is rejected."""
    response = await async_client.post(
        "/auth/login",
        json={
            "email": "nonexistent@test.com",
            "password": "password123",
        },
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient, regular_user) -> None:
    """Test login with invalid password is rejected."""
    response = await async_client.post(
        "/auth/login",
        json={
            "email": "user@test.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_refresh_token(async_client: AsyncClient, user_token: str) -> None:
    """Test token refresh."""
    login_response = await async_client.post(
        "/auth/login",
        json={
            "email": "user@test.com",
            "password": "password123",
        },
    )
    refresh_token = login_response.json()["refresh_token"]

    response = await async_client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_refresh_token_invalid(async_client: AsyncClient) -> None:
    """Test refresh with invalid token is rejected."""
    response = await async_client.post(
        "/auth/refresh",
        json={"refresh_token": "invalid.token.here"},
    )
    assert response.status_code == 401

import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_booking_success(async_client: AsyncClient, user_token: str) -> None:
    """Test successful booking creation."""
    # Create pet first
    pet_response = await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "cat",
            "breed": "Persian",
            "age": "3",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert pet_response.status_code == 200
    pet_id = pet_response.json()["id"]

    # Create booking
    future_time = datetime.now(timezone.utc) + timedelta(days=1)
    response = await async_client.post(
        "/bookings",
        json={
            "pet_id": pet_id,
            "service": "grooming",
            "booking_datetime": future_time.isoformat(),
            "duration_minutes": 60,
            "notes": "Basic grooming",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "grooming"
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_create_booking_past_datetime(async_client: AsyncClient, user_token: str) -> None:
    """Test booking creation with past datetime is rejected."""
    # Create pet first
    pet_response = await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "cat",
            "breed": "Persian",
            "age": "3",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert pet_response.status_code == 200
    pet_id = pet_response.json()["id"]

    # Try to create booking with past datetime
    past_time = datetime.now(timezone.utc) - timedelta(days=1)
    response = await async_client.post(
        "/bookings",
        json={
            "pet_id": pet_id,
            "service": "grooming",
            "booking_datetime": past_time.isoformat(),
            "duration_minutes": 60,
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    assert "future" in response.json()["detail"]


@pytest.mark.asyncio
async def test_overlapping_booking_rejected(async_client: AsyncClient, user_token: str) -> None:
    """Test overlapping bookings are rejected."""
    # Create pet
    pet_response = await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "cat",
            "breed": "Persian",
            "age": "3",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert pet_response.status_code == 200
    pet_id = pet_response.json()["id"]

    # Create first booking
    booking_time = datetime.now(timezone.utc) + timedelta(days=1)
    await async_client.post(
        "/bookings",
        json={
            "pet_id": pet_id,
            "service": "grooming",
            "booking_datetime": booking_time.isoformat(),
            "duration_minutes": 60,
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )

    # Try to create overlapping booking
    response = await async_client.post(
        "/bookings",
        json={
            "pet_id": pet_id,
            "service": "grooming",
            "booking_datetime": (booking_time + timedelta(minutes=30)).isoformat(),
            "duration_minutes": 60,
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    assert "Overlapping" in response.json()["detail"]


@pytest.mark.asyncio
async def test_booking_status_fsm(async_client: AsyncClient, user_token: str) -> None:
    """Test booking status FSM transitions."""
    # Create pet
    pet_response = await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "cat",
            "breed": "Persian",
            "age": "3",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert pet_response.status_code == 200
    pet_id = pet_response.json()["id"]

    # Create booking
    booking_time = datetime.now(timezone.utc) + timedelta(days=1)
    booking_response = await async_client.post(
        "/bookings",
        json={
            "pet_id": pet_id,
            "service": "grooming",
            "booking_datetime": booking_time.isoformat(),
            "duration_minutes": 60,
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    booking_id = booking_response.json()["id"]

    # Update to confirmed
    response = await async_client.put(
        f"/bookings/{booking_id}/status",
        json={"status": "confirmed"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"

    # Update to completed
    response = await async_client.put(
        f"/bookings/{booking_id}/status",
        json={"status": "completed"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "completed"

    # Try invalid transition from completed
    response = await async_client.put(
        f"/bookings/{booking_id}/status",
        json={"status": "pending"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    assert "Cannot transition" in response.json()["detail"]


@pytest.mark.asyncio
async def test_invalid_status_transition_rejected(async_client: AsyncClient, user_token: str) -> None:
    """Test invalid status transitions are rejected."""
    # Create pet and booking
    pet_response = await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "cat",
            "breed": "Persian",
            "age": "3",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert pet_response.status_code == 200
    pet_id = pet_response.json()["id"]

    booking_time = datetime.now(timezone.utc) + timedelta(days=1)
    booking_response = await async_client.post(
        "/bookings",
        json={
            "pet_id": pet_id,
            "service": "grooming",
            "booking_datetime": booking_time.isoformat(),
            "duration_minutes": 60,
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    booking_id = booking_response.json()["id"]

    # Try to go from pending directly to completed (invalid)
    response = await async_client.put(
        f"/bookings/{booking_id}/status",
        json={"status": "completed"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    assert "Cannot transition" in response.json()["detail"]

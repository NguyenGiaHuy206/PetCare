import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_pet(async_client: AsyncClient, user_token: str) -> None:
    """Test pet creation."""
    response = await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "Cat",
            "breed": "Persian",
            "age": "3 years",
            "weight": 4.5,
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Fluffy"
    assert data["species"] == "Cat"
    assert data["breed"] == "Persian"
    assert data["age"] == "3 years"
    assert data["weight"] == 4.5


@pytest.mark.asyncio
async def test_create_pet_no_auth(async_client: AsyncClient) -> None:
    """Test pet creation without authentication."""
    response = await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "Cat",
            "breed": "Persian",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_user_pets(async_client: AsyncClient, user_token: str) -> None:
    """Test getting user pets."""
    # Create a pet first
    await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "Cat",
            "breed": "Persian",
            "age": "3 years",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )

    # Get pets
    response = await async_client.get(
        "/pets",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Fluffy"


@pytest.mark.asyncio
async def test_update_own_pet(async_client: AsyncClient, user_token: str) -> None:
    """Test updating own pet."""
    # Create pet
    create_response = await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "Cat",
            "breed": "Persian",
            "age": "3 years",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    pet_id = create_response.json()["id"]

    # Update pet
    response = await async_client.put(
        f"/pets/{pet_id}",
        json={
            "name": "Fluffy Updated",
            "age": "4 years",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Fluffy Updated"
    assert data["age"] == "4 years"


@pytest.mark.asyncio
async def test_user_cannot_update_other_user_pet(
    async_client: AsyncClient, user_token: str, test_db
) -> None:
    """Test that user A cannot update user B's pet."""
    from src.persistence.models import Pet
    from src.services.auth_service import AuthService

    # Create second user
    auth_service = AuthService(test_db)
    other_user = await auth_service.register(
        email="other@test.com", password="password123", full_name="Other User"
    )
    await test_db.commit()

    # Get first user
    from src.persistence.repositories.user_repo import UserRepository

    repo = UserRepository(test_db)
    first_user = await repo.get_by_email("user@test.com")

    # Create pet for first user
    pet = Pet(owner_id=first_user.id, name="Fluffy",
              species="Cat", breed="Persian")
    test_db.add(pet)
    await test_db.commit()

    # Try to update with second user's token
    other_token = auth_service.create_access_token(other_user.id)
    response = await async_client.put(
        f"/pets/{pet.id}",
        json={"name": "Updated"},
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert response.status_code == 403
    assert "Not your pet" in response.json()["detail"]


@pytest.mark.asyncio
async def test_delete_own_pet(async_client: AsyncClient, user_token: str) -> None:
    """Test deleting own pet."""
    # Create pet
    create_response = await async_client.post(
        "/pets",
        json={
            "name": "Fluffy",
            "species": "Cat",
            "breed": "Persian",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    pet_id = create_response.json()["id"]

    # Delete pet
    response = await async_client.delete(
        f"/pets/{pet_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200

    # Verify pet is deleted
    get_response = await async_client.get(
        "/pets",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert len(get_response.json()) == 0

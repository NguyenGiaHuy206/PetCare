import pytest
from httpx import AsyncClient
from decimal import Decimal


@pytest.mark.asyncio
async def test_create_product(async_client: AsyncClient, admin_token: str) -> None:
    """Test product creation by admin."""
    response = await async_client.post(
        "/products",
        json={
            "name": "Dog Food",
            "description": "Premium dog food",
            "price": 29.99,
            "stock": 100,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Dog Food"
    assert data["price"] == 29.99
    assert data["stock"] == 100


@pytest.mark.asyncio
async def test_product_creation_requires_admin(async_client: AsyncClient, user_token: str) -> None:
    """Test that non-admin users cannot create products."""
    response = await async_client.post(
        "/products",
        json={
            "name": "Dog Food",
            "description": "Premium dog food",
            "price": 29.99,
            "stock": 100,
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_order_success(async_client: AsyncClient, user_token: str, admin_token: str) -> None:
    """Test successful order creation."""
    # Create product
    product_response = await async_client.post(
        "/products",
        json={
            "name": "Dog Food",
            "description": "Premium dog food",
            "price": 29.99,
            "stock": 100,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = product_response.json()["id"]

    # Create order
    response = await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 2,
                }
            ]
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data
    assert "checkout_url" in data


@pytest.mark.asyncio
async def test_order_total_price_accurate(
    async_client: AsyncClient, user_token: str, admin_token: str, test_db
) -> None:
    """Test that order total price is calculated correctly."""
    # Create product
    product_response = await async_client.post(
        "/products",
        json={
            "name": "Dog Food",
            "price": 29.99,
            "stock": 100,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = product_response.json()["id"]

    # Create order with multiple items
    response = await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 2,
                }
            ]
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    order_id = response.json()["order_id"]

    # Check order total (should be 29.99 * 2 = 59.98)
    order_response = await async_client.get(
        f"/orders/{order_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    order_data = order_response.json()
    assert float(order_data["total"]) == pytest.approx(59.98, rel=0.01)


@pytest.mark.asyncio
async def test_insufficient_stock_rejected(async_client: AsyncClient, user_token: str, admin_token: str) -> None:
    """Test that orders with insufficient stock are rejected."""
    # Create product with limited stock
    product_response = await async_client.post(
        "/products",
        json={
            "name": "Rare Item",
            "price": 99.99,
            "stock": 2,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = product_response.json()["id"]

    # Try to order more than available
    response = await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 5,
                }
            ]
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]


@pytest.mark.asyncio
async def test_order_items_stored_correctly(
    async_client: AsyncClient, user_token: str, admin_token: str
) -> None:
    """Test that order items are stored correctly."""
    # Create product
    product_response = await async_client.post(
        "/products",
        json={
            "name": "Dog Food",
            "price": 29.99,
            "stock": 100,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = product_response.json()["id"]

    # Create order
    order_response = await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 3,
                }
            ]
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    order_id = order_response.json()["order_id"]

    # Get order and verify items
    response = await async_client.get(
        f"/orders/{order_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    order_data = response.json()
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["quantity"] == 3
    assert order_data["items"][0]["product_id"] == product_id


@pytest.mark.asyncio
async def test_stock_updated_after_order(async_client: AsyncClient, user_token: str, admin_token: str) -> None:
    """Test that product stock is updated after order."""
    # Create product with 100 stock
    product_response = await async_client.post(
        "/products",
        json={
            "name": "Dog Food",
            "price": 29.99,
            "stock": 100,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = product_response.json()["id"]

    # Create order with 10 items
    await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 10,
                }
            ]
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )

    # Check product stock
    response = await async_client.get(f"/products/{product_id}")
    product_data = response.json()
    assert product_data["stock"] == 90  # 100 - 10

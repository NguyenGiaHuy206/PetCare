import pytest
import stripe
from unittest.mock import patch, MagicMock
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
async def test_webhook_invalid_signature(async_client: AsyncClient) -> None:
    """Test webhook with invalid signature is rejected."""
    payload = b'{"type": "checkout.session.completed"}'
    headers = {"stripe-signature": "invalid_signature"}

    with patch("stripe.Webhook.construct_event") as mock_construct:
        mock_construct.side_effect = stripe.error.SignatureVerificationError(
            "sig", "msg")

        response = await async_client.post(
            "/payments/webhook",
            content=payload,
            headers=headers,
        )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_webhook_valid_event_marks_order_paid(
    async_client: AsyncClient, user_token: str, admin_token: str, test_db
) -> None:
    """Test valid webhook event marks order as paid."""
    # Create product and order
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

    order_response = await async_client.post(
        "/orders",
        json={
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 1,
                }
            ]
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    order_id = order_response.json()["order_id"]

    # Get order to get stripe session id (in real case, order creates stripe session)
    order_get = await async_client.get(
        f"/orders/{order_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    order_data = order_get.json()
    stripe_session_id = order_data["stripe_session_id"]

    # Mock stripe webhook event
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": stripe_session_id,
                "status": "complete",
            }
        },
    }

    with patch("stripe.Webhook.construct_event") as mock_construct:
        mock_construct.return_value = event

        payload = b'{"type": "checkout.session.completed"}'
        headers = {"stripe-signature": "valid_signature"}

        response = await async_client.post(
            "/payments/webhook",
            content=payload,
            headers=headers,
        )

    assert response.status_code == 200

    # Verify order is marked as paid
    order_get = await async_client.get(
        f"/orders/{order_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    order_data = order_get.json()
    assert order_data["status"] == "paid"


@pytest.mark.asyncio
async def test_webhook_invalid_payload(async_client: AsyncClient) -> None:
    """Test webhook with invalid payload is rejected."""
    with patch("stripe.Webhook.construct_event") as mock_construct:
        mock_construct.side_effect = ValueError("Invalid payload")

        response = await async_client.post(
            "/payments/webhook",
            content=b"invalid json",
            headers={"stripe-signature": "some_signature"},
        )

    assert response.status_code == 400

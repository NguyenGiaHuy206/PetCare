import pytest
from httpx import AsyncClient

from src.config import settings
from src.services.vnpay_service import VnpayService


@pytest.mark.asyncio
async def test_vnpay_return_invalid_signature(async_client: AsyncClient) -> None:
    response = await async_client.get(
        "/payments/vnpay/return",
        params={
            "vnp_TxnRef": "00000000-0000-0000-0000-000000000000",
            "vnp_ResponseCode": "00",
            "vnp_TransactionStatus": "00",
            "vnp_SecureHash": "invalid",
        },
        follow_redirects=False,
    )

    assert response.status_code in {302, 307}
    assert "/payment/failed" in response.headers["location"]


@pytest.mark.asyncio
async def test_vnpay_valid_return_marks_order_paid(
    async_client: AsyncClient, user_token: str, admin_token: str, monkeypatch
) -> None:
    monkeypatch.setattr(settings, "vnpay_tmn_code", "TESTCODE")
    monkeypatch.setattr(settings, "vnpay_hash_secret", "test-secret")

    product_response = await async_client.post(
        "/products",
        json={"name": "Dog Food", "price": 100000, "stock": 100},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    product_id = product_response.json()["id"]

    order_response = await async_client.post(
        "/orders",
        json={"items": [{"product_id": product_id, "quantity": 1}]},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    order_id = order_response.json()["order_id"]

    params = {
        "vnp_TxnRef": order_id,
        "vnp_ResponseCode": "00",
        "vnp_TransactionStatus": "00",
    }
    signed_query = VnpayService()._signed_query(params)

    response = await async_client.get(
        f"/payments/vnpay/return?{signed_query}",
        follow_redirects=False,
    )
    assert response.status_code in {302, 307}
    assert "/payment/success" in response.headers["location"]

    order_get = await async_client.get(
        f"/orders/{order_id}",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert order_get.json()["status"] == "paid"

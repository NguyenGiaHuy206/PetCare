import uuid

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from src.settings import settings
from src.persistence.repositories.cart_repo import CartRepository
from src.persistence.repositories.product_repo import ProductRepository


class ShippingService:
    """Giao Hang Nhanh shipping quote integration."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)

    def _ghn_headers(self) -> dict[str, str]:
        return {
            "Token": settings.ghn_token,
            "ShopId": str(settings.ghn_shop_id),
            "Content-Type": "application/json",
        }

    def _endpoint(self, explicit_url: str, fallback_path: str) -> str:
        return explicit_url or f"{settings.ghn_api_url}{fallback_path}"

    async def get_provinces(self) -> list[dict]:
        if not settings.ghn_token:
            return []
        url = self._endpoint(settings.ghn_province_url, "/master-data/province")
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, headers=self._ghn_headers())
        if response.status_code >= 400:
            raise ValueError(f"GHN province lookup failed: {response.text}")
        return response.json().get("data") or []

    async def get_districts(self, province_id: int) -> list[dict]:
        if not settings.ghn_token:
            return []
        url = self._endpoint(settings.ghn_district_url, "/master-data/district")
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                url,
                json={"province_id": province_id},
                headers=self._ghn_headers(),
            )
        if response.status_code >= 400:
            raise ValueError(f"GHN district lookup failed: {response.text}")
        return response.json().get("data") or []

    async def get_wards(self, district_id: int) -> list[dict]:
        if not settings.ghn_token:
            return []
        url = self._endpoint(settings.ghn_ward_url, "/master-data/ward")
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params={"district_id": district_id}, headers=self._ghn_headers())
        if response.status_code >= 400:
            raise ValueError(f"GHN ward lookup failed: {response.text}")
        return response.json().get("data") or []

    async def quote_cart(self, user_id: uuid.UUID, to_district_id: int, to_ward_code: str) -> dict:
        cart = await self.cart_repo.get_or_create_by_user(user_id)
        if not cart or not cart.items:
            raise ValueError("Cart is empty")

        total_weight = 0
        max_length = 0
        max_width = 0
        total_height = 0
        insurance_value = 0

        for item in cart.items:
            product = item.product or await self.product_repo.get_by_id(item.product_id)
            if not product:
                continue
            quantity = item.quantity
            total_weight += max(product.package_weight_gram, 0) * quantity
            max_length = max(max_length, product.package_length_cm)
            max_width = max(max_width, product.package_width_cm)
            total_height += max(product.package_height_cm, 0) * quantity
            insurance_value += float(product.price) * quantity

        total_weight = max(total_weight, 1)
        max_length = max(max_length, 1)
        max_width = max(max_width, 1)
        total_height = max(total_height, 1)

        missing_config = []
        if not settings.ghn_token:
            missing_config.append("GHN_TOKEN")
        if not settings.ghn_shop_id:
            missing_config.append("GHN_SHOP_ID")
        if not settings.ghn_from_district_id:
            missing_config.append("GHN_FROM_DISTRICT_ID")
        if missing_config:
            raise ValueError(f"GHN shipping is not configured: {', '.join(missing_config)}")

        payload = {
            "from_district_id": settings.ghn_from_district_id,
            "to_district_id": to_district_id,
            "to_ward_code": to_ward_code,
            "weight": total_weight,
            "length": max_length,
            "width": max_width,
            "height": total_height,
            "insurance_value": int(insurance_value),
        }
        if settings.ghn_service_id:
            payload["service_id"] = settings.ghn_service_id
        else:
            payload["service_type_id"] = 2

        fee_url = self._endpoint(settings.ghn_fee_url, "/v2/shipping-order/fee")
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(fee_url, json=payload, headers=self._ghn_headers())
        if response.status_code >= 400:
            raise ValueError(f"GHN fee quote failed: {response.text}")
        data = response.json().get("data") or {}

        return {
            "service_fee": float(data.get("total") or data.get("service_fee") or 0),
            "total_weight_gram": total_weight,
            "length_cm": max_length,
            "width_cm": max_width,
            "height_cm": total_height,
        }

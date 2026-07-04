import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: Optional[str] = None
    product_kind: Optional[str] = None
    product_image_url: Optional[str] = None
    quantity: int
    price_at_purchase: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    vat_amount: float = 0
    shipping_fee: float = 0
    payment_method: Literal["vnpay", "cod"] = "vnpay"


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "shipped", "delivered", "cancelled"]


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    total: float
    status: str
    payment_method: str
    payment_status: str
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckoutResponse(BaseModel):
    order_id: uuid.UUID
    checkout_url: str

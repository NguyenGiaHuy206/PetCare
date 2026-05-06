import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    price_at_purchase: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    total: float
    status: str
    stripe_session_id: Optional[str]
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckoutResponse(BaseModel):
    order_id: uuid.UUID
    checkout_url: str

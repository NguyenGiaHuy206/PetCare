import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CartItemResponse(BaseModel):
    """Cart item response."""

    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    price_at_add: float
    created_at: datetime

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    """Shopping cart response."""

    id: uuid.UUID
    user_id: uuid.UUID
    items: list[CartItemResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AddToCartRequest(BaseModel):
    """Request to add item to cart."""

    product_id: uuid.UUID
    quantity: int = Field(gt=0)


class UpdateCartItemRequest(BaseModel):
    """Request to update cart item quantity."""

    quantity: int = Field(ge=0)


class CartTotalResponse(BaseModel):
    """Cart total response."""

    total: float

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from src.persistence.models import ProductKind


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    kind: ProductKind = ProductKind.SHOP
    category_id: Optional[uuid.UUID] = None
    price: float
    stock: int
    duration_minutes: Optional[int] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    kind: Optional[ProductKind] = None
    category_id: Optional[uuid.UUID] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    duration_minutes: Optional[int] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    kind: ProductKind
    category_id: Optional[uuid.UUID]
    price: float
    stock: int
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

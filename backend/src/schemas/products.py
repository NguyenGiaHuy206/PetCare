import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from src.persistence.models import ProductKind


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    kind: ProductKind = ProductKind.SHOP
    category_id: Optional[uuid.UUID] = None
    price: float
    stock: int = Field(ge=0)
    duration_minutes: Optional[int] = None
    package_weight_gram: int = Field(default=0, ge=0)
    package_length_cm: int = Field(default=0, ge=0)
    package_width_cm: int = Field(default=0, ge=0)
    package_height_cm: int = Field(default=0, ge=0)
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    kind: Optional[ProductKind] = None
    category_id: Optional[uuid.UUID] = None
    price: Optional[float] = None
    stock: Optional[int] = Field(default=None, ge=0)
    duration_minutes: Optional[int] = None
    package_weight_gram: Optional[int] = Field(default=None, ge=0)
    package_length_cm: Optional[int] = Field(default=None, ge=0)
    package_width_cm: Optional[int] = Field(default=None, ge=0)
    package_height_cm: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    kind: ProductKind
    category_id: Optional[uuid.UUID]
    price: float
    stock: int
    duration_minutes: Optional[int] = None
    package_weight_gram: int = 0
    package_length_cm: int = 0
    package_width_cm: int = 0
    package_height_cm: int = 0
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

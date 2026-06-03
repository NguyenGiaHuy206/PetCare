import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.persistence.models import CategoryScope


class CategoryBase(BaseModel):
    name: str
    scope: CategoryScope


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
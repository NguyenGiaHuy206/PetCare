import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.persistence.database import Base


class CategoryScope(str, Enum):
    """Allowed category scopes for different domains."""

    SHOP = "shop"
    SERVICE = "service"
    CARELOG = "carelog"


class Category(Base):
    """Category model for configurable labels by scope."""

    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    scope: Mapped[CategoryScope] = mapped_column(
        SQLEnum(CategoryScope, values_callable=lambda enum: [e.value for e in enum]),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
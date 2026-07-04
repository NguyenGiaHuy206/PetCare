import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DECIMAL, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.persistence.database import Base


class ProductKind(str, Enum):
    """Product kind to separate shop items from service entries."""

    SHOP = "shop"
    SERVICE = "service"


class Product(Base):
    """Product model for e-commerce and service catalog entries."""

    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    kind: Mapped[ProductKind] = mapped_column(
        SQLEnum(ProductKind, values_callable=lambda enum: [e.value for e in enum]),
        nullable=False,
        index=True,
        default=ProductKind.SHOP,
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    price: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)
    duration_minutes: Mapped[int | None] = mapped_column(nullable=True)
    package_weight_gram: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    package_length_cm: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    package_width_cm: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    package_height_cm: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    order_items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="product", cascade="all, delete-orphan"
    )
    cart_items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="product", cascade="all, delete-orphan"
    )
    category: Mapped["Category | None"] = relationship("Category")

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DECIMAL, DateTime, Enum as SQLEnum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.persistence.database import Base


class UserRole(str, Enum):
    """User role enumeration."""

    USER = "user"
    ADMIN = "admin"


class BookingService(str, Enum):
    """Available booking services."""

    GROOMING = "grooming"
    BOARDING = "boarding"
    BATHING = "bathing"


class BookingStatus(str, Enum):
    """Booking status enumeration."""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CareLogActivity(str, Enum):
    """Care log activity types."""

    FEEDING = "feeding"
    GROOMING = "grooming"
    WALKING = "walking"


class OrderStatus(str, Enum):
    """Order status enumeration."""

    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class User(Base):
    """User model for authentication and pet ownership."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    
    # Relationships
    pets: Mapped[list["Pet"]] = relationship(
        "Pet", back_populates="owner", cascade="all, delete-orphan")
    bookings: Mapped[list["Booking"]] = relationship(
        "Booking", back_populates="user", cascade="all, delete-orphan"
    )
    care_logs: Mapped[list["CareLog"]] = relationship(
        "CareLog", back_populates="user", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="user", cascade="all, delete-orphan")


class Pet(Base):
    """Pet model for pet management."""

    __tablename__ = "pets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    species: Mapped[str] = mapped_column(String(100), nullable=False)
    breed: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[str | None] = mapped_column(String(100), nullable=True)
    weight: Mapped[float | None] = mapped_column(nullable=True)
    color: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    microchip_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="pets")
    bookings: Mapped[list["Booking"]] = relationship(
        "Booking", back_populates="pet", cascade="all, delete-orphan"
    )
    care_logs: Mapped[list["CareLog"]] = relationship(
        "CareLog", back_populates="pet", cascade="all, delete-orphan"
    )


class Booking(Base):
    """Booking model for pet care bookings."""

    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    pet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pets.id", ondelete="CASCADE"), nullable=False
    )
    service: Mapped[BookingService] = mapped_column(
        SQLEnum(BookingService), nullable=False)
    booking_datetime: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        SQLEnum(BookingStatus), default=BookingStatus.PENDING, nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="bookings")
    pet: Mapped["Pet"] = relationship("Pet", back_populates="bookings")


class CareLog(Base):
    """Care log model for logging pet care activities."""

    __tablename__ = "care_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    pet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pets.id", ondelete="CASCADE"), nullable=False
    )
    activity: Mapped[CareLogActivity] = mapped_column(
        SQLEnum(CareLogActivity), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="care_logs")
    pet: Mapped["Pet"] = relationship("Pet", back_populates="care_logs")


class Product(Base):
    """Product model for e-commerce."""

    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)
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


class Order(Base):
    """Order model for e-commerce orders."""

    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    total: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False
    )
    stripe_session_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    """Order item model for individual items in an order."""

    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(nullable=False)
    price_at_purchase: Mapped[float] = mapped_column(
        DECIMAL(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship(
        "Product", back_populates="order_items")

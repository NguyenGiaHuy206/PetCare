import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SQLEnum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.persistence.database import Base


class UserRole(str, Enum):
    """User role enumeration."""

    USER = "user"
    ADMIN = "admin"


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
        SQLEnum(UserRole, values_callable=lambda enum: [e.value for e in enum]),
        default=UserRole.USER,
        nullable=False,
    )
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
        "Order", back_populates="user", cascade="all, delete-orphan"
    )
    cart: Mapped["Cart"] = relationship(
        "Cart", back_populates="user", cascade="all, delete-orphan", uselist=False
    )

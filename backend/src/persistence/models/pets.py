import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.persistence.database import Base


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

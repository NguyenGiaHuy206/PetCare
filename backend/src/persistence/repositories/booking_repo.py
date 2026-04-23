import uuid
from datetime import datetime

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import Booking, BookingStatus


class BookingRepository:
    """Repository for Booking model database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        pet_id: uuid.UUID,
        service: str,
        booking_datetime: datetime,
        duration_minutes: int,
        notes: str | None = None,
    ) -> Booking:
        """Create a new booking."""
        booking = Booking(
            user_id=user_id,
            pet_id=pet_id,
            service=service,
            booking_datetime=booking_datetime,
            duration_minutes=duration_minutes,
            notes=notes,
        )
        self.db.add(booking)
        await self.db.flush()
        return booking

    async def get_by_id(self, booking_id: uuid.UUID) -> Booking | None:
        """Get booking by ID."""
        result = await self.db.execute(select(Booking).where(Booking.id == booking_id))
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> list[Booking]:
        """Get all bookings for a user with pagination."""
        result = await self.db.execute(
            select(Booking)
            .where(Booking.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(Booking.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_pet(self, pet_id: uuid.UUID) -> list[Booking]:
        """Get all bookings for a pet."""
        result = await self.db.execute(
            select(Booking).where(Booking.pet_id == pet_id).order_by(
                Booking.booking_datetime)
        )
        return result.scalars().all()

    async def get_overlapping(
        self, pet_id: uuid.UUID, service: str, start: datetime, end: datetime
    ) -> list[Booking]:
        """Get overlapping bookings for a pet and service."""
        # Get all active bookings for this pet and service
        result = await self.db.execute(
            select(Booking).where(
                and_(
                    Booking.pet_id == pet_id,
                    Booking.service == service,
                    Booking.status.in_(
                        [BookingStatus.PENDING, BookingStatus.CONFIRMED]
                    ),
                )
            )
        )
        bookings = result.scalars().all()

        # Filter for overlaps in Python
        from datetime import timedelta, timezone
        overlapping = []
        for booking in bookings:
            # Ensure both datetimes are offset-aware for comparison
            booking_dt = booking.booking_datetime
            if booking_dt.tzinfo is None:
                booking_dt = booking_dt.replace(tzinfo=timezone.utc)

            start_dt = start
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)

            end_dt = end
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=timezone.utc)

            booking_end = booking_dt + \
                timedelta(minutes=booking.duration_minutes)

            # Check if ranges overlap
            if booking_dt < end_dt and booking_end > start_dt:
                overlapping.append(booking)

        return overlapping

    async def get_all(self, skip: int = 0, limit: int = 20, status: str | None = None) -> list[Booking]:
        """Get all bookings with optional status filter and pagination."""
        query = select(Booking)
        if status:
            query = query.where(Booking.status == BookingStatus(status))
        query = query.offset(skip).limit(
            limit).order_by(Booking.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update(self, booking_id: uuid.UUID, **kwargs) -> Booking | None:
        """Update booking fields."""
        booking = await self.get_by_id(booking_id)
        if not booking:
            return None
        for key, value in kwargs.items():
            if hasattr(booking, key) and value is not None:
                setattr(booking, key, value)
        await self.db.flush()
        await self.db.refresh(booking)
        return booking

    async def delete(self, booking_id: uuid.UUID) -> bool:
        """Delete booking."""
        booking = await self.get_by_id(booking_id)
        if not booking:
            return False
        await self.db.delete(booking)
        await self.db.flush()
        return True

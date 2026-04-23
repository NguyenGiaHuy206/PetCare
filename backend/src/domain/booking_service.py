import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import Booking, BookingService, BookingStatus
from src.persistence.repositories.booking_repo import BookingRepository
from src.persistence.repositories.pet_repo import PetRepository


class BookingServiceImpl:
    """Service for booking management operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = BookingRepository(db)
        self.pet_repo = PetRepository(db)

    async def create(
        self,
        user_id: uuid.UUID,
        pet_id: uuid.UUID,
        service: str,
        booking_datetime: datetime,
        duration_minutes: int,
        notes: str | None = None,
    ) -> Booking:
        """Create a new booking with validations."""
        # Check if booking_datetime is in the future
        now = datetime.now(timezone.utc)
        if booking_datetime.replace(tzinfo=timezone.utc) <= now:
            raise ValueError("Booking datetime must be in the future")

        # Check if pet exists and belongs to user
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ValueError("Pet not found")
        if pet.owner_id != user_id:
            raise PermissionError("Pet does not belong to you")

        # Check for overlapping bookings
        end_datetime = booking_datetime.replace(
            hour=booking_datetime.hour, minute=booking_datetime.minute
        )
        end_datetime = end_datetime.replace(second=0, microsecond=0)
        # Add duration as timedelta
        from datetime import timedelta

        end_datetime = end_datetime + timedelta(minutes=duration_minutes)

        overlapping = await self.repo.get_overlapping(pet_id, service, booking_datetime, end_datetime)
        if overlapping:
            raise ValueError(
                "Overlapping booking exists for this pet and service")

        booking = await self.repo.create(
            user_id=user_id,
            pet_id=pet_id,
            service=service,
            booking_datetime=booking_datetime,
            duration_minutes=duration_minutes,
            notes=notes,
        )
        await self.db.commit()
        return booking

    async def get(self, booking_id: uuid.UUID) -> Booking:
        """Get a booking by ID."""
        booking = await self.repo.get_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        return booking

    async def get_user_bookings(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> list[Booking]:
        """Get all bookings for a user."""
        return await self.repo.get_by_user(user_id, skip, limit)

    async def get_all_bookings(
        self, skip: int = 0, limit: int = 20, status: str | None = None
    ) -> list[Booking]:
        """Get all bookings (admin endpoint)."""
        return await self.repo.get_all(skip, limit, status)

    async def update_status(
        self, booking_id: uuid.UUID, user_id: uuid.UUID, new_status: str, is_admin: bool = False
    ) -> Booking:
        """Update booking status with FSM validation."""
        booking = await self.repo.get_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found")

        # Check authorization
        if not is_admin and booking.user_id != user_id:
            raise PermissionError("You cannot update this booking")

        current_status = booking.status.value if isinstance(
            booking.status, BookingStatus) else booking.status

        # FSM validation
        valid_transitions = {
            BookingStatus.PENDING.value: [
                BookingStatus.CONFIRMED.value,
                BookingStatus.CANCELLED.value,
            ],
            BookingStatus.CONFIRMED.value: [BookingStatus.COMPLETED.value, BookingStatus.CANCELLED.value],
            BookingStatus.COMPLETED.value: [],
            BookingStatus.CANCELLED.value: [],
        }

        if new_status not in valid_transitions.get(current_status, []):
            raise ValueError(
                f"Cannot transition from {current_status} to {new_status}")

        updated = await self.repo.update(booking_id, status=BookingStatus(new_status))
        await self.db.commit()
        return updated

    async def update_notes(self, booking_id: uuid.UUID, user_id: uuid.UUID, notes: str) -> Booking:
        """Update booking notes."""
        booking = await self.repo.get_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        if booking.user_id != user_id:
            raise PermissionError("You cannot update this booking")

        updated = await self.repo.update(booking_id, notes=notes)
        await self.db.commit()
        return updated

    async def delete(self, booking_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a booking."""
        booking = await self.repo.get_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        if booking.user_id != user_id:
            raise PermissionError("You cannot delete this booking")

        success = await self.repo.delete(booking_id)
        await self.db.commit()
        return success

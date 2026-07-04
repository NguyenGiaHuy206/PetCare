import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.persistence.models import Booking, BookingStatus, Notification, User, UserRole


class NotificationService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, user_id: uuid.UUID, type_: str, title: str, message: str) -> Notification:
        notification = Notification(user_id=user_id, type=type_, title=title, message=message)
        self.db.add(notification)
        await self.db.flush()
        return notification

    async def create_for_admins(self, type_: str, title: str, message: str) -> list[Notification]:
        result = await self.db.execute(select(User).where(User.role == UserRole.ADMIN))
        admins = result.scalars().all()
        notifications = []
        for admin in admins:
            notifications.append(await self.create(admin.id, type_, title, message))
        return notifications

    async def list_for_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def ensure_booking_reminders(self, user_id: uuid.UUID) -> None:
        now = datetime.now(timezone.utc)
        upcoming = now + timedelta(hours=24)
        result = await self.db.execute(
            select(Booking)
            .options(selectinload(Booking.pet))
            .where(
                Booking.user_id == user_id,
                Booking.status == BookingStatus.CONFIRMED,
                Booking.booking_datetime >= now,
                Booking.booking_datetime <= upcoming,
            )
        )
        bookings = result.scalars().all()
        for booking in bookings:
            pet_name = booking.pet.name if booking.pet else "your pet"
            message = f"Reminder: {booking.service} for {pet_name} is scheduled at {booking.booking_datetime}."
            existing_result = await self.db.execute(
                select(Notification).where(
                    Notification.user_id == user_id,
                    Notification.type == "reminder",
                    Notification.message == message,
                )
            )
            if existing_result.scalar_one_or_none():
                continue
            await self.create(
                user_id,
                "reminder",
                "Booking reminder",
                message,
            )

    async def mark_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> Notification | None:
        notification = await self.db.get(Notification, notification_id)
        if not notification or notification.user_id != user_id:
            return None
        notification.is_read = True
        await self.db.flush()
        return notification

    async def mark_all_read(self, user_id: uuid.UUID) -> None:
        notifications = await self.list_for_user(user_id)
        for notification in notifications:
            notification.is_read = True
        await self.db.flush()

    async def delete(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        notification = await self.db.get(Notification, notification_id)
        if not notification or notification.user_id != user_id:
            return False
        await self.db.delete(notification)
        await self.db.flush()
        return True

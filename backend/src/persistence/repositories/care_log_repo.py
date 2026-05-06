import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import CareLog, Pet


class CareLogRepository:
    """Repository for CareLog model database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        pet_id: uuid.UUID,
        activity: str,
        timestamp: datetime,
        notes: str | None = None,
        image_url: str | None = None,
    ) -> CareLog:
        """Create a new care log."""
        log = CareLog(
            user_id=user_id,
            pet_id=pet_id,
            activity=activity,
            timestamp=timestamp,
            notes=notes,
            image_url=image_url,
        )
        self.db.add(log)
        await self.db.flush()
        return log

    async def get_by_id(self, log_id: uuid.UUID) -> CareLog | None:
        """Get care log by ID."""
        result = await self.db.execute(select(CareLog).where(CareLog.id == log_id))
        return result.scalar_one_or_none()

    async def get_by_pet(
        self, pet_id: uuid.UUID, skip: int = 0, limit: int = 20, sort: str = "desc"
    ) -> list[CareLog]:
        """Get all care logs for a pet with optional sorting."""
        order_clause = CareLog.timestamp.desc() if sort == "desc" else CareLog.timestamp.asc()
        result = await self.db.execute(
            select(CareLog)
            .where(CareLog.pet_id == pet_id)
            .order_by(order_clause)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_all(self, skip: int = 0, limit: int = 20, sort: str = "desc") -> list[CareLog]:
        """Get all care logs with pagination and sorting."""
        order_clause = CareLog.timestamp.desc() if sort == "desc" else CareLog.timestamp.asc()
        result = await self.db.execute(
            select(CareLog).order_by(order_clause).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def get_by_owner(
        self, owner_id: uuid.UUID, skip: int = 0, limit: int = 20, sort: str = "desc"
    ) -> list[CareLog]:
        """Get all care logs for pets owned by a user."""
        order_clause = CareLog.timestamp.desc() if sort == "desc" else CareLog.timestamp.asc()
        result = await self.db.execute(
            select(CareLog)
            .join(Pet, Pet.id == CareLog.pet_id)
            .where(Pet.owner_id == owner_id)
            .order_by(order_clause)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update(self, log_id: uuid.UUID, **kwargs) -> CareLog | None:
        """Update care log fields."""
        log = await self.get_by_id(log_id)
        if not log:
            return None
        for key, value in kwargs.items():
            if hasattr(log, key) and value is not None:
                setattr(log, key, value)
        await self.db.flush()
        return log

    async def delete(self, log_id: uuid.UUID) -> bool:
        """Delete care log."""
        log = await self.get_by_id(log_id)
        if not log:
            return False
        await self.db.delete(log)
        await self.db.flush()
        return True

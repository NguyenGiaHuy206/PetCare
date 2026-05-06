import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import CareLog
from src.persistence.repositories.care_log_repo import CareLogRepository
from src.persistence.repositories.pet_repo import PetRepository


class CareLogService:
    """Service for care log operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = CareLogRepository(db)
        self.pet_repo = PetRepository(db)

    async def create(
        self,
        actor_user_id: uuid.UUID,
        pet_id: uuid.UUID,
        activity: str,
        timestamp: datetime,
        notes: str | None = None,
        image_url: str | None = None,
        is_admin: bool = False,
        target_user_id: uuid.UUID | None = None,
    ) -> CareLog:
        """Create a new care log."""
        # Check if pet exists and belongs to user
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ValueError("Pet not found")
        owner_id = target_user_id or pet.owner_id
        if is_admin and target_user_id and pet.owner_id != target_user_id:
            raise PermissionError("Selected user does not own this pet")
        if not is_admin and pet.owner_id != actor_user_id:
            raise PermissionError("Pet does not belong to you")

        log = await self.repo.create(
            user_id=owner_id,
            pet_id=pet_id,
            activity=activity,
            timestamp=timestamp,
            notes=notes,
            image_url=image_url,
        )
        await self.db.commit()
        await self.db.refresh(log)
        return log

    async def get(self, log_id: uuid.UUID) -> CareLog:
        """Get a care log by ID."""
        log = await self.repo.get_by_id(log_id)
        if not log:
            raise ValueError("Care log not found")
        return log

    async def get_by_pet(
        self,
        pet_id: uuid.UUID,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
        sort: str = "desc",
        is_admin: bool = False,
    ) -> list[CareLog]:
        """Get care logs for a pet (with ownership validation)."""
        pet = await self.pet_repo.get_by_id(pet_id)
        if not pet:
            raise ValueError("Pet not found")
        if not is_admin and pet.owner_id != user_id:
            raise PermissionError("Pet does not belong to you")

        return await self.repo.get_by_pet(pet_id, skip, limit, sort)

    async def get_all(self, skip: int = 0, limit: int = 20, sort: str = "desc") -> list[CareLog]:
        """Get all care logs (admin endpoint)."""
        return await self.repo.get_all(skip, limit, sort)

    async def get_for_owner(self, owner_id: uuid.UUID, skip: int = 0, limit: int = 20, sort: str = "desc") -> list[CareLog]:
        """Get care logs for all pets owned by a user."""
        return await self.repo.get_by_owner(owner_id, skip, limit, sort)

    async def update(self, log_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False, **kwargs) -> CareLog:
        """Update a care log."""
        log = await self.repo.get_by_id(log_id)
        if not log:
            raise ValueError("Care log not found")
        if not is_admin and log.user_id != user_id:
            raise PermissionError("You cannot update this care log")

        updated = await self.repo.update(log_id, **kwargs)
        await self.db.commit()
        await self.db.refresh(updated)
        return updated

    async def delete(self, log_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False) -> bool:
        """Delete a care log."""
        log = await self.repo.get_by_id(log_id)
        if not log:
            raise ValueError("Care log not found")
        if not is_admin and log.user_id != user_id:
            raise PermissionError("You cannot delete this care log")

        success = await self.repo.delete(log_id)
        await self.db.commit()
        return success

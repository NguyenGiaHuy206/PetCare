import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.persistence.models import Pet


class PetRepository:
    """Repository for Pet model database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self,
        owner_id: uuid.UUID,
        name: str,
        species: str,
        breed: str,
        age: str | None = None,
        weight: float | None = None,
        color: str | None = None,
        gender: str | None = None,
        microchip_id: str | None = None,
        notes: str | None = None,
        photo_url: str | None = None,
    ) -> Pet:
        """Create a new pet."""
        pet = Pet(
            owner_id=owner_id,
            name=name,
            species=species,
            breed=breed,
            age=age,
            weight=weight,
            color=color,
            gender=gender,
            microchip_id=microchip_id,
            notes=notes,
            photo_url=photo_url,
        )
        self.db.add(pet)
        await self.db.flush()
        await self.db.refresh(pet)
        return pet

    async def get_by_id(self, pet_id: uuid.UUID) -> Pet | None:
        """Get pet by ID."""
        result = await self.db.execute(select(Pet).where(Pet.id == pet_id))
        return result.scalar_one_or_none()

    async def get_by_owner(self, owner_id: uuid.UUID) -> list[Pet]:
        """Get all pets for an owner."""
        result = await self.db.execute(select(Pet).where(Pet.owner_id == owner_id))
        return result.scalars().all()

    async def update(self, pet_id: uuid.UUID, **kwargs) -> Pet | None:
        """Update pet fields."""
        pet = await self.get_by_id(pet_id)
        if not pet:
            return None
        for key, value in kwargs.items():
            if hasattr(pet, key) and value is not None:
                setattr(pet, key, value)
        await self.db.flush()
        await self.db.refresh(pet)
        return pet

    async def delete(self, pet_id: uuid.UUID) -> bool:
        """Delete pet."""
        pet = await self.get_by_id(pet_id)
        if not pet:
            return False
        await self.db.delete(pet)
        await self.db.flush()
        return True

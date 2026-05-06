import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import Pet
from src.persistence.repositories.pet_repo import PetRepository


class PetService:
    """Service for pet management operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = PetRepository(db)

    async def create(
        self,
        owner_id: uuid.UUID,
        name: str,
        species: str,
        breed: str,
        age: str = None,
        weight: float = None,
        color: str = None,
        gender: str = None,
        microchip_id: str = None,
        notes: str = None,
        photo_url: str = None,
    ) -> Pet:
        """Create a new pet."""
        pet = await self.repo.create(
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
        await self.db.commit()
        return pet

    async def get(self, pet_id: uuid.UUID) -> Pet:
        """Get a pet by ID."""
        pet = await self.repo.get_by_id(pet_id)
        if not pet:
            raise ValueError("Pet not found")
        return pet

    async def get_owner_pets(self, owner_id: uuid.UUID) -> list[Pet]:
        """Get all pets for an owner."""
        return await self.repo.get_by_owner(owner_id)

    async def get_all_pets(self) -> list[Pet]:
        """Get all pets for admin views."""
        return await self.repo.get_all()

    async def update(self, pet_id: uuid.UUID, owner_id: uuid.UUID, **kwargs) -> Pet:
        """Update a pet (ownership validation)."""
        pet = await self.repo.get_by_id(pet_id)
        if not pet:
            raise ValueError("Pet not found")
        if pet.owner_id != owner_id:
            raise PermissionError("Not your pet")

        updated = await self.repo.update(pet_id, **kwargs)
        await self.db.commit()
        return updated

    async def delete(self, pet_id: uuid.UUID, owner_id: uuid.UUID, is_admin: bool = False) -> bool:
        """Delete a pet (ownership validation, admin override)."""
        pet = await self.repo.get_by_id(pet_id)
        if not pet:
            raise ValueError("Pet not found")
        if not is_admin and pet.owner_id != owner_id:
            raise PermissionError("Not your pet")

        success = await self.repo.delete(pet_id)
        await self.db.commit()
        return success

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db
from src.domain.pet_service import PetService
from src.persistence.models import User
from src.schemas import PetCreate, PetResponse, PetUpdate

router = APIRouter(prefix="/pets", tags=["pets"])


@router.post("", response_model=PetResponse)
async def create_pet(
    request: PetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PetResponse:
    """Create a new pet."""
    service = PetService(db)
    try:
        pet = await service.create(
            current_user.id,
            request.name,
            request.species,
            request.breed,
            age=request.age,
            weight=request.weight,
            color=request.color,
            gender=request.gender,
            microchip_id=request.microchip_id,
            notes=request.notes,
            photo_url=request.photo_url,
        )
        return PetResponse.model_validate(pet)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pet: {str(e)}")


@router.get("", response_model=list[PetResponse])
async def get_pets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PetResponse]:
    """Get all pets for current user."""
    service = PetService(db)
    try:
        pets = await service.get_owner_pets(current_user.id)
        return [PetResponse.model_validate(p) for p in pets]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pets: {str(e)}")


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PetResponse:
    """Get a specific pet."""
    service = PetService(db)
    try:
        pet = await service.get(uuid.UUID(pet_id))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pet: {str(e)}")

    # Check ownership outside the try/except so HTTPException propagates correctly
    if pet.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your pet")

    return PetResponse.model_validate(pet)


@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: str,
    request: PetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PetResponse:
    """Update a pet."""
    service = PetService(db)
    try:
        update_data = request.model_dump(exclude_unset=True)
        pet = await service.update(uuid.UUID(pet_id), current_user.id, **update_data)
        return PetResponse.model_validate(pet)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update pet: {str(e)}")


@router.delete("/{pet_id}")
async def delete_pet(
    pet_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a pet."""
    service = PetService(db)
    try:
        await service.delete(uuid.UUID(pet_id), current_user.id)
        return {"message": "Pet deleted"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete pet: {str(e)}")

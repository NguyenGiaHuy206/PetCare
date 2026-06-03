import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db, require_admin
from src.services.care_log_service import CareLogService
from src.persistence.models import User
from src.schemas import CareLogCreate, CareLogResponse

router = APIRouter(prefix="/care-logs", tags=["care-logs"])


@router.post("", response_model=CareLogResponse)
async def create_care_log(
    request: CareLogCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> CareLogResponse:
    """Create a new care log."""
    service = CareLogService(db)
    try:
        log = await service.create(
            current_user.id,
            request.pet_id,
            request.activity,
            request.timestamp,
            request.notes,
            request.image_url,
            is_admin=True,
            target_user_id=request.user_id,
        )
        return CareLogResponse.model_validate(log)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("", response_model=list[CareLogResponse])
async def get_care_logs(
    pet_id: str = Query(None),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CareLogResponse]:
    """Get care logs, optionally filtered by pet_id."""
    service = CareLogService(db)
    try:
        role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if role_value == "admin":
            if pet_id:
                logs = await service.get_by_pet(uuid.UUID(pet_id), current_user.id, skip, limit, sort, is_admin=True)
            else:
                logs = await service.get_all(skip, limit, sort)
        else:
            if pet_id:
                logs = await service.get_by_pet(uuid.UUID(pet_id), current_user.id, skip, limit, sort)
            else:
                logs = await service.get_for_owner(current_user.id, skip, limit, sort)
        return [CareLogResponse.model_validate(log) for log in logs]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/{log_id}", response_model=CareLogResponse)
async def get_care_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CareLogResponse:
    """Get a specific care log."""
    service = CareLogService(db)
    try:
        log = await service.get(uuid.UUID(log_id))
        role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if role_value != "admin" and log.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your log")
        return CareLogResponse.model_validate(log)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{log_id}", response_model=CareLogResponse)
async def update_care_log(
    log_id: str,
    request: CareLogCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> CareLogResponse:
    """Update a care log."""
    service = CareLogService(db)
    try:
        update_data = {
            "notes": request.notes,
            "image_url": request.image_url,
        }
        log = await service.update(uuid.UUID(log_id), current_user.id, is_admin=True, **update_data)
        return CareLogResponse.model_validate(log)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{log_id}")
async def delete_care_log(
    log_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a care log."""
    service = CareLogService(db)
    try:
        await service.delete(uuid.UUID(log_id), current_user.id, is_admin=True)
        return {"message": "Care log deleted"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db, require_admin
from src.domain.booking_service import BookingServiceImpl
from src.persistence.models import User
from src.schemas import BookingCreate, BookingResponse, BookingUpdate

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingResponse)
async def create_booking(
    request: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingResponse:
    """Create a new booking."""
    service = BookingServiceImpl(db)
    try:
        booking = await service.create(
            current_user.id,
            request.pet_id,
            request.service,
            request.booking_datetime,
            request.duration_minutes,
            request.notes,
        )
        return BookingResponse.model_validate(booking)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("", response_model=list[BookingResponse])
async def get_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BookingResponse]:
    """Get all bookings for current user."""
    service = BookingServiceImpl(db)
    bookings = await service.get_user_bookings(current_user.id, skip, limit)
    return [BookingResponse.model_validate(b) for b in bookings]


@router.get("/admin/all", response_model=list[BookingResponse])
async def get_all_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str = Query(None, alias="status"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[BookingResponse]:
    """Get all bookings (admin only)."""
    service = BookingServiceImpl(db)
    bookings = await service.get_all_bookings(skip, limit, status_filter)
    return [BookingResponse.model_validate(b) for b in bookings]


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingResponse:
    """Get a specific booking."""
    service = BookingServiceImpl(db)
    try:
        booking = await service.get(uuid.UUID(booking_id))
        if booking.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
        return BookingResponse.model_validate(booking)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: str,
    request: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingResponse:
    """Update booking status (FSM validation)."""
    service = BookingServiceImpl(db)
    try:
        if not request.status:
            raise ValueError("Status is required")
        booking = await service.update_status(uuid.UUID(booking_id), current_user.id, request.status)
        return BookingResponse.model_validate(booking)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: str,
    request: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingResponse:
    """Update booking notes."""
    service = BookingServiceImpl(db)
    try:
        if request.notes:
            booking = await service.update_notes(uuid.UUID(booking_id), current_user.id, request.notes)
        else:
            booking = await service.get(uuid.UUID(booking_id))
        return BookingResponse.model_validate(booking)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{booking_id}")
async def delete_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a booking."""
    service = BookingServiceImpl(db)
    try:
        await service.delete(uuid.UUID(booking_id), current_user.id)
        return {"message": "Booking deleted"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

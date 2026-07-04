import uuid
from datetime import date as date_type, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db, require_admin
from src.services.booking_service import BookingServiceImpl
from src.services.order_service import OrderService
from src.persistence.models import Booking, BookingStatus, ProductKind, User
from src.persistence.repositories.product_repo import ProductRepository
from src.schemas import BookingCreate, BookingResponse, BookingUpdate
from src.services.vnpay_service import VnpayService

router = APIRouter(prefix="/bookings", tags=["bookings"])
BOOKING_TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")


@router.get("/availability")
async def get_booking_availability(
    service: str = Query(..., min_length=1),
    date: date_type = Query(...),
    duration_minutes: int = Query(60, ge=30),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return 30-minute service booking slots for a day."""
    local_day_start = datetime.combine(date, time(0, 0), tzinfo=BOOKING_TIMEZONE)
    local_day_end = local_day_start + timedelta(days=1)
    day_start = local_day_start.astimezone(timezone.utc)
    day_end = local_day_end.astimezone(timezone.utc)
    result = await db.execute(
        select(Booking).where(
            Booking.service == service,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            Booking.booking_datetime >= day_start,
            Booking.booking_datetime < day_end,
        )
    )
    bookings = result.scalars().all()

    slots = []
    now_local = datetime.now(BOOKING_TIMEZONE)
    slot_start = datetime.combine(date, time(8, 0), tzinfo=BOOKING_TIMEZONE)
    last_start = datetime.combine(date, time(18, 0), tzinfo=BOOKING_TIMEZONE) - timedelta(minutes=duration_minutes)
    while slot_start <= last_start:
        slot_end = slot_start + timedelta(minutes=duration_minutes)
        slot_start_utc = slot_start.astimezone(timezone.utc)
        slot_end_utc = slot_end.astimezone(timezone.utc)
        occupied = False
        for booking in bookings:
            booking_start = booking.booking_datetime
            if booking_start.tzinfo is None:
                booking_start = booking_start.replace(tzinfo=timezone.utc)
            booking_start = booking_start.astimezone(timezone.utc)
            booking_end = booking_start + timedelta(minutes=booking.duration_minutes)
            if booking_start < slot_end_utc and booking_end > slot_start_utc:
                occupied = True
                break
        slots.append({
            "time": slot_start.strftime("%H:%M"),
            "available": not occupied and slot_start > now_local,
        })
        slot_start += timedelta(minutes=30)

    return {"date": date.isoformat(), "service": service, "duration_minutes": duration_minutes, "slots": slots}


@router.post("", response_model=BookingResponse)
async def create_booking(
    request: BookingCreate,
    http_request: Request,
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
        product_repo = ProductRepository(db)
        service_products = await product_repo.get_all(0, 100, request.service, ProductKind.SERVICE)
        service_product = next((product for product in service_products if product.name == request.service), None)
        if not service_product:
            raise ValueError("Service product not found for payment")
        order_service = OrderService(db)
        order = await order_service.create(
            current_user.id,
            [{"product_id": service_product.id, "quantity": 1}],
            payment_method=request.payment_method,
        )
        if request.payment_method == "vnpay":
            client_ip = http_request.client.host if http_request.client else "127.0.0.1"
            checkout_url = VnpayService().create_payment_url(order, client_ip, source="booking")
        else:
            checkout_url = order_service.checkout_url_for(order, source="booking")
        setattr(booking, "order_id", order.id)
        setattr(booking, "checkout_url", checkout_url)
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
    """Get bookings for current user or all bookings for admin."""
    service = BookingServiceImpl(db)
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_value == "admin":
        bookings = await service.get_all_bookings(skip, limit)
    else:
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
        role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if role_value != "admin" and booking.user_id != current_user.id:
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
        role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        booking = await service.update_status(
            uuid.UUID(booking_id),
            current_user.id,
            request.status,
            is_admin=(role_value == "admin"),
        )
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
        role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if request.notes:
            booking = await service.update_notes(
                uuid.UUID(booking_id),
                current_user.id,
                request.notes,
                is_admin=(role_value == "admin"),
            )
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
        role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        await service.delete(uuid.UUID(booking_id), current_user.id, is_admin=(role_value == "admin"))
        return {"message": "Booking deleted"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

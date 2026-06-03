import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db, require_admin
from src.services.order_service import OrderService
from src.persistence.models import User
from src.schemas import CheckoutResponse, OrderCreate, OrderResponse, OrderStatusUpdate
from src.tasks.background import send_order_receipt
from src.services.vnpay_service import VnpayService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=CheckoutResponse)
async def create_order(
    request: OrderCreate,
    http_request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    """Create a new order and initiate VNPAY checkout."""
    service = OrderService(db)
    try:
        # Create order
        order = await service.create(
            current_user.id,
            request.items,
            request.vat_amount,
            request.shipping_fee,
            request.payment_method,
        )

        if request.payment_method == "vnpay":
            client_ip = http_request.client.host if http_request.client else "127.0.0.1"
            checkout_url = VnpayService().create_payment_url(order, client_ip, source="cart")
        else:
            checkout_url = service.checkout_url_for(order, source="cart")

        # Send receipt email in background (using user ID as we don't have email property)
        background_tasks.add_task(
            send_order_receipt, str(current_user.id), str(order.id))

        return CheckoutResponse(order_id=order.id, checkout_url=checkout_url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[OrderResponse])
async def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OrderResponse]:
    """Get orders for current user, or all orders for admin."""
    service = OrderService(db)
    role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_value == "admin":
        orders = await service.get_all_orders(skip, limit)
    else:
        orders = await service.get_user_orders(current_user.id, skip, limit)
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/admin/all", response_model=list[OrderResponse])
async def get_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[OrderResponse]:
    """Get all orders (admin only)."""
    service = OrderService(db)
    orders = await service.get_all_orders(skip, limit, status)
    return [OrderResponse.model_validate(o) for o in orders]


@router.put("/admin/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    request: OrderStatusUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    """Update an order status (admin only)."""
    service = OrderService(db)
    try:
        order = await service.update_status(uuid.UUID(order_id), request.status)
        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{order_id}/pay", response_model=CheckoutResponse)
async def pay_existing_order(
    order_id: str,
    http_request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    """Create a fresh VNPAY checkout URL for an unpaid order."""
    service = OrderService(db)
    try:
        role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        order = await service.get_repayable_order(
            uuid.UUID(order_id),
            current_user.id,
            is_admin=role_value == "admin",
        )
        client_ip = http_request.client.host if http_request.client else "127.0.0.1"
        checkout_url = VnpayService().create_payment_url(
            order,
            client_ip,
            source=service.payment_source_for(order),
        )
        return CheckoutResponse(order_id=order.id, checkout_url=checkout_url)
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    """Get a specific order."""
    service = OrderService(db)
    try:
        order = await service.get(uuid.UUID(order_id))
        role_value = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if role_value != "admin" and order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")
        return OrderResponse.model_validate(order)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

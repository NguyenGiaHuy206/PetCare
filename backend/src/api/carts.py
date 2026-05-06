import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db
from src.persistence.models import User
from src.schemas.carts import (
    AddToCartRequest,
    CartResponse,
    CartTotalResponse,
    UpdateCartItemRequest,
)
from src.services.cart_service import CartService

router = APIRouter(prefix="/carts", tags=["carts"])


@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """Get current user's shopping cart."""
    service = CartService(db)
    cart = await service.get_user_cart(current_user.id)
    return CartResponse.model_validate(cart)


@router.post("/items", response_model=CartResponse)
async def add_to_cart(
    request: AddToCartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """Add item to cart."""
    service = CartService(db)
    try:
        await service.add_to_cart(current_user.id, request.product_id, request.quantity)
        cart = await service.get_user_cart(current_user.id)
        return CartResponse.model_validate(cart)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_from_cart(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """Remove item from cart."""
    service = CartService(db)
    success = await service.remove_from_cart(current_user.id, item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found"
        )
    cart = await service.get_user_cart(current_user.id)
    return CartResponse.model_validate(cart)


@router.patch("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: uuid.UUID,
    request: UpdateCartItemRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """Update cart item quantity. Use quantity=0 to remove."""
    service = CartService(db)
    try:
        await service.update_cart_item(current_user.id, item_id, request.quantity)
        cart = await service.get_user_cart(current_user.id)
        return CartResponse.model_validate(cart)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.delete("", response_model=CartResponse)
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """Clear all items from cart."""
    service = CartService(db)
    await service.clear_cart(current_user.id)
    cart = await service.get_user_cart(current_user.id)
    return CartResponse.model_validate(cart)


@router.get("/total", response_model=CartTotalResponse)
async def get_cart_total(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CartTotalResponse:
    """Get total price for user's cart."""
    service = CartService(db)
    total = await service.get_cart_total(current_user.id)
    return CartTotalResponse(total=total)

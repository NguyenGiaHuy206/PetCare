import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.persistence.models import Cart, CartItem


class CartRepository:
    """Repository for cart operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_or_create_by_user(self, user_id: uuid.UUID) -> Cart:
        """Get user's cart or create one if it doesn't exist."""
        stmt = select(Cart).where(Cart.user_id == user_id).options(
            selectinload(Cart.items).selectinload(CartItem.product)
        )
        cart = await self.db.execute(stmt)
        cart = cart.scalar_one_or_none()

        if not cart:
            cart = Cart(user_id=user_id)
            self.db.add(cart)
            await self.db.flush()

        return cart

    async def get_by_id(self, cart_id: uuid.UUID) -> Cart | None:
        """Get cart by ID with items and products."""
        stmt = select(Cart).where(Cart.id == cart_id).options(
            selectinload(Cart.items).selectinload(CartItem.product)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def add_item(
        self, cart_id: uuid.UUID, product_id: uuid.UUID, quantity: int, price_at_add: float
    ) -> CartItem:
        """Add or update item in cart."""
        # Check if item already exists
        stmt = select(CartItem).where(
            (CartItem.cart_id == cart_id) & (CartItem.product_id == product_id)
        )
        result = await self.db.execute(stmt)
        item = result.scalar_one_or_none()

        if item:
            # Update existing item
            item.quantity += quantity
            item.price_at_add = price_at_add
        else:
            # Create new item
            item = CartItem(
                cart_id=cart_id,
                product_id=product_id,
                quantity=quantity,
                price_at_add=price_at_add,
            )
            self.db.add(item)

        await self.db.flush()
        return item

    async def remove_item(self, cart_id: uuid.UUID, item_id: uuid.UUID) -> bool:
        """Remove item from cart."""
        stmt = delete(CartItem).where(
            (CartItem.id == item_id) & (CartItem.cart_id == cart_id)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount > 0

    async def update_item_quantity(
        self, cart_id: uuid.UUID, item_id: uuid.UUID, quantity: int
    ) -> CartItem | None:
        """Update item quantity."""
        stmt = select(CartItem).where(
            (CartItem.id == item_id) & (CartItem.cart_id == cart_id)
        )
        result = await self.db.execute(stmt)
        item = result.scalar_one_or_none()

        if item:
            if quantity <= 0:
                # Remove if quantity is 0 or negative
                await self.remove_item(cart_id, item_id)
                return None
            item.quantity = quantity
            await self.db.flush()

        return item

    async def clear(self, cart_id: uuid.UUID) -> None:
        """Clear all items from cart."""
        stmt = delete(CartItem).where(CartItem.cart_id == cart_id)
        await self.db.execute(stmt)
        await self.db.flush()

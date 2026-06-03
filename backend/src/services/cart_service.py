import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import Cart, CartItem
from src.persistence.repositories.cart_repo import CartRepository
from src.persistence.repositories.product_repo import ProductRepository


class CartService:
    """Service for cart management operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = CartRepository(db)
        self.product_repo = ProductRepository(db)

    async def get_user_cart(self, user_id: uuid.UUID) -> Cart:
        """Get or create user's cart."""
        return await self.repo.get_or_create_by_user(user_id)

    async def add_to_cart(
        self, user_id: uuid.UUID, product_id: uuid.UUID, quantity: int
    ) -> CartItem:
        """Add product to cart with stock validation."""
        if quantity <= 0:
            raise ValueError("Quantity must be positive")

        # Validate product exists and get current price
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")

        if product.stock < quantity:
            raise ValueError(f"Insufficient stock for {product.name}")

        # Get or create cart
        cart = await self.repo.get_or_create_by_user(user_id)

        # Add item to cart
        item = await self.repo.add_item(
            cart.id, product_id, quantity, float(product.price)
        )

        await self.db.commit()
        return item

    async def remove_from_cart(
        self, user_id: uuid.UUID, item_id: uuid.UUID
    ) -> bool:
        """Remove item from user's cart."""
        cart = await self.repo.get_or_create_by_user(user_id)
        success = await self.repo.remove_item(cart.id, item_id)
        await self.db.commit()
        return success

    async def update_cart_item(
        self, user_id: uuid.UUID, item_id: uuid.UUID, quantity: int
    ) -> CartItem | None:
        """Update quantity of item in cart."""
        if quantity < 0:
            raise ValueError("Quantity cannot be negative")

        cart = await self.repo.get_or_create_by_user(user_id)
        item = await self.repo.update_item_quantity(cart.id, item_id, quantity)
        await self.db.commit()
        return item

    async def clear_cart(self, user_id: uuid.UUID) -> None:
        """Clear all items from user's cart."""
        cart = await self.repo.get_or_create_by_user(user_id)
        await self.repo.clear(cart.id)
        await self.db.commit()

    async def get_cart_total(self, user_id: uuid.UUID) -> float:
        """Calculate total price for user's cart."""
        cart = await self.repo.get_or_create_by_user(user_id)
        total = sum(float(item.price_at_add) * item.quantity for item in cart.items)
        return total

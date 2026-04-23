import uuid
from datetime import datetime, timezone

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config import settings
from src.persistence.models import Order, OrderItem, OrderStatus
from src.persistence.repositories.order_repo import OrderRepository
from src.persistence.repositories.product_repo import ProductRepository

stripe.api_key = settings.stripe_secret_key


class OrderService:
    """Service for order management operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = OrderRepository(db)
        self.product_repo = ProductRepository(db)

    async def create(self, user_id: uuid.UUID, items: list) -> Order:
        """Create a new order with items and stock validation."""
        if not items:
            raise ValueError("Order must have at least one item")

        total = 0.0
        order_items = []

        # Validate all items first
        for item in items:
            # Handle both dict and Pydantic model
            product_id = item.product_id if hasattr(
                item, 'product_id') else item["product_id"]
            quantity = item.quantity if hasattr(
                item, 'quantity') else item["quantity"]

            if quantity <= 0:
                raise ValueError("Quantity must be positive")

            product = await self.product_repo.get_by_id(product_id)
            if not product:
                raise ValueError(f"Product {product_id} not found")

            if product.stock < quantity:
                raise ValueError(f"Insufficient stock for {product.name}")

            # Calculate item total
            item_total = float(product.price) * quantity
            total += item_total
            order_items.append((product, quantity, float(product.price)))

            # Update stock
            await self.product_repo.update(product_id, stock=product.stock - quantity)

        # Create order
        order = await self.repo.create(user_id, total)

        # Create order items
        for product, quantity, price_at_purchase in order_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                price_at_purchase=price_at_purchase,
            )
            self.db.add(order_item)

        await self.db.flush()
        await self.db.commit()
        return order

    async def get(self, order_id: uuid.UUID) -> Order:
        """Get an order by ID."""
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        return order

    async def get_user_orders(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> list[Order]:
        """Get all orders for a user."""
        return await self.repo.get_by_user(user_id, skip, limit)

    async def get_all_orders(
        self, skip: int = 0, limit: int = 20, status: str | None = None
    ) -> list[Order]:
        """Get all orders (admin endpoint)."""
        return await self.repo.get_all(skip, limit, status)

    async def create_stripe_session(self, order: Order) -> dict:
        """Create a Stripe checkout session for an order."""
        try:
            # Fetch order items separately to avoid lazy loading issues
            # Get order with items by querying directly
            result = await self.db.execute(
                select(Order)
                .where(Order.id == order.id)
                .options(selectinload(Order.items).selectinload(OrderItem.product))
            )
            order_refreshed = result.scalars().one()

            # Build line items for Stripe
            line_items = []
            for item in order_refreshed.items:
                line_items.append(
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {
                                "name": item.product.name,
                                "description": item.product.description or "",
                            },
                            # Convert to cents
                            "unit_amount": int(item.price_at_purchase * 100),
                        },
                        "quantity": item.quantity,
                    }
                )

            # Create Stripe session
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=line_items,
                mode="payment",
                success_url=f"{settings.frontend_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.frontend_url}/payment/failed?session_id={{CHECKOUT_SESSION_ID}}",
                metadata={"order_id": str(order.id)},
            )

            # Save stripe_session_id to order
            await self.repo.update(order.id, stripe_session_id=session.id)
            await self.db.commit()

            return {"checkout_url": session.url, "session_id": session.id}
        except stripe.error.StripeError as e:
            raise ValueError(f"Failed to create Stripe session: {e}")

    async def mark_paid(self, stripe_session_id: str) -> Order:
        """Mark an order as paid after Stripe webhook."""
        order = await self.repo.get_by_stripe_session(stripe_session_id)
        if not order:
            raise ValueError("Order not found for session")

        await self.repo.update(order.id, status=OrderStatus.PAID.value)
        await self.db.commit()
        return order

    async def cancel_order(self, order_id: uuid.UUID) -> Order:
        """Cancel an order and restore stock."""
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        if order.status != OrderStatus.PENDING.value:
            raise ValueError("Can only cancel pending orders")

        # Restore stock for all items
        for item in order.items:
            current_product = await self.product_repo.get_by_id(item.product_id)
            if current_product:
                await self.product_repo.update(
                    item.product_id, stock=current_product.stock + item.quantity
                )

        # Cancel order
        await self.repo.update(order_id, status=OrderStatus.CANCELLED.value)
        await self.db.commit()
        return order

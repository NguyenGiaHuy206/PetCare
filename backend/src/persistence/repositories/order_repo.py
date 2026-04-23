import uuid
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.persistence.models import Order, OrderItem, OrderStatus


class OrderRepository:
    """Repository for Order model database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, user_id: uuid.UUID, total: float) -> Order:
        """Create a new order."""
        order = Order(user_id=user_id, total=Decimal(str(total)))
        self.db.add(order)
        await self.db.flush()
        return order

    async def get_by_id(self, order_id: uuid.UUID) -> Order | None:
        """Get order by ID with items loaded."""
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.product))
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> list[Order]:
        """Get all orders for a user with pagination."""
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.product))
            .where(Order.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(Order.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_stripe_session(self, stripe_session_id: str) -> Order | None:
        """Get order by Stripe session ID."""
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.product))
            .where(Order.stripe_session_id == stripe_session_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 20, status: str | None = None) -> list[Order]:
        """Get all orders with optional status filter and pagination."""
        query = select(Order).options(selectinload(
            Order.items).selectinload(OrderItem.product))
        if status:
            query = query.where(Order.status == status)
        query = query.offset(skip).limit(
            limit).order_by(Order.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update(self, order_id: uuid.UUID, **kwargs) -> Order | None:
        """Update order fields."""
        order = await self.get_by_id(order_id)
        if not order:
            return None
        for key, value in kwargs.items():
            if hasattr(order, key) and value is not None:
                setattr(order, key, value)
        await self.db.flush()
        return order

    async def delete(self, order_id: uuid.UUID) -> bool:
        """Delete order."""
        order = await self.get_by_id(order_id)
        if not order:
            return False
        await self.db.delete(order)
        await self.db.flush()
        return True

    async def get_revenue_by_date_range(self, start_date, end_date) -> float:
        """Get total revenue for paid orders within date range."""
        result = await self.db.execute(
            select(func.sum(Order.total)).where(
                and_(
                    Order.status == OrderStatus.PAID.value,
                    Order.created_at >= start_date,
                    Order.created_at <= end_date,
                )
            )
        )
        total = result.scalar()
        return float(total) if total else 0.0

    async def count_by_date_range(self, start_date, end_date, status: str | None = None) -> int:
        """Count orders within date range with optional status filter."""
        query = select(func.count(Order.id)).where(
            and_(
                Order.created_at >= start_date,
                Order.created_at <= end_date,
            )
        )
        if status:
            query = query.where(Order.status == status)
        result = await self.db.execute(query)
        return result.scalar() or 0

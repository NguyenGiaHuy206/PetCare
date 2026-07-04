import uuid
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.persistence.models import Order, OrderItem


class OrderRepository:
    """Repository for Order model database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, user_id: uuid.UUID, total: float, payment_method: str = "vnpay", payment_status: str = "pending") -> Order:
        """Create a new order."""
        order = Order(
            user_id=user_id,
            total=Decimal(str(total)),
            payment_method=payment_method,
            payment_status=payment_status,
        )
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
        await self.db.refresh(order, attribute_names=["status", "payment_status", "payment_method", "total", "updated_at"])
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
        """Get total revenue for paid or COD-pending orders within date range."""
        result = await self.db.execute(
            select(func.sum(Order.total)).where(
                and_(
                    Order.payment_status.in_(["paid", "cod_pending"]),
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

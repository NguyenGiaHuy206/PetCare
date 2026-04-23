from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import Booking, BookingStatus, Order, OrderStatus


class ReportService:
    """Service for generating admin reports."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_revenue_report(self, days: int = 7) -> dict:
        """Get revenue report for the last N days."""
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days)

        # Query total revenue
        result = await self.db.execute(
            select(func.sum(Order.total)).where(
                and_(
                    Order.status == OrderStatus.PAID.value,
                    Order.created_at >= start_date,
                    Order.created_at <= now,
                )
            )
        )
        total_revenue = float(result.scalar()) or 0.0

        # Count paid orders
        result = await self.db.execute(
            select(func.count(Order.id)).where(
                and_(
                    Order.status == OrderStatus.PAID.value,
                    Order.created_at >= start_date,
                    Order.created_at <= now,
                )
            )
        )
        total_orders = result.scalar() or 0

        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "period": f"Last {days} days",
        }

    async def get_booking_report(self, days: int = 7) -> dict:
        """Get booking report for the last N days."""
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days)

        # Total bookings
        result = await self.db.execute(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.created_at >= start_date,
                    Booking.created_at <= now,
                )
            )
        )
        total_bookings = result.scalar() or 0

        # Count by status
        statuses = {
            "pending": BookingStatus.PENDING.value,
            "confirmed": BookingStatus.CONFIRMED.value,
            "completed": BookingStatus.COMPLETED.value,
            "cancelled": BookingStatus.CANCELLED.value,
        }

        status_counts = {}
        for key, status_value in statuses.items():
            result = await self.db.execute(
                select(func.count(Booking.id)).where(
                    and_(
                        Booking.status == status_value,
                        Booking.created_at >= start_date,
                        Booking.created_at <= now,
                    )
                )
            )
            status_counts[key] = result.scalar() or 0

        return {
            "total_bookings": total_bookings,
            "pending": status_counts["pending"],
            "confirmed": status_counts["confirmed"],
            "completed": status_counts["completed"],
            "cancelled": status_counts["cancelled"],
        }

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, require_admin
from src.domain.report_service import ReportService
from src.persistence.models import User
from src.schemas import BookingReportResponse, RevenueReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/revenue", response_model=RevenueReportResponse)
async def get_revenue_report(
    days: int = Query(7, ge=1, le=90),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> RevenueReportResponse:
    """Get revenue report for the last N days (admin only)."""
    service = ReportService(db)
    report = await service.get_revenue_report(days)
    return RevenueReportResponse.model_validate(report)


@router.get("/bookings", response_model=BookingReportResponse)
async def get_booking_report(
    days: int = Query(7, ge=1, le=90),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> BookingReportResponse:
    """Get booking report for the last N days (admin only)."""
    service = ReportService(db)
    report = await service.get_booking_report(days)
    return BookingReportResponse.model_validate(report)

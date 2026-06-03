from pydantic import BaseModel


class RevenueReportResponse(BaseModel):
    total_revenue: float
    total_orders: int
    period: str


class BookingReportResponse(BaseModel):
    total_bookings: int
    pending: int
    confirmed: int
    completed: int
    cancelled: int

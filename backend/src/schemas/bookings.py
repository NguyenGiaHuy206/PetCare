import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


class BookingCreate(BaseModel):
    pet_id: uuid.UUID
    service: str
    booking_datetime: datetime
    duration_minutes: int
    notes: Optional[str] = None
    payment_method: Literal["vnpay", "cod"] = "vnpay"


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    pet_id: uuid.UUID
    pet_name: Optional[str] = None
    service: str
    booking_datetime: datetime
    duration_minutes: int
    status: str
    notes: Optional[str]
    order_id: Optional[uuid.UUID] = None
    checkout_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

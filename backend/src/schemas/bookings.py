import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class BookingCreate(BaseModel):
    pet_id: uuid.UUID
    service: str
    booking_datetime: datetime
    duration_minutes: int
    notes: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    pet_id: uuid.UUID
    service: str
    booking_datetime: datetime
    duration_minutes: int
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

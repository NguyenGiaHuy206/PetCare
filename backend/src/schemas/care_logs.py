import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CareLogCreate(BaseModel):
    user_id: uuid.UUID | None = None
    pet_id: uuid.UUID
    activity: str
    timestamp: datetime
    notes: Optional[str] = None
    image_url: Optional[str] = None


class CareLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    pet_id: uuid.UUID
    activity: str
    timestamp: datetime
    notes: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

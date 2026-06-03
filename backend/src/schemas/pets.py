import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PetCreate(BaseModel):
    name: str
    species: str
    breed: str
    age: Optional[str] = None
    weight: Optional[float] = None
    color: Optional[str] = None
    gender: Optional[str] = None
    microchip_id: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[str] = None
    weight: Optional[float] = None
    color: Optional[str] = None
    gender: Optional[str] = None
    microchip_id: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class PetResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    species: str
    breed: str
    age: Optional[str]
    weight: Optional[float]
    color: Optional[str]
    gender: Optional[str]
    microchip_id: Optional[str]
    notes: Optional[str]
    photo_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ===== Auth Schemas =====
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserRegister(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# UserResponse is missing phone and address!
class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    created_at: datetime
    updated_at: datetime
    phone: Optional[str] = None      # ✅ exists
    address: Optional[str] = None    # ✅ exists

# UserUpdate has them correctly


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None      # ✅ exists
    address: Optional[str] = None    # ✅ exists


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


# ===== Pet Schemas =====
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


# ===== Booking Schemas =====
class BookingCreate(BaseModel):
    pet_id: uuid.UUID
    service: str  # "grooming", "boarding", "bathing"
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


# ===== Care Log Schemas =====
class CareLogCreate(BaseModel):
    pet_id: uuid.UUID
    activity: str  # "feeding", "grooming", "walking"
    timestamp: datetime
    notes: Optional[str] = None
    image_url: Optional[str] = None


class CareLogResponse(CareLogCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===== Storage Schemas =====
class PresignedUrlResponse(BaseModel):
    upload_url: str
    file_url: str


class ConfirmUploadRequest(BaseModel):
    file_url: str


# ===== Product Schemas =====
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    price: float
    stock: int
    image_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===== Order Item Schemas =====
class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    price_at_purchase: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===== Order Schemas =====
class OrderCreate(BaseModel):
    items: list[OrderItemCreate]


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    total: float
    status: str
    stripe_session_id: Optional[str]
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckoutResponse(BaseModel):
    order_id: uuid.UUID
    checkout_url: str


# ===== Report Schemas =====
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

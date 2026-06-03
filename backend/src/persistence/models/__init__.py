"""Import all models to register them with Base.metadata."""
from src.persistence.models.bookings import Booking, BookingStatus
from src.persistence.models.carts import Cart, CartItem
from src.persistence.models.care_logs import CareLog
from src.persistence.models.categories import Category, CategoryScope
from src.persistence.models.orders import Order, OrderItem, OrderStatus
from src.persistence.models.notifications import Notification
from src.persistence.models.pets import Pet
from src.persistence.models.products import Product, ProductKind
from src.persistence.models.users import User, UserRole

__all__ = [
    "User",
    "UserRole",
    "Pet",
    "Booking",
    "BookingStatus",
    "CareLog",
    "Category",
    "CategoryScope",
    "Product",
    "ProductKind",
    "Order",
    "OrderItem",
    "OrderStatus",
    "Notification",
    "Cart",
    "CartItem",
]

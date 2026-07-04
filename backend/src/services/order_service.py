import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.settings import settings
from src.persistence.models import Order, OrderItem, OrderStatus
from src.persistence.repositories.order_repo import OrderRepository
from src.persistence.repositories.product_repo import ProductRepository
from src.services.notification_service import NotificationService


class OrderService:
    """Service for order management operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = OrderRepository(db)
        self.product_repo = ProductRepository(db)

    async def create(
        self,
        user_id: uuid.UUID,
        items: list,
        vat_amount: float = 0,
        shipping_fee: float = 0,
        payment_method: str = "vnpay",
    ) -> Order:
        """Create a new order with items and stock validation."""
        if not items:
            raise ValueError("Order must have at least one item")
        if payment_method not in {"vnpay", "cod"}:
            raise ValueError("Invalid payment method")

        total = 0.0
        order_items = []
        payment_status = "cod_pending" if payment_method == "cod" else "pending"

        # Validate all items first
        for item in items:
            # Handle both dict and Pydantic model
            product_id = item.product_id if hasattr(
                item, 'product_id') else item["product_id"]
            quantity = item.quantity if hasattr(
                item, 'quantity') else item["quantity"]

            if quantity <= 0:
                raise ValueError("Quantity must be positive")

            product = await self.product_repo.get_by_id(product_id)
            if not product:
                raise ValueError(f"Product {product_id} not found")

            if product.stock < quantity:
                raise ValueError(f"Insufficient stock for {product.name}")

            # Calculate item total
            item_total = float(product.price) * quantity
            total += item_total
            order_items.append((product, quantity, float(product.price)))

            # Update stock
            await self.product_repo.update(product_id, stock=product.stock - quantity)

        total += max(vat_amount, 0) + max(shipping_fee, 0)

        # Create order
        order = await self.repo.create(user_id, total, payment_method=payment_method, payment_status=payment_status)
        await NotificationService(self.db).create_for_admins(
            "order",
            "New checkout",
            f"Order #{str(order.id)[:8].upper()} was created with {payment_method.upper()} payment.",
        )

        # Create order items
        for product, quantity, price_at_purchase in order_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                price_at_purchase=price_at_purchase,
            )
            self.db.add(order_item)

        await self.db.flush()
        await self.db.commit()
        return order

    def checkout_url_for(self, order: Order, source: str = "cart") -> str:
        """Return local checkout completion URL for non-redirect payment methods."""
        return f"{settings.frontend_url}/payment/success?provider={order.payment_method}&order_id={order.id}&source={source}"

    async def get(self, order_id: uuid.UUID) -> Order:
        """Get an order by ID."""
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        return order

    async def get_user_orders(self, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> list[Order]:
        """Get all orders for a user."""
        return await self.repo.get_by_user(user_id, skip, limit)

    async def get_all_orders(
        self, skip: int = 0, limit: int = 20, status: str | None = None
    ) -> list[Order]:
        """Get all orders (admin endpoint)."""
        return await self.repo.get_all(skip, limit, status)

    async def mark_paid_by_id(self, order_id: uuid.UUID) -> Order:
        """Mark an order as paid by order ID."""
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        await self.repo.update(order.id, payment_status="paid")
        await NotificationService(self.db).create(
            order.user_id,
            "order",
            "Order confirmed",
            f"Your order #{str(order.id)[:8].upper()} has been paid and confirmed.",
        )
        await self.db.commit()
        return order

    def payment_source_for(self, order: Order) -> str:
        """Infer the payment return source from the order items."""
        if order.items and all(item.product_kind == "service" for item in order.items):
            return "booking"
        return "cart"

    async def get_repayable_order(self, order_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False) -> Order:
        """Return an order that can still be paid through VNPAY."""
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        if not is_admin and order.user_id != user_id:
            raise PermissionError("Not your order")
        if order.payment_method != "vnpay":
            raise ValueError("Only VNPAY orders can be paid online")
        if order.payment_status == "paid":
            raise ValueError("Order is already paid")
        current_status = order.status.value if isinstance(order.status, OrderStatus) else order.status
        if current_status == OrderStatus.CANCELLED.value:
            raise ValueError("Cancelled orders cannot be paid")
        return order

    async def update_status(self, order_id: uuid.UUID, new_status: str) -> Order:
        """Update an order fulfillment/service status."""
        try:
            status_value = OrderStatus(new_status)
        except ValueError as exc:
            raise ValueError("Invalid order status") from exc
        if status_value == OrderStatus.PAID:
            raise ValueError("Paid is a payment status, not an order stage")

        order = await self.repo.update(order_id, status=status_value)
        if not order:
            raise ValueError("Order not found")
        await self.db.commit()
        return order

    async def cancel_order(self, order_id: uuid.UUID) -> Order:
        """Cancel an order and restore stock."""
        order = await self.repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        if order.status != OrderStatus.PENDING.value:
            raise ValueError("Can only cancel pending orders")

        # Restore stock for all items
        for item in order.items:
            current_product = await self.product_repo.get_by_id(item.product_id)
            if current_product:
                await self.product_repo.update(
                    item.product_id, stock=current_product.stock + item.quantity
                )

        # Cancel order
        await self.repo.update(order_id, status=OrderStatus.CANCELLED.value)
        await self.db.commit()
        return order

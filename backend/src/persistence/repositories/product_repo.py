import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import Product


class ProductRepository:
    """Repository for Product model database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self, name: str, price: float, stock: int, description: str | None = None, image_url: str | None = None
    ) -> Product:
        """Create a new product."""
        product = Product(
            name=name,
            description=description,
            price=price,
            stock=stock,
            image_url=image_url,
        )
        self.db.add(product)
        await self.db.flush()
        return product

    async def get_by_id(self, product_id: uuid.UUID) -> Product | None:
        """Get product by ID."""
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()

    async def get_all(
        self, skip: int = 0, limit: int = 20, search: str | None = None
    ) -> list[Product]:
        """Get all products with optional search and pagination."""
        query = select(Product)
        if search:
            query = query.where(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.description.ilike(f"%{search}%"),
                )
            )
        query = query.offset(skip).limit(
            limit).order_by(Product.created_at.desc())
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update(self, product_id: uuid.UUID, **kwargs) -> Product | None:
        """Update product fields."""
        product = await self.get_by_id(product_id)
        if not product:
            return None
        for key, value in kwargs.items():
            if hasattr(product, key) and value is not None:
                setattr(product, key, value)
        await self.db.flush()
        return product

    async def delete(self, product_id: uuid.UUID) -> bool:
        """Delete product."""
        product = await self.get_by_id(product_id)
        if not product:
            return False
        await self.db.delete(product)
        await self.db.flush()
        return True

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import Category, CategoryScope


class CategoryRepository:
    """Repository for Category model database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_all(self, scope: CategoryScope | None = None) -> list[Category]:
        query = select(Category)
        if scope:
            query = query.where(Category.scope == scope)
        result = await self.db.execute(query.order_by(Category.name.asc()))
        return result.scalars().all()

    async def get_by_id(self, category_id: uuid.UUID | str) -> Category | None:
        result = await self.db.execute(select(Category).where(Category.id == uuid.UUID(str(category_id))))
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str, scope: CategoryScope) -> Category | None:
        normalized_name = name.strip().lower()
        result = await self.db.execute(
            select(Category).where(
                func.lower(Category.name) == normalized_name,
                Category.scope == scope,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, name: str, scope: CategoryScope) -> Category:
        normalized_name = name.strip()
        if not normalized_name:
            raise ValueError("Category name is required")
        existing = await self.get_by_name(normalized_name, scope)
        if existing:
            raise ValueError("Category already exists")

        category = Category(name=normalized_name, scope=scope)
        self.db.add(category)
        await self.db.flush()
        return category

    async def update(self, category_id: uuid.UUID | str, name: str) -> Category | None:
        category = await self.get_by_id(category_id)
        if not category:
            return None

        normalized_name = name.strip()
        if not normalized_name:
            raise ValueError("Category name is required")

        existing = await self.get_by_name(normalized_name, category.scope)
        if existing and existing.id != category.id:
            raise ValueError("Category already exists")

        category.name = normalized_name
        await self.db.flush()
        return category

    async def delete(self, category_id: uuid.UUID | str) -> bool:
        category = await self.get_by_id(category_id)
        if not category:
            return False
        await self.db.delete(category)
        await self.db.flush()
        return True
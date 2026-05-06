import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.persistence.models import User


class UserRepository:
    """Repository for User model database operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, email: str, password_hash: str, full_name: str, role: str = "user") -> User:
        """Create a new user."""
        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role=role,
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def get_by_id(self, user_id: str) -> User | None:
        """Get user by ID."""
        result = await self.db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[User]:
        """Get all users with pagination."""
        result = await self.db.execute(
            select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def update(self, user_id: uuid.UUID, **kwargs) -> User | None:
        """Update user fields."""
        user = await self.get_by_id(str(user_id))
        if not user:
            return None
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        await self.db.flush()
        return user

    async def delete(self, user_id: uuid.UUID) -> bool:
        """Delete user."""
        user = await self.get_by_id(str(user_id))
        if not user:
            return False
        await self.db.delete(user)
        await self.db.flush()
        return True

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from src.settings import settings
from src.persistence.database import get_db
from src.persistence.models import User
from src.persistence.repositories.user_repo import UserRepository


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
) -> User:
    """Extract and validate JWT token from Authorization header, return current user."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
            )
        token_string = authorization.split(" ", 1)[1]
        payload = jwt.decode(
            token_string, settings.jwt_secret, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin role."""
    role_value = current_user.role.value if hasattr(
        current_user.role, 'value') else str(current_user.role)
    if role_value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

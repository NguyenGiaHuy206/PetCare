from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, require_admin
from src.config import settings
from src.persistence.models import User, UserRole
from src.persistence.repositories.user_repo import UserRepository
from src.schemas import UserResponse, UserRoleUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[UserResponse]:
    result = await db.execute(select(User).order_by(User.created_at.asc()))
    users = result.scalars().all()
    return [UserResponse.model_validate(user) for user in users]


@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    request: UserRoleUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if request.role not in {UserRole.ADMIN.value, UserRole.USER.value}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    if request.role == UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Promoting users is disabled")

    super_admin_email = settings.super_admin_email.lower()
    is_super_admin = admin.email.lower() == super_admin_email

    if request.role == UserRole.USER.value:
        if not is_super_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required to demote")
        if admin.id == user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot demote yourself")

    if user.email.lower() == super_admin_email and request.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot demote super admin")

    updated = await repo.update(user.id, role=request.role)
    await db.commit()
    await db.refresh(updated)
    return UserResponse.model_validate(updated)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    super_admin_email = settings.super_admin_email.lower()
    if user.email.lower() == super_admin_email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete super admin")
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete yourself")

    await repo.delete(user.id)
    return {"message": "User deleted"}

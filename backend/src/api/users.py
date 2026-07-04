from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db, require_admin
from src.persistence.models import User
from src.persistence.repositories.user_repo import UserRepository
from src.schemas import ChangePasswordRequest, DeleteAccountRequest, UserResponse, UserUpdate
from src.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.get("/admin", response_model=list[UserResponse])
@router.get("/admin/users", response_model=list[UserResponse])
async def get_users_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[UserResponse]:
    """Get all users for admin views."""
    repo = UserRepository(db)
    users = await repo.get_all(skip, limit)
    return [UserResponse.model_validate(user) for user in users]


@router.put("/me", response_model=UserResponse)
async def update_me(
    request: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    repo = UserRepository(db)
    data = request.model_dump(exclude_unset=True)
    updated = await repo.update(current_user.id, **data)
    return UserResponse.model_validate(updated)


@router.post("/me/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Change user password"""
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    
    auth_service = AuthService(db)
    repo = UserRepository(db)
    
    # Verify current password
    if not auth_service.verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    
    # Update password
    password_hash = auth_service.hash_password(request.new_password)
    await repo.update(current_user.id, password_hash=password_hash)
    
    return {"message": "Password changed successfully"}


@router.delete("/me")
async def delete_account(
    request: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete user account"""
    auth_service = AuthService(db)
    if not auth_service.verify_password(request.password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password is incorrect")
    repo = UserRepository(db)
    await repo.delete(current_user.id)
    return {"message": "Account deleted successfully"}

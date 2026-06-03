from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.api.deps import get_db
from src.services.auth_service import AuthService
from src.persistence.repositories.user_repo import UserRepository
from src.schemas import (
    ForgotPasswordRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenRefresh,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    VerifyEmailRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(request: UserRegister, db: AsyncSession = Depends(get_db)) -> UserResponse:
    """Register a new user."""
    service = AuthService(db)
    try:
        user = await service.register(
            request.email,
            request.password,
            request.full_name,
            request.phone,
            request.address,
        )
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(request: UserLogin, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Login user and return tokens."""
    service = AuthService(db)
    try:
        user = await service.login(request.email, request.password)
        access_token = service.create_access_token(user.id)
        refresh_token = service.create_refresh_token(user.id)
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/verify-email", response_model=UserResponse)
async def verify_email(request: VerifyEmailRequest, db: AsyncSession = Depends(get_db)) -> UserResponse:
    service = AuthService(db)
    try:
        user = await service.verify_email(request.email, request.code)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/resend-verification")
async def resend_verification(request: ResendVerificationRequest, db: AsyncSession = Depends(get_db)) -> dict:
    service = AuthService(db)
    await service.resend_verification(request.email)
    return {"message": "If the account exists, a verification code has been sent."}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: TokenRefresh, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Refresh access token using refresh token."""
    service = AuthService(db)
    try:
        user_id = service.verify_refresh_token(request.refresh_token)
        access_token = service.create_access_token(user_id)
        refresh_token = service.create_refresh_token(user_id)
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Generate a password reset link for a user."""
    service = AuthService(db)
    repo = UserRepository(db)
    user = await repo.get_by_email(request.email)

    if not user:
        return {"message": "If the email exists, a reset link has been generated."}

    reset_token = service.create_reset_token(user.id)
    reset_url = f"{settings.frontend_url}/reset-password/{reset_token}"
    return {
        "message": "Password reset link generated.",
        "reset_token": reset_token,
        "reset_url": reset_url,
    }


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Reset a user's password using a signed reset token."""
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    service = AuthService(db)
    repo = UserRepository(db)

    try:
        user_id = service.verify_reset_token(request.token)
        user = await repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        password_hash = service.hash_password(request.new_password)
        await repo.update(user.id, password_hash=password_hash)
        await db.commit()
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db
from src.domain.auth_service import AuthService
from src.schemas import TokenRefresh, TokenResponse, UserLogin, UserRegister, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(request: UserRegister, db: AsyncSession = Depends(get_db)) -> UserResponse:
    """Register a new user."""
    service = AuthService(db)
    try:
        user = await service.register(request.email, request.password, request.full_name)
        await db.refresh(user)  # ← add this line
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

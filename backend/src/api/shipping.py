from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db
from src.persistence.models import User
from src.schemas import ShippingQuoteRequest, ShippingQuoteResponse
from src.services.shipping_service import ShippingService

router = APIRouter(prefix="/shipping", tags=["shipping"])


@router.get("/provinces")
async def list_provinces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    service = ShippingService(db)
    try:
        return await service.get_provinces()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/districts")
async def list_districts(
    province_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    service = ShippingService(db)
    try:
        return await service.get_districts(province_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/wards")
async def list_wards(
    district_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    service = ShippingService(db)
    try:
        return await service.get_wards(district_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/quote", response_model=ShippingQuoteResponse)
async def quote_shipping(
    request: ShippingQuoteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ShippingQuoteResponse:
    service = ShippingService(db)
    try:
        quote = await service.quote_cart(current_user.id, request.to_district_id, request.to_ward_code)
        return ShippingQuoteResponse(**quote)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

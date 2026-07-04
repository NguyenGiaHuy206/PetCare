from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from src.settings import settings
from src.persistence.database import get_db
from src.services.order_service import OrderService
from src.services.vnpay_service import VnpayService

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/vnpay/return")
async def handle_vnpay_return(request: Request, db: AsyncSession = Depends(get_db)):
    params = dict(request.query_params)
    source = params.get("source", "cart")
    service = VnpayService()
    if not service.verify_return(params):
        return RedirectResponse(f"{settings.frontend_url}/payment/failed?provider=vnpay&source={source}")

    response_code = params.get("vnp_ResponseCode")
    transaction_status = params.get("vnp_TransactionStatus")
    if response_code == "00" and transaction_status == "00":
        try:
            order_id = service.get_order_id(params)
            await OrderService(db).mark_paid_by_id(order_id)
            return RedirectResponse(f"{settings.frontend_url}/payment/success?provider=vnpay&order_id={order_id}&source={source}")
        except ValueError:
            return RedirectResponse(f"{settings.frontend_url}/payment/failed?provider=vnpay")

    order_id = params.get("vnp_TxnRef")
    failed_url = f"{settings.frontend_url}/payment/failed?provider=vnpay"
    if order_id:
        failed_url += f"&order_id={order_id}"
    failed_url += f"&source={source}"
    return RedirectResponse(failed_url)



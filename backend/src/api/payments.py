import json
import logging
import stripe
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from src.config import settings
from src.persistence.database import get_db
from src.domain.order_service import OrderService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook")
async def handle_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events."""
    body = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(
            body, sig_header, settings.stripe_webhook_secret)
    except ValueError:
        logger.error("Invalid Stripe webhook payload")
        return Response(content=json.dumps({"error": "Invalid payload"}), status_code=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid Stripe webhook signature")
        return Response(content=json.dumps({"error": "Invalid signature"}), status_code=status.HTTP_400_BAD_REQUEST)

    event_type = event.get("type")
    logger.info(f"Stripe webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session["id"]
        logger.info(f"Payment completed for session: {session_id}")
        try:
            service = OrderService(db)
            order = await service.mark_paid(session_id)
            await db.commit()
            logger.info(f"Order {order.id} marked as paid")
        except Exception as e:
            logger.error(f"Failed to mark order as paid: {e}")
            return Response(content=json.dumps({"error": "Failed to process payment"}), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(content=json.dumps({"success": True}), status_code=status.HTTP_200_OK)

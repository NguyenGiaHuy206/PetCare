import hashlib
import hmac
import uuid
from datetime import datetime
from urllib.parse import quote_plus, urlencode

from src.settings import settings
from src.persistence.models import Order


class VnpayService:
    """VNPAY payment URL and return-signature helpers."""

    def _signed_query(self, params: dict[str, str]) -> str:
        sorted_params = dict(sorted(params.items()))
        hash_data = urlencode(sorted_params, quote_via=quote_plus)
        secure_hash = hmac.new(
            settings.vnpay_hash_secret.encode("utf-8"),
            hash_data.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest()
        return f"{hash_data}&vnp_SecureHash={secure_hash}"

    def create_payment_url(self, order: Order, ip_address: str, source: str = "cart") -> str:
        if not settings.vnpay_tmn_code or not settings.vnpay_hash_secret:
            return f"{settings.frontend_url}/payment/pending?provider=vnpay&order_id={order.id}&source={source}"

        return_url = settings.vnpay_return_url or "http://localhost:8000/payments/vnpay/return"
        separator = "&" if "?" in return_url else "?"
        return_url = f"{return_url}{separator}source={quote_plus(source)}"
        params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": settings.vnpay_tmn_code,
            "vnp_Amount": str(int(float(order.total) * 100)),
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": str(order.id),
            "vnp_OrderInfo": f"Pay order {str(order.id)}",
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": return_url,
            "vnp_IpAddr": ip_address or "127.0.0.1",
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        }
        return f"{settings.vnpay_payment_url}?{self._signed_query(params)}"

    def verify_return(self, params: dict[str, str]) -> bool:
        if not settings.vnpay_hash_secret:
            return False
        secure_hash = params.get("vnp_SecureHash", "")
        signed_params = {
            key: value
            for key, value in params.items()
            if key.startswith("vnp_") and key not in {"vnp_SecureHash", "vnp_SecureHashType"} and value is not None
        }
        expected_query = self._signed_query(signed_params)
        expected_hash = expected_query.rsplit("vnp_SecureHash=", 1)[1]
        return hmac.compare_digest(secure_hash.lower(), expected_hash.lower())

    def get_order_id(self, params: dict[str, str]) -> uuid.UUID:
        return uuid.UUID(params["vnp_TxnRef"])

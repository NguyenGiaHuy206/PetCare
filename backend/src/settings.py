import os
from pathlib import Path

from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_FILE)


class Settings:
    """Simple environment-based settings loader backed by .env only."""

    def __init__(self) -> None:
        self.database_url = self._get("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
        self.jwt_secret = self._get("JWT_SECRET", "dev-secret")
        self.jwt_access_expire_minutes = self._get_int("JWT_ACCESS_EXPIRE_MINUTES", 15)
        self.jwt_refresh_expire_days = self._get_int("JWT_REFRESH_EXPIRE_DAYS", 7)

        self.s3_bucket = self._get("S3_BUCKET", "")
        self.s3_region = self._get("S3_REGION", "ap-southeast-1")
        self.s3_public_base_url = self._get("S3_PUBLIC_BASE_URL", "")
        self.aws_access_key_id = self._get("AWS_ACCESS_KEY_ID", "")
        self.aws_secret_access_key = self._get("AWS_SECRET_ACCESS_KEY", "")

        self.frontend_url = self._get("FRONTEND_URL", "http://localhost:5173")

        self.ghn_api_url = self._get("GHN_API_URL", "https://dev-online-gateway.ghn.vn/shiip/public-api")
        self.ghn_province_url = self._get("GHN_PROVINCE_URL", "")
        self.ghn_district_url = self._get("GHN_DISTRICT_URL", "")
        self.ghn_ward_url = self._get("GHN_WARD_URL", "")
        self.ghn_fee_url = self._get("GHN_FEE_URL", "")
        self.ghn_token = self._get("GHN_TOKEN", "")
        self.ghn_shop_id = self._get("GHN_SHOP_ID", "")
        self.ghn_from_district_id = self._get_int("GHN_FROM_DISTRICT_ID", 0)
        self.ghn_service_id = self._get_int("GHN_SERVICE_ID", 0)

        self.vnpay_tmn_code = self._get("VNPAY_TMN_CODE", "")
        self.vnpay_hash_secret = self._get("VNPAY_HASH_SECRET", "")
        self.vnpay_payment_url = self._get("VNPAY_PAYMENT_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html")
        self.vnpay_return_url = self._get("VNPAY_RETURN_URL", "")

    def _get(self, key: str, default: str) -> str:
        value = os.getenv(key)
        return value if value is not None else default

    def _get_int(self, key: str, default: int) -> int:
        value = os.getenv(key)
        if value is None:
            return default
        try:
            return int(value)
        except ValueError:
            return default


settings = Settings()

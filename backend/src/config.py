import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    database_url: str
    jwt_secret: str
    jwt_access_expire_minutes: int = 15
    jwt_refresh_expire_days: int = 7
    s3_bucket: str
    s3_region: str = "ap-southeast-1"
    s3_public_base_url: str = ""
    aws_access_key_id: str
    aws_secret_access_key: str
    frontend_url: str = "http://localhost:5173"
    super_admin_email: str = "admin@petcare.com"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_use_tls: bool = True
    ghn_api_url: str = "https://dev-online-gateway.ghn.vn/shiip/public-api"
    ghn_province_url: str = ""
    ghn_district_url: str = ""
    ghn_ward_url: str = ""
    ghn_fee_url: str = ""
    ghn_token: str = ""
    ghn_shop_id: str = ""
    ghn_from_district_id: int = 0
    ghn_service_id: int = 0
    vnpay_tmn_code: str = ""
    vnpay_hash_secret: str = ""
    vnpay_payment_url: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    vnpay_return_url: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()

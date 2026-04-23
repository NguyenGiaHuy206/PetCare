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
    aws_access_key_id: str
    aws_secret_access_key: str
    stripe_secret_key: str
    stripe_webhook_secret: str
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

import uuid
from datetime import datetime, timedelta, timezone
import secrets

import bcrypt
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.persistence.models import User
from src.persistence.repositories.user_repo import UserRepository
from src.services.email_service import EmailService


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def verify_password(self, plain: str, hashed: str) -> bool:
        """Verify a plain password against a hash."""
        try:
            return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        except ValueError:
            return False

    async def register(
        self,
        email: str,
        password: str,
        full_name: str,
        phone: str | None = None,
        address: str | None = None,
    ) -> User:
        """Register a new user."""
        existing = await self.repo.get_by_email(email)
        if existing:
            raise ValueError("Email already registered")

        verification_code = self.create_verification_code()
        password_hash = self.hash_password(password)
        user = await self.repo.create(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            phone=phone,
            address=address,
            is_email_verified=False,
            email_verification_code_hash=self.hash_password(verification_code),
            email_verification_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        )
        await self.db.commit()
        await self.db.refresh(user)
        await EmailService().send_verification_code(email, verification_code)
        return user

    async def login(self, email: str, password: str) -> User:
        """Authenticate a user."""
        user = await self.repo.get_by_email(email)
        if not user or not self.verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")
        if not user.is_email_verified:
            raise ValueError("Please verify your email before logging in")
        return user

    def create_verification_code(self) -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    async def verify_email(self, email: str, code: str) -> User:
        user = await self.repo.get_by_email(email)
        if not user:
            raise ValueError("User not found")
        if user.is_email_verified:
            return user
        if not user.email_verification_code_hash or not user.email_verification_expires_at:
            raise ValueError("Verification code not found")
        expires_at = user.email_verification_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise ValueError("Verification code expired")
        if not self.verify_password(code, user.email_verification_code_hash):
            raise ValueError("Invalid verification code")
        updated = await self.repo.update(
            user.id,
            is_email_verified=True,
            email_verification_code_hash=None,
            email_verification_expires_at=None,
        )
        return updated

    async def resend_verification(self, email: str) -> None:
        user = await self.repo.get_by_email(email)
        if not user or user.is_email_verified:
            return
        code = self.create_verification_code()
        await self.repo.update(
            user.id,
            email_verification_code_hash=self.hash_password(code),
            email_verification_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        )
        await EmailService().send_verification_code(email, code)

    def create_access_token(self, user_id: uuid.UUID) -> str:
        """Create a JWT access token."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=settings.jwt_access_expire_minutes)
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "iat": now,
            "type": "access",
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

    def create_refresh_token(self, user_id: uuid.UUID) -> str:
        """Create a JWT refresh token."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(days=settings.jwt_refresh_expire_days)
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "iat": now,
            "type": "refresh",
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

    def create_reset_token(self, user_id: uuid.UUID) -> str:
        """Create a JWT password reset token."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(hours=1)
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "iat": now,
            "type": "reset",
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

    def verify_reset_token(self, token: str) -> str:
        """Verify a password reset token and return the user ID."""
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
            if payload.get("type") != "reset":
                raise ValueError("Invalid token type")
            return uuid.UUID(payload.get("sub"))
        except Exception as e:
            raise ValueError(f"Invalid reset token: {e}")

    def verify_refresh_token(self, token: str) -> str:
        """Verify a refresh token and return the user ID."""
        try:
            payload = jwt.decode(
                token, settings.jwt_secret, algorithms=["HS256"])
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")
            return payload.get("sub")
        except Exception as e:
            raise ValueError(f"Invalid refresh token: {e}")

    def decode_token(self, token: str) -> dict:
        """Decode a JWT token."""
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])

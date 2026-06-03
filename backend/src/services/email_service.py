import logging
import smtplib
from email.message import EmailMessage

from src.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """SMTP email sender used for account verification and notifications."""

    async def send(self, to_email: str, subject: str, body: str) -> None:
        if not settings.smtp_host or not settings.smtp_from_email:
            logger.info("Email delivery skipped; SMTP is not configured. To=%s Subject=%s Body=%s", to_email, subject, body)
            return

        message = EmailMessage()
        message["From"] = settings.smtp_from_email
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
                if settings.smtp_use_tls:
                    smtp.starttls()
                if settings.smtp_username:
                    smtp.login(settings.smtp_username, settings.smtp_password)
                smtp.send_message(message)
        except OSError:
            logger.exception("Email delivery failed; continuing without blocking the request. To=%s Subject=%s", to_email, subject)

    async def send_verification_code(self, to_email: str, code: str) -> None:
        await self.send(
            to_email,
            "Verify your petty account",
            f"Your petty verification code is {code}. It expires in 15 minutes.",
        )

    async def send_notification(self, to_email: str, title: str, message: str) -> None:
        await self.send(to_email, title, message)

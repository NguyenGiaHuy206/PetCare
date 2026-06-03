import uuid
import mimetypes
from pathlib import Path
from urllib.parse import urlparse

import boto3
from botocore.config import Config

from src.config import settings


class StorageService:
    """Service for S3 storage operations."""

    allowed_image_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}

    def __init__(self) -> None:
        self.s3_client = boto3.client(
            "s3",
            region_name=settings.s3_region,
            endpoint_url=f"https://s3.{settings.s3_region}.amazonaws.com",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
        )
        self.bucket = settings.s3_bucket

    def _public_url(self, key: str) -> str:
        if settings.s3_public_base_url:
            return f"{settings.s3_public_base_url.rstrip('/')}/{key}"
        return f"https://{self.bucket}.s3.{settings.s3_region}.amazonaws.com/{key}"

    def _key_from_file_url(self, file_url: str) -> str:
        parsed = urlparse(file_url)
        if settings.s3_public_base_url and file_url.startswith(settings.s3_public_base_url.rstrip("/") + "/"):
            return file_url.split(settings.s3_public_base_url.rstrip("/") + "/", 1)[1]

        expected_host = f"{self.bucket}.s3.{settings.s3_region}.amazonaws.com"
        if parsed.netloc != expected_host:
            raise ValueError("Invalid file URL")
        return parsed.path.lstrip("/")

    async def generate_presigned_url(self, filename: str, content_type: str | None = None) -> dict:
        """Generate a presigned URL for uploading a file to S3."""
        content_type = content_type or mimetypes.guess_type(filename)[0] or ""
        if content_type not in self.allowed_image_types:
            raise ValueError("Only JPEG, PNG, WEBP, and GIF images are supported")

        safe_name = Path(filename).name.replace("\\", "").replace("/", "")
        if not safe_name:
            raise ValueError("Filename is required")

        key = f"uploads/{uuid.uuid4()}/{safe_name}"

        try:
            upload_url = self.s3_client.generate_presigned_url(
                "put_object",
                Params={"Bucket": self.bucket, "Key": key, "ContentType": content_type},
                ExpiresIn=300,
            )
            return {"upload_url": upload_url, "file_url": self._public_url(key), "content_type": content_type}
        except Exception as e:
            raise ValueError(f"Failed to generate presigned URL: {e}")

    async def confirm_upload(self, file_url: str) -> str:
        """Confirm that a file has been uploaded to S3."""
        key = self._key_from_file_url(file_url)
        try:
            self.s3_client.head_object(Bucket=self.bucket, Key=key)
            return file_url
        except Exception as e:
            raise ValueError(f"Uploaded file was not found in S3: {e}")

    async def get_file(self, file_url: str) -> dict:
        """Get an uploaded file from S3 for application display."""
        key = self._key_from_file_url(file_url)
        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
            return {
                "body": response["Body"],
                "content_type": response.get("ContentType") or "application/octet-stream",
                "content_length": response.get("ContentLength"),
                "etag": response.get("ETag"),
            }
        except Exception as e:
            raise ValueError(f"Uploaded file was not found in S3: {e}")

    async def delete_file(self, file_url: str) -> bool:
        """Delete a file from S3."""
        try:
            key = self._key_from_file_url(file_url)
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception as e:
            raise ValueError(f"Failed to delete file: {e}")

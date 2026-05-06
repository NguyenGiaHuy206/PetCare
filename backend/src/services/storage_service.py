import uuid

import boto3

from src.config import settings


class StorageService:
    """Service for S3 storage operations."""

    def __init__(self) -> None:
        self.s3_client = boto3.client(
            "s3",
            region_name=settings.s3_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )
        self.bucket = settings.s3_bucket

    async def generate_presigned_url(self, filename: str) -> dict:
        """Generate a presigned URL for uploading a file to S3."""
        # Generate unique key with UUID prefix
        key = f"uploads/{uuid.uuid4()}/{filename}"

        try:
            # Generate presigned upload URL (PUT request)
            upload_url = self.s3_client.generate_presigned_url(
                "put_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=300,  # 5 minutes
            )

            # Generate public file URL
            file_url = f"https://{self.bucket}.s3.{settings.s3_region}.amazonaws.com/{key}"

            return {"upload_url": upload_url, "file_url": file_url}
        except Exception as e:
            raise ValueError(f"Failed to generate presigned URL: {e}")

    async def confirm_upload(self, file_url: str) -> str:
        """Confirm that a file has been uploaded (no-op for now, just validate URL format)."""
        if not file_url.startswith(f"https://{self.bucket}.s3"):
            raise ValueError("Invalid file URL")
        return file_url

    async def delete_file(self, file_url: str) -> bool:
        """Delete a file from S3."""
        try:
            # Extract key from URL
            # URL format: https://bucket.s3.region.amazonaws.com/key
            key = file_url.split(
                f"{self.bucket}.s3.{settings.s3_region}.amazonaws.com/")[1]
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception as e:
            raise ValueError(f"Failed to delete file: {e}")

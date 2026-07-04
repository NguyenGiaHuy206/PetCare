import logging

logger = logging.getLogger(__name__)


async def process_uploaded_image(s3_key: str) -> None:
    """Process uploaded image - resize and generate thumbnail."""
    try:
        # TODO: Implement actual image processing
        # 1. Download from S3
        # 2. Resize to max 1200px
        # 3. Generate 200px thumbnail
        # 4. Upload both back to S3
        logger.info(f"Image processed for {s3_key}")
    except Exception as e:
        logger.error(f"Failed to process image {s3_key}: {e}")

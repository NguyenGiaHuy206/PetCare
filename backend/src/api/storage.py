from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from src.api.deps import get_current_user
from src.services.storage_service import StorageService
from src.persistence.models import User
from src.schemas import ConfirmUploadRequest, PresignedUrlResponse

router = APIRouter(prefix="/storage", tags=["storage"])


@router.post("/presign", response_model=PresignedUrlResponse)
async def presign_upload(
    filename: str,
    content_type: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
) -> PresignedUrlResponse:
    """Generate presigned URL for S3 upload."""
    service = StorageService()
    try:
        result = await service.generate_presigned_url(filename, content_type)
        return PresignedUrlResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/confirm")
async def confirm_upload(
    request: ConfirmUploadRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Confirm file upload to S3."""
    service = StorageService()
    try:
        file_url = await service.confirm_upload(request.file_url)
        return {"file_url": file_url, "message": "Upload confirmed"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/image")
async def get_uploaded_image(file_url: str = Query(...)) -> StreamingResponse:
    """Stream an uploaded S3 image through the API for private buckets."""
    service = StorageService()
    try:
        file_data = await service.get_file(file_url)
        headers = {"Cache-Control": "public, max-age=86400"}
        if file_data.get("content_length") is not None:
            headers["Content-Length"] = str(file_data["content_length"])
        if file_data.get("etag"):
            headers["ETag"] = file_data["etag"]
        return StreamingResponse(
            file_data["body"].iter_chunks(),
            media_type=file_data["content_type"],
            headers=headers,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

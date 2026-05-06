from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_current_user
from src.services.storage_service import StorageService
from src.persistence.models import User
from src.schemas import ConfirmUploadRequest, PresignedUrlResponse

router = APIRouter(prefix="/storage", tags=["storage"])


@router.post("/presign", response_model=PresignedUrlResponse)
async def presign_upload(
    filename: str,
    current_user: User = Depends(get_current_user),
) -> PresignedUrlResponse:
    """Generate presigned URL for S3 upload."""
    service = StorageService()
    try:
        result = await service.generate_presigned_url(filename)
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

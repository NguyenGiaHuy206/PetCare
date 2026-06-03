from pydantic import BaseModel


class PresignedUrlResponse(BaseModel):
    upload_url: str
    file_url: str
    content_type: str


class ConfirmUploadRequest(BaseModel):
    file_url: str

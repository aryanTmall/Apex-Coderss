from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AttachmentResponse(BaseModel):
    id: str
    incident_id: Optional[str] = None
    report_id: Optional[str] = None
    original_filename: str
    mime_type: str
    file_size: int
    sha256_hash: str
    uploaded_at: datetime
    verified_at: Optional[datetime] = None
    verification_status: str
    is_synthetic: bool = False
    download_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AttachmentVerifyResult(BaseModel):
    id: str
    original_filename: str
    stored_hash: str
    calculated_hash: str
    is_valid: bool
    status: str
    verified_at: datetime
    details: str

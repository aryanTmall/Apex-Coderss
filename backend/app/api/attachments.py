import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.attachment import Attachment
from app.schemas.attachment import AttachmentResponse, AttachmentVerifyResult
from app.services.attachment_service import attachment_service

router = APIRouter(prefix="/attachments", tags=["Attachments & Cryptographic Evidence"])

@router.post("", response_model=AttachmentResponse)
async def upload_attachment(
    file: UploadFile = File(...),
    incident_id: Optional[str] = Form(None),
    report_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Accepts multipart file upload, validates format, streams to local secure storage,
    computes SHA-256 hash in real time, and registers the evidence record.
    """
    attachment = await attachment_service.save_upload(
        db=db,
        file=file,
        incident_id=incident_id,
        report_id=report_id
    )
    res = AttachmentResponse.model_validate(attachment)
    res.download_url = f"/api/attachments/{attachment.id}/download"
    return res

@router.get("/{attachment_id}", response_model=AttachmentResponse)
def get_attachment_metadata(attachment_id: str, db: Session = Depends(get_db)):
    """
    Returns attachment metadata including original filename, MIME type, size, and SHA-256 hash.
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    res = AttachmentResponse.model_validate(attachment)
    res.download_url = f"/api/attachments/{attachment.id}/download"
    return res

@router.get("/{attachment_id}/download")
def download_attachment(attachment_id: str, db: Session = Depends(get_db)):
    """
    Serves stored evidence binary with appropriate content-type headers.
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    file_path = attachment_service.get_file_path(attachment)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Stored file binary not found on disk")

    return FileResponse(
        path=file_path,
        media_type=attachment.mime_type,
        filename=attachment.original_filename
    )

@router.post("/{attachment_id}/verify", response_model=AttachmentVerifyResult)
def verify_attachment_integrity(attachment_id: str, db: Session = Depends(get_db)):
    """
    Cryptographically recalculates the SHA-256 checksum of the file on disk
    and compares it to the original tamper-proof hash recorded at intake.
    """
    result = attachment_service.verify_integrity(db, attachment_id)
    return AttachmentVerifyResult(**result)

@router.get("", response_model=List[AttachmentResponse])
def list_attachments(
    incident_id: Optional[str] = None,
    report_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Attachment)
    if incident_id:
        query = query.filter(Attachment.incident_id == incident_id)
    if report_id:
        query = query.filter(Attachment.report_id == report_id)
    
    records = query.order_by(Attachment.uploaded_at.desc()).all()
    results = []
    for r in records:
        resp = AttachmentResponse.model_validate(r)
        resp.download_url = f"/api/attachments/{r.id}/download"
        results.append(resp)
    return results

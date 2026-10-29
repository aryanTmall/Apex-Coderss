import os
import uuid
import hashlib
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.models.attachment import Attachment
from app.services.sim_clock import sim_clock
from app.services.image_authenticity_service import image_authenticity_service

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".mp4"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "video/mp4",
    "application/octet-stream",  # Fallback for generic binary
}

class AttachmentService:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def _get_secure_filename(self, original_filename: str) -> Tuple[str, str]:
        ext = os.path.splitext(original_filename)[1].lower()
        if not ext:
            ext = ".bin"
        unique_key = f"{uuid.uuid4().hex}{ext}"
        return unique_key, ext

    async def save_upload(
        self,
        db: Session,
        file: UploadFile,
        incident_id: Optional[str] = None,
        report_id: Optional[str] = None
    ) -> Attachment:
        original_name = file.filename or "evidence.jpg"
        unique_key, ext = self._get_secure_filename(original_name)
        file_path = os.path.join(self.upload_dir, unique_key)

        sha256 = hashlib.sha256()
        total_size = 0
        max_size = 15 * 1024 * 1024  # 15 MB limit

        with open(file_path, "wb") as f:
            while chunk := await file.read(64 * 1024):
                total_size += len(chunk)
                if total_size > max_size:
                    f.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(status_code=413, detail=f"File exceeds maximum allowed size of 15MB.")
                sha256.update(chunk)
                f.write(chunk)

        calculated_hash = sha256.hexdigest()
        mime_type = file.content_type or "image/jpeg"

        # Forensic AI Image Authenticity Verification
        with open(file_path, "rb") as f:
            uploaded_bytes = f.read()
        auth_result = image_authenticity_service.verify_authenticity(
            image_bytes=uploaded_bytes,
            filename=original_name,
            mime_type=mime_type
        )
        if auth_result["verdict"] == "REJECTED":
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=422,
                detail=f"Synthetic / AI-Generated Image Rejected: {auth_result['reason']}"
            )

        now = sim_clock.now()

        att_id = f"att_{uuid.uuid4().hex[:12]}"
        attachment = Attachment(
            id=att_id,
            incident_id=incident_id,
            report_id=report_id,
            storage_key=unique_key,
            original_filename=original_name,
            mime_type=mime_type,
            file_size=total_size,
            sha256_hash=calculated_hash,
            uploaded_at=now,
            verified_at=now,
            verification_status="VERIFIED",
            is_synthetic=False
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return attachment

    def create_synthetic_attachment(
        self,
        db: Session,
        filename: str,
        content_bytes: bytes,
        mime_type: str = "image/jpeg",
        incident_id: Optional[str] = None,
        report_id: Optional[str] = None
    ) -> Attachment:
        unique_key, _ = self._get_secure_filename(filename)
        file_path = os.path.join(self.upload_dir, unique_key)
        
        calculated_hash = hashlib.sha256(content_bytes).hexdigest()
        with open(file_path, "wb") as f:
            f.write(content_bytes)

        now = sim_clock.now()
        att_id = f"att_{uuid.uuid4().hex[:12]}"
        attachment = Attachment(
            id=att_id,
            incident_id=incident_id,
            report_id=report_id,
            storage_key=unique_key,
            original_filename=filename,
            mime_type=mime_type,
            file_size=len(content_bytes),
            sha256_hash=calculated_hash,
            uploaded_at=now,
            verified_at=now,
            verification_status="VERIFIED",
            is_synthetic=True
        )
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return attachment

    def verify_integrity(self, db: Session, attachment_id: str) -> dict:
        attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment record not found.")

        file_path = os.path.join(self.upload_dir, attachment.storage_key)
        if not os.path.exists(file_path):
            attachment.verification_status = "FILE_MISSING"
            db.commit()
            return {
                "id": attachment.id,
                "original_filename": attachment.original_filename,
                "stored_hash": attachment.sha256_hash,
                "calculated_hash": "",
                "is_valid": False,
                "status": "FILE_MISSING",
                "verified_at": sim_clock.now(),
                "details": "Stored file binary could not be located on filesystem."
            }

        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(64 * 1024):
                sha256.update(chunk)
        
        current_hash = sha256.hexdigest()
        is_valid = (current_hash == attachment.sha256_hash)
        now = sim_clock.now()

        attachment.verified_at = now
        attachment.verification_status = "VERIFIED" if is_valid else "TAMPERED"
        db.commit()

        return {
            "id": attachment.id,
            "original_filename": attachment.original_filename,
            "stored_hash": attachment.sha256_hash,
            "calculated_hash": current_hash,
            "is_valid": is_valid,
            "status": "VERIFIED" if is_valid else "TAMPERED",
            "verified_at": now,
            "details": "SHA-256 checksum matches stored database signature exactly." if is_valid else "Cryptographic hash mismatch! File contents have been modified."
        }

    def get_file_path(self, attachment: Attachment) -> str:
        return os.path.join(self.upload_dir, attachment.storage_key)

attachment_service = AttachmentService()

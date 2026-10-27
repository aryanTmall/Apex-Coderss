from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=True, index=True)
    report_id = Column(String(50), ForeignKey("citizen_reports.id"), nullable=True, index=True)
    
    storage_key = Column(String(255), unique=True, nullable=False)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    sha256_hash = Column(String(64), nullable=False, index=True)
    
    uploaded_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    verified_at = Column(UTCDateTime, nullable=True)
    verification_status = Column(String(30), default="VERIFIED", nullable=False)  # VERIFIED, TAMPERED, PENDING
    is_synthetic = Column(Boolean, default=False, nullable=False)

    incident = relationship("Incident", back_populates="attachments")
    report = relationship("CitizenReport", back_populates="attachments")

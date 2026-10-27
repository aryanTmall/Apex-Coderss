from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class ClosureSubmission(Base):
    __tablename__ = "closure_submissions"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=False, index=True)
    department_id = Column(String(50), nullable=True)
    description = Column(String(2000), nullable=False)
    photo_ref = Column(String(255), nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    submitted_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    verdict = Column(String(30), nullable=False)  # APPROVED, REJECTED, NEEDS_REVIEW
    verdict_reasons = Column(JSON, default=list, nullable=False)
    individual_checks = Column(JSON, default=dict, nullable=False)
    
    reviewer_id = Column(String(50), nullable=True)
    reviewer_note = Column(String(1000), nullable=True)
    reviewed_at = Column(UTCDateTime, nullable=True)
    is_synthetic = Column(Boolean, default=False, nullable=False)

    incident = relationship("Incident", back_populates="closure_submissions")

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(String(50), primary_key=True, index=True)
    tracking_id = Column(String(50), unique=True, index=True, nullable=False)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=True, index=True)
    reporter_name = Column(String(100), nullable=True)
    text = Column(String(2000), nullable=False)
    language = Column(String(10), default="en", nullable=False)
    category = Column(String(50), nullable=False)
    custom_category = Column(String(100), nullable=True)
    
    # Location intelligence fields
    location_mode = Column(String(20), default="PRECISE", nullable=False)  # PRECISE, UNCONFIRMED
    location_status = Column(String(30), default="USER_SELECTED", nullable=False)  # USER_SELECTED, LOCATION_UNCONFIRMED, CORROBORATED, LOCATION_CONFIRMED
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_description = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    approximate_locality = Column(String(200), nullable=True)
    observation_time = Column(String(100), nullable=True)
    
    photo_ref = Column(String(255), nullable=True)
    photo_data = Column(String, nullable=True)
    sha256_hash = Column(String(64), nullable=True)
    
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    duplicate_score = Column(Float, nullable=True)
    duplicate_rationale = Column(String(500), nullable=True)
    is_synthetic = Column(Boolean, default=False, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False, index=True)
    dataset = Column(String(50), default="LIVE", nullable=False, index=True)

    incident = relationship("Incident", back_populates="reports")
    attachments = relationship("Attachment", back_populates="report", cascade="all, delete-orphan")

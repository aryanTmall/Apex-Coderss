from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean
from app.database import Base, UTCDateTime

class EmergencyResource(Base):
    __tablename__ = "emergency_resources"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False, index=True) # GENERAL, MEDICAL, POLICE, FIRE, WOMEN_SAFETY, CHILD_PROTECTION, DISASTER, INFRASTRUCTURE
    phone_number = Column(String(50), nullable=False)
    alternate_phone = Column(String(50), nullable=True)
    jurisdiction = Column(String(100), default="National", nullable=False, index=True)
    available_hours = Column(String(100), default="24x7", nullable=False)
    source_url = Column(String(500), nullable=False)
    last_verified_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    verification_status = Column(String(30), default="OFFICIALLY_VERIFIED", nullable=False)
    description = Column(String(500), nullable=True)
    address = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Float, default=1.0, nullable=False)

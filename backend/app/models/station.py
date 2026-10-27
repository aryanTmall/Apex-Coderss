from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Text
from app.database import Base, UTCDateTime

class EmergencyStation(Base):
    __tablename__ = "emergency_stations"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    service_type = Column(String(50), nullable=False, index=True) # POLICE, FIRE, MEDICAL, DISASTER
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    phone_number = Column(String(50), nullable=False)
    alternate_phone = Column(String(50), nullable=True)
    operating_status = Column(String(50), default="OPERATIONAL_24X7", nullable=False)
    status_verified = Column(Boolean, default=True, nullable=False)
    data_source = Column(String(200), default="Official Municipal Emergency Registry", nullable=False)
    last_verified_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    capabilities = Column(String(500), nullable=True) # Comma-separated
    dispatch_integrated = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

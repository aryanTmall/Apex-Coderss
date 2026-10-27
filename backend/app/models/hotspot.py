from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON
from app.database import Base, UTCDateTime

class Hotspot(Base):
    __tablename__ = "hotspots"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    zone_name = Column(String(100), nullable=False)
    center_latitude = Column(Float, nullable=False)
    center_longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=150.0, nullable=False)
    incident_count = Column(Integer, default=3, nullable=False)
    severity_level = Column(String(20), default="HIGH", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    incident_ids = Column(JSON, default=list, nullable=False)
    detected_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_activity_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

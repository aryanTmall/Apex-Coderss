from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, JSON
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    supported_categories = Column(JSON, default=list, nullable=False)
    available = Column(Boolean, default=True, nullable=False)
    escalation_level = Column(Integer, default=0, nullable=False)
    trust_score = Column(Integer, default=100, nullable=False)
    spoofing_flags_count = Column(Integer, default=0, nullable=False)
    fallback_department_id = Column(String(50), nullable=True)
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    incidents = relationship("Incident", back_populates="department")

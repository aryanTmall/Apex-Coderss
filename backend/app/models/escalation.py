from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class EscalationRecord(Base):
    __tablename__ = "escalation_records"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=False, index=True)
    tier = Column(Integer, nullable=False)  # 1: Supervisor, 2: Ward Authority, 3: City Commissioner
    tier_name = Column(String(50), nullable=False)
    authority_title = Column(String(100), nullable=False)
    reason = Column(String(500), nullable=False)
    triggered_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(UTCDateTime, nullable=True)

    incident = relationship("Incident", back_populates="escalation_records")

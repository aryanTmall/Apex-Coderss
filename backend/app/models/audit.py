from datetime import datetime, timezone
from sqlalchemy import Column, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=True)
    actor = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    reason = Column(String(1000), nullable=False)
    structured_metadata = Column(JSON, default=dict, nullable=False)
    previous_hash = Column(String(64), nullable=True)
    event_hash = Column(String(64), nullable=True)
    timestamp = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    incident = relationship("Incident", back_populates="audit_events")

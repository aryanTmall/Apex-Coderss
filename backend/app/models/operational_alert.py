from datetime import datetime, timezone
from sqlalchemy import Column, String
from app.database import Base, UTCDateTime

class OperationalAlertAcknowledgment(Base):
    __tablename__ = "operational_alert_acknowledgments"

    id = Column(String(100), primary_key=True, index=True) # e.g. OP-OVERDUE-INC-001
    user_id = Column(String(50), nullable=True)
    status = Column(String(30), default="ACKNOWLEDGED", nullable=False) # ACKNOWLEDGED, RESOLVED
    resolution_notes = Column(String(500), nullable=True)
    acknowledged_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

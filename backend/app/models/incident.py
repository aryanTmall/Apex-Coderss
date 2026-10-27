from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    tracking_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(String(2000), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    custom_category = Column(String(100), nullable=True)
    priority = Column(Integer, default=3, nullable=False, index=True)  # 1 to 5
    priority_reasons = Column(JSON, default=list, nullable=False)
    status = Column(String(30), default="NEW", nullable=False, index=True)
    
    # Location intelligence fields
    location_mode = Column(String(20), default="PRECISE", nullable=False)  # PRECISE, UNCONFIRMED
    location_status = Column(String(30), default="USER_SELECTED", nullable=False)  # USER_SELECTED, LOCATION_UNCONFIRMED, CORROBORATED, LOCATION_CONFIRMED
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_description = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    approximate_locality = Column(String(200), nullable=True)
    photo_data = Column(String, nullable=True)
    sha256_hash = Column(String(64), nullable=True)
    
    department_id = Column(String(50), ForeignKey("departments.id"), nullable=True, index=True)
    
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    assigned_at = Column(UTCDateTime, nullable=True)
    sla_due_at = Column(UTCDateTime, nullable=True, index=True)
    resolved_at = Column(UTCDateTime, nullable=True)
    
    reopen_count = Column(Integer, default=0, nullable=False)
    escalation_count = Column(Integer, default=0, nullable=False)
    escalation_tier = Column(Integer, default=0, nullable=False)  # 0: Routine, 1: Supervisor, 2: Ward Authority, 3: Commissioner
    reports_count = Column(Integer, default=1, nullable=False)
    
    canonical_incident_id = Column(String(50), nullable=True)
    hotspot_id = Column(String(50), nullable=True)
    recurring_flag = Column(Boolean, default=False, nullable=False)
    root_cause_hypothesis = Column(String(1000), nullable=True)
    root_cause_evidence_ids = Column(JSON, default=list, nullable=False)
    
    ai_classification_metadata = Column(JSON, default=dict, nullable=False)
    assignment_rationale = Column(String(500), nullable=True)
    is_synthetic = Column(Boolean, default=False, nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False, index=True)
    dataset = Column(String(50), default="LIVE", nullable=False, index=True)

    department = relationship("Department", back_populates="incidents")
    reports = relationship("CitizenReport", back_populates="incident", cascade="all, delete-orphan")
    closure_submissions = relationship("ClosureSubmission", back_populates="incident", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="incident", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="incident", cascade="all, delete-orphan")
    escalation_records = relationship("EscalationRecord", back_populates="incident", cascade="all, delete-orphan")

from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class WhistleblowerCase(Base):
    __tablename__ = "whistleblower_cases"

    id = Column(String(50), primary_key=True, index=True) # e.g. WB-8F92-4C10
    case_token = Column(String(64), unique=True, index=True, nullable=False) # Cryptographic secret token for anonymous follow-up
    allegation_category = Column(String(50), nullable=False, index=True) # BRIBERY_CORRUPTION, ILLEGAL_CONSTRUCTION, PROCUREMENT_FRAUD, SUBSTANDARD_WORKS, INSPECTION_TAMPERING, OTHER
    title = Column(String(255), nullable=False)
    narrative = Column(Text, nullable=False)
    ward_id = Column(String(50), ForeignKey("wards.id"), nullable=True)
    suspect_organization = Column(String(200), nullable=True)
    is_anonymous = Column(Boolean, default=True, nullable=False)
    contact_channel = Column(String(200), nullable=True) # Optional encrypted/pseudonymous handle
    # Lifecycle: SUBMITTED -> TRIAGE -> ASSIGNED_TO_AUTHORIZED_REVIEWER -> UNDER_REVIEW -> ACTION_RECOMMENDED -> CLOSED
    status = Column(String(50), default="SUBMITTED", nullable=False, index=True)
    verification_label = Column(String(50), default="UNVERIFIED_ALLEGATION", nullable=False)
    investigation_outcome = Column(Text, nullable=True)
    assigned_reviewer_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    ward = relationship("Ward")
    reviewer = relationship("User")
    attachments = relationship("WhistleblowerAttachment", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("WhistleblowerAuditLog", back_populates="case", cascade="all, delete-orphan")


class WhistleblowerAttachment(Base):
    __tablename__ = "whistleblower_attachments"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("whistleblower_cases.id"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    storage_key = Column(String(255), nullable=False) # Stored in uploads/confidential/
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    uploaded_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("WhistleblowerCase", back_populates="attachments")


class WhistleblowerAuditLog(Base):
    __tablename__ = "whistleblower_audit_logs"

    id = Column(String(50), primary_key=True, index=True)
    case_id = Column(String(50), ForeignKey("whistleblower_cases.id"), nullable=False, index=True)
    actor_user_id = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False) # CREATED, VIEWED, STATUS_CHANGE, ATTACHMENT_ACCESS, OUTCOME_RECORDED
    details = Column(String(500), nullable=True)
    timestamp = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    case = relationship("WhistleblowerCase", back_populates="audit_logs")

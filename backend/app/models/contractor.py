from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(String(50), primary_key=True, index=True) # e.g. CON-DEL-01
    name = Column(String(200), nullable=False)
    agency_type = Column(String(100), default="Empanelled Municipal Contractor", nullable=False)
    contact_person = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    license_no = Column(String(100), nullable=False)
    trust_score = Column(Integer, default=100, nullable=False) # 0 to 100
    active_contracts_count = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    contracts = relationship("Contract", back_populates="contractor")
    assessments = relationship("PerformanceAssessment", back_populates="contractor")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String(50), primary_key=True, index=True) # e.g. CNT-PWD-2025-01
    contractor_id = Column(String(50), ForeignKey("contractors.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    contract_number = Column(String(100), unique=True, nullable=False)
    department_id = Column(String(50), ForeignKey("departments.id"), nullable=False)
    ward_id = Column(String(50), ForeignKey("wards.id"), nullable=True)
    contract_value = Column(Float, nullable=False)
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=False)
    sla_target_hours = Column(Integer, default=24, nullable=False)
    allowed_reopen_rate_pct = Column(Float, default=5.0, nullable=False)
    penalty_per_hour_breach = Column(Float, default=500.0, nullable=False)
    max_penalty_cap_pct = Column(Float, default=15.0, nullable=False)
    clauses_summary = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    contractor = relationship("Contractor", back_populates="contracts")
    department = relationship("Department")


class PerformanceAssessment(Base):
    __tablename__ = "performance_assessments"

    id = Column(String(50), primary_key=True, index=True) # e.g. ASM-2026-001
    contractor_id = Column(String(50), ForeignKey("contractors.id"), nullable=False, index=True)
    contract_id = Column(String(50), ForeignKey("contracts.id"), nullable=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=True, index=True)
    project_id = Column(String(50), ForeignKey("municipal_projects.id"), nullable=True)
    assessment_type = Column(String(50), default="PENALTY_RECOMMENDATION", nullable=False) # PENALTY_RECOMMENDATION, BONUS_RECOMMENDATION
    clause_reference = Column(String(100), nullable=False)
    breach_duration_hours = Column(Float, default=0.0, nullable=False)
    recommended_amount = Column(Float, nullable=False)
    final_amount = Column(Float, default=0.0, nullable=False)
    # Lifecycle: DETECTED -> EVIDENCE_REVIEW -> CALCULATED -> CONTRACTOR_NOTIFIED -> DISPUTED / ACCEPTED -> OFFICIAL_APPROVAL -> BILLING_ADJUSTMENT_PENDING -> RECONCILED
    status = Column(String(50), default="DETECTED", nullable=False, index=True)
    evidence_summary = Column(Text, nullable=False)
    contractor_response = Column(Text, nullable=True)
    official_decision_notes = Column(Text, nullable=True)
    reviewed_by_user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    approved_at = Column(UTCDateTime, nullable=True)
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    contractor = relationship("Contractor", back_populates="assessments")
    contract = relationship("Contract")
    incident = relationship("Incident")

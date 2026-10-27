from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class Ward(Base):
    __tablename__ = "wards"

    id = Column(String(50), primary_key=True, index=True) # e.g. WARD-42
    ward_number = Column(Integer, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    zone = Column(String(100), nullable=False, index=True)
    city = Column(String(100), default="New Delhi", nullable=False)
    population = Column(Integer, nullable=True)
    area_sq_km = Column(Float, nullable=True)
    councillor_name = Column(String(150), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    budgets = relationship("MunicipalBudget", back_populates="ward")
    projects = relationship("MunicipalProject", back_populates="ward")


class MunicipalBudget(Base):
    __tablename__ = "municipal_budgets"

    id = Column(String(50), primary_key=True, index=True)
    financial_year = Column(String(20), nullable=False, index=True) # e.g. "FY 2025-26"
    ward_id = Column(String(50), ForeignKey("wards.id"), nullable=False, index=True)
    department_id = Column(String(50), ForeignKey("departments.id"), nullable=True)
    approved_budget = Column(Float, nullable=False, default=0.0) # Total sanctioned in gazette
    allocated_amount = Column(Float, nullable=False, default=0.0) # Allocated to ward
    funds_released = Column(Float, nullable=False, default=0.0) # Treasury released
    expenditure_recorded = Column(Float, nullable=False, default=0.0) # Audited spend
    outstanding_commitments = Column(Float, nullable=False, default=0.0) # Committed work orders
    data_source = Column(String(255), default="Delhi Municipal Corporation Budget Gazette", nullable=False)
    reporting_period = Column(String(100), default="Q3 2025-26", nullable=False)
    last_verified_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_synthetic = Column(Boolean, default=False, nullable=False)

    ward = relationship("Ward", back_populates="budgets")
    department = relationship("Department")

    @property
    def utilization_pct(self) -> float:
        if self.approved_budget > 0:
            return round((self.expenditure_recorded / self.approved_budget) * 100.0, 1)
        return 0.0

    @property
    def remaining_balance(self) -> float:
        return round(self.approved_budget - self.expenditure_recorded, 2)


class MunicipalProject(Base):
    __tablename__ = "municipal_projects"

    id = Column(String(50), primary_key=True, index=True) # e.g. PRJ-DEL-2025-01
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    financial_year = Column(String(20), nullable=False, index=True)
    ward_id = Column(String(50), ForeignKey("wards.id"), nullable=False, index=True)
    department_id = Column(String(50), ForeignKey("departments.id"), nullable=True)
    sanctioned_amount = Column(Float, nullable=False)
    expenditure_recorded = Column(Float, nullable=False, default=0.0)
    contractor_name = Column(String(200), nullable=True)
    contractor_id = Column(String(50), nullable=True)
    status = Column(String(30), default="IN_PROGRESS", nullable=False, index=True) # PLANNED, IN_PROGRESS, COMPLETED, DELAYED
    start_date = Column(String(50), nullable=True)
    expected_completion_date = Column(String(50), nullable=True)
    milestones_json = Column(Text, nullable=True) # JSON milestones array
    completion_pct = Column(Integer, default=0, nullable=False)
    latest_update = Column(String(500), nullable=True)
    source_document_url = Column(String(500), nullable=True)
    last_verified_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    related_incident_category = Column(String(50), nullable=True)
    is_synthetic = Column(Boolean, default=False, nullable=False)

    ward = relationship("Ward", back_populates="projects")
    department = relationship("Department")

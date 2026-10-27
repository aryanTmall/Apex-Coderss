from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.report import ReportResponse
from app.schemas.closure import ClosureResponse
from app.schemas.audit import AuditEventResponse
from app.schemas.attachment import AttachmentResponse
from app.schemas.escalation import EscalationResponse

class IncidentBase(BaseModel):
    title: str
    description: str
    category: str
    custom_category: Optional[str] = None
    priority: int = Field(3, ge=1, le=5)
    
    location_mode: str = "PRECISE"
    location_status: str = "USER_SELECTED"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_description: Optional[str] = None
    address: Optional[str] = None
    approximate_locality: Optional[str] = None
    photo_data: Optional[str] = None
    sha256_hash: Optional[str] = None
    department_id: Optional[str] = None

class IncidentAssignRequest(BaseModel):
    department_id: str
    reason: Optional[str] = "Manual operator assignment"

class DensityIncidentSummary(BaseModel):
    id: str
    tracking_id: str
    title: str
    category: str
    priority: int
    status: str
    distance_meters: float

class DensityResponse(BaseModel):
    density_count: int
    is_high_density: bool
    radius_meters: float
    message: str
    active_incidents: List[DensityIncidentSummary] = Field(default_factory=list)

class IncidentResponse(IncidentBase):
    id: str
    tracking_id: str
    priority_reasons: List[str]
    status: str
    created_at: datetime
    assigned_at: Optional[datetime] = None
    sla_due_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    reopen_count: int = 0
    escalation_count: int = 0
    escalation_tier: int = 0
    reports_count: int = 1
    canonical_incident_id: Optional[str] = None
    hotspot_id: Optional[str] = None
    recurring_flag: bool = False
    root_cause_hypothesis: Optional[str] = None
    root_cause_evidence_ids: List[str] = Field(default_factory=list)
    ai_classification_metadata: Dict[str, Any] = Field(default_factory=dict)
    assignment_rationale: Optional[str] = None
    is_synthetic: bool = False
    is_demo: bool = False
    dataset: str = "LIVE"

    model_config = ConfigDict(from_attributes=True)

class IncidentDetailResponse(IncidentResponse):
    reports: List[ReportResponse] = Field(default_factory=list)
    closure_submissions: List[ClosureResponse] = Field(default_factory=list)
    audit_events: List[AuditEventResponse] = Field(default_factory=list)
    attachments: List[AttachmentResponse] = Field(default_factory=list)
    escalation_records: List[EscalationResponse] = Field(default_factory=list)

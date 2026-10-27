from typing import List, Optional
from pydantic import BaseModel
from app.schemas.incident import IncidentResponse
from app.schemas.report import ReportResponse
from app.schemas.closure import ClosureResponse
from app.schemas.audit import AuditEventResponse

class SeedPotholeResponse(BaseModel):
    message: str
    canonical_incident_id: str
    report_ids: List[str]
    reports: List[ReportResponse]

class BadClosureResponse(BaseModel):
    message: str
    incident_id: str
    closure: ClosureResponse
    resulting_incident_status: str
    priority: int
    reopen_count: int
    sla_due_at: Optional[str]

class AdvanceTimeRequest(BaseModel):
    minutes: int

class AdvanceTimeResponse(BaseModel):
    message: str
    simulated_now: str
    minutes_advanced: int
    escalated_incident_ids: List[str]
    escalated_count: int

class DepartmentOutageRequest(BaseModel):
    department_id: str
    available: bool

class ResetRequest(BaseModel):
    confirm: bool

class ResetResponse(BaseModel):
    message: str
    reset_performed: bool

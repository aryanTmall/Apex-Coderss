from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ClosureSubmitRequest(BaseModel):
    description: str = Field(..., min_length=5, max_length=2000)
    photo_ref: Optional[str] = Field(None, max_length=255)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    department_id: Optional[str] = None

class CheckResult(BaseModel):
    name: str
    status: str  # PASSED, FAILED, NEEDS_REVIEW
    explanation: str
    evidence: Optional[Dict[str, Any]] = None

class ClosureResponse(BaseModel):
    id: str
    incident_id: str
    department_id: Optional[str] = None
    description: str
    photo_ref: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    submitted_at: datetime
    verdict: str  # APPROVED, REJECTED, NEEDS_REVIEW
    verdict_reasons: List[str]
    individual_checks: Dict[str, Any]
    reviewer_id: Optional[str] = None
    reviewer_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    is_synthetic: bool = False

    model_config = ConfigDict(from_attributes=True)

class IncidentReviewRequest(BaseModel):
    decision: str = Field(..., pattern="^(APPROVE|REOPEN|ASSIGN)$")
    note: str = Field(..., min_length=3, max_length=1000)
    department_id: Optional[str] = None
    reviewer_id: Optional[str] = "operator_admin"

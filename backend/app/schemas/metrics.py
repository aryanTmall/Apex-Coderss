from typing import Dict, Any, Optional
from pydantic import BaseModel

class MetricsResponse(BaseModel):
    total_reports: int
    canonical_incidents: int
    open_cases: int
    resolved_cases: int
    overdue_cases: int
    escalated_cases: int
    duplicate_link_rate_pct: float
    closure_rejection_rate_pct: float
    sla_compliance_pct: float
    median_resolution_min: float
    by_department: Dict[str, int]
    by_category: Dict[str, int]
    by_status: Dict[str, int]
    closure_verdict_distribution: Dict[str, int]

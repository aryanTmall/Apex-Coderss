from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class DepartmentBase(BaseModel):
    id: str
    name: str
    supported_categories: List[str] = Field(default_factory=list)
    available: bool = True
    escalation_level: int = 0
    trust_score: int = 100
    spoofing_flags_count: int = 0
    fallback_department_id: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentAvailabilityUpdate(BaseModel):
    available: bool

class DepartmentResponse(DepartmentBase):
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

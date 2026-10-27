from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class EscalationResponse(BaseModel):
    id: str
    incident_id: str
    tier: int
    tier_name: str
    authority_title: str
    reason: str
    triggered_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

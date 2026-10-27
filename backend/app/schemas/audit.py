from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class AuditEventResponse(BaseModel):
    id: str
    incident_id: Optional[str] = None
    event_type: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    actor: str
    action: str
    reason: str
    structured_metadata: Dict[str, Any]
    previous_hash: Optional[str] = None
    event_hash: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class HotspotResponse(BaseModel):
    id: str
    name: str
    category: str
    zone_name: str
    center_latitude: float
    center_longitude: float
    radius_meters: float
    incident_count: int
    severity_level: str
    incident_ids: List[str]
    detected_at: datetime
    last_activity_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

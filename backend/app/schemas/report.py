from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ReportCreate(BaseModel):
    description: str = Field(..., min_length=5, max_length=2000)
    category: Optional[str] = Field("pothole", max_length=50)
    custom_category: Optional[str] = Field(None, max_length=100)
    
    # Location Intelligence
    location_mode: str = Field("PRECISE", description="'PRECISE' or 'UNCONFIRMED'")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    location_description: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    approximate_locality: Optional[str] = Field(None, max_length=200)
    observation_time: Optional[str] = Field(None, max_length=100)
    
    reporter_name: Optional[str] = Field(None, max_length=100)
    photo_ref: Optional[str] = Field(None, max_length=255)
    photo_data: Optional[str] = Field(None, description="Base64 encoded image or cryptographic data URL")
    sha256_hash: Optional[str] = Field(None, max_length=64, description="SHA-256 hash of proof photo")
    attachment_ids: List[str] = Field(default_factory=list)
    language: str = Field("en", max_length=10)

class ReportResponse(BaseModel):
    id: str
    tracking_id: str
    incident_id: Optional[str] = None
    reporter_name: Optional[str] = None
    text: str
    language: str
    category: str
    custom_category: Optional[str] = None
    
    location_mode: str = "PRECISE"
    location_status: str = "USER_SELECTED"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_description: Optional[str] = None
    address: Optional[str] = None
    approximate_locality: Optional[str] = None
    observation_time: Optional[str] = None
    
    photo_ref: Optional[str] = None
    photo_data: Optional[str] = None
    sha256_hash: Optional[str] = None
    created_at: datetime
    duplicate_score: Optional[float] = None
    duplicate_rationale: Optional[str] = None
    is_synthetic: bool = False
    is_demo: bool = False
    dataset: str = "LIVE"

    model_config = ConfigDict(from_attributes=True)

class ReportIntakeResult(BaseModel):
    report: ReportResponse
    incident_id: str
    incident_tracking_id: str
    is_duplicate: bool
    duplicate_action: str  # "LINKED", "REVIEW", "CREATED"
    duplicate_score: Optional[float] = None
    explanation: str
    category: str
    priority: int
    assigned_department_id: Optional[str] = None
    location_mode: str = "PRECISE"
    location_status: str = "USER_SELECTED"

from typing import List, Optional
from pydantic import BaseModel

class LocationSearchResult(BaseModel):
    display_name: str
    latitude: float
    longitude: float
    type: Optional[str] = None
    locality: Optional[str] = None
    suburb: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None

class ReverseGeocodeResult(BaseModel):
    formatted_address: str
    locality: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: float
    longitude: float

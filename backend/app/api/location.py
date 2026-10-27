from typing import List
from fastapi import APIRouter, Query
from app.schemas.location import LocationSearchResult, ReverseGeocodeResult
from app.services.geocoding import geocoding_service

router = APIRouter(prefix="/location", tags=["Location Intelligence"])

@router.get("/search", response_model=List[LocationSearchResult])
def search_location(
    q: str = Query(..., min_length=2, max_length=150, description="Address, locality, or landmark search query")
):
    """
    Searches for addresses, landmarks, and localities with in-memory caching
    and resilient offline gazetteer fallback.
    """
    results = geocoding_service.search_address(q)
    return [LocationSearchResult(**item) for item in results]

@router.get("/reverse", response_model=ReverseGeocodeResult)
def reverse_geocode(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0)
):
    """
    Reverse-geocodes coordinate pairs into human-readable street and locality names.
    """
    result = geocoding_service.reverse_geocode(lat, lon)
    return ReverseGeocodeResult(**result)

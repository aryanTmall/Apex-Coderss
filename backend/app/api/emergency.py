from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.station import EmergencyStation
from app.services.emergency_service import (
    get_emergency_resources,
    get_emergency_stations,
)
from app.services.routing_eta_service import (
    get_nearest_stations_with_eta,
    fetch_osrm_route,
    haversine_distance_km,
)

router = APIRouter(prefix="/emergency", tags=["Emergency Services & Critical Response"])


class EmergencyResourceResponse(BaseModel):
    id: str
    name: str
    category: str
    phone_number: str
    alternate_phone: Optional[str] = None
    jurisdiction: str
    available_hours: str
    source_url: str
    last_verified_at: datetime
    verification_status: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class EmergencyStationResponse(BaseModel):
    id: str
    name: str
    service_type: str
    address: str
    latitude: float
    longitude: float
    phone_number: str
    alternate_phone: Optional[str] = None
    operating_status: str
    status_verified: bool
    data_source: str
    last_verified_at: datetime
    capabilities: Optional[str] = None
    dispatch_integrated: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class EmergencyStationEtaResponse(BaseModel):
    id: str
    name: str
    service_type: str
    address: str
    latitude: float
    longitude: float
    phone_number: str
    alternate_phone: Optional[str] = None
    operating_status: str
    status_verified: bool
    data_source: str
    last_verified_at: Optional[str] = None
    capabilities: List[str] = []
    dispatch_integrated: bool
    live_eta_available: bool
    eta_source: str
    route_distance_km: Optional[float] = None
    straight_line_distance_km: float
    estimated_travel_minutes: Optional[int] = None
    eta_description: str
    eta_calculated_at: str
    directions_url: str
    osm_directions_url: str


@router.get("", response_model=List[EmergencyResourceResponse])
@router.get("/services", response_model=List[EmergencyResourceResponse])
def list_emergency_services(
    category: Optional[str] = Query(None, description="Category filter (GENERAL, POLICE, FIRE, MEDICAL, etc.)"),
    jurisdiction: Optional[str] = Query(None, description="Jurisdiction text filter"),
    db: Session = Depends(get_db)
):
    """
    Public Emergency Directory.
    Returns authoritative, verified emergency telephone hotlines and dispatch contacts.
    Accessible without authentication for public safety.
    """
    return get_emergency_resources(db, category=category, jurisdiction=jurisdiction)


@router.get("/stations", response_model=List[EmergencyStationResponse])
def list_emergency_stations(
    service_type: Optional[str] = Query(None, alias="type", description="Service type filter (POLICE, FIRE, MEDICAL, DISASTER)"),
    db: Session = Depends(get_db)
):
    """
    Returns verified physical emergency stations (police stations, fire stations, trauma centers).
    """
    return get_emergency_stations(db, service_type=service_type)


@router.get("/nearest", response_model=List[EmergencyStationEtaResponse])
def get_nearest_stations(
    lat: float = Query(..., ge=-90.0, le=90.0, description="User current latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="User current longitude"),
    service_type: Optional[str] = Query(None, alias="type", description="Optional service type (POLICE, FIRE, MEDICAL, DISASTER)"),
    limit: int = Query(5, ge=1, le=20, description="Number of candidate stations to return"),
    db: Session = Depends(get_db)
):
    """
    Identifies the nearest verified emergency stations using user GPS coordinates and calculates
    accurate road distance and travel time via OSRM live routing.
    If routing provider is unavailable, straight-line distance is provided with explicit 'Live ETA unavailable'.
    Never fabricates false or simulated ETAs.
    """
    return get_nearest_stations_with_eta(
        db=db,
        user_lat=lat,
        user_lon=lon,
        service_type=service_type,
        limit=limit
    )


@router.get("/eta", response_model=EmergencyStationEtaResponse)
def get_station_eta(
    lat: float = Query(..., ge=-90.0, le=90.0, description="User current latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="User current longitude"),
    station_id: str = Query(..., description="ID of destination emergency station"),
    db: Session = Depends(get_db)
):
    """
    Calculates exact road distance and estimated arrival time to a specific emergency station.
    """
    stn = db.query(EmergencyStation).filter(
        EmergencyStation.id == station_id,
        EmergencyStation.is_active == True
    ).first()

    if not stn:
        raise HTTPException(status_code=404, detail=f"Emergency station '{station_id}' not found")

    spatial_km = haversine_distance_km(lat, lon, stn.latitude, stn.longitude)
    route_info = fetch_osrm_route(lat, lon, stn.latitude, stn.longitude)
    calc_timestamp = datetime.now(timezone.utc).isoformat()

    directions_google = (
        f"https://www.google.com/maps/dir/?api=1&origin={lat},{lon}&destination={stn.latitude},{stn.longitude}"
    )
    directions_osm = (
        f"https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route={lat},{lon}%3B{stn.latitude},{stn.longitude}"
    )

    if route_info is not None:
        dist_km = round(route_info["distance_meters"] / 1000.0, 2)
        dur_min = max(1, round(route_info["duration_seconds"] / 60.0))
        live_eta_available = True
        eta_source = "OSRM Live Routing Engine"
        status_desc = f"{dur_min} min ({dist_km} km road route)"
    else:
        dist_km = None
        dur_min = None
        live_eta_available = False
        eta_source = "Live ETA unavailable (Routing Offline)"
        status_desc = f"~{round(spatial_km, 1)} km straight-line (Road ETA unavailable)"

    return {
        "id": stn.id,
        "name": stn.name,
        "service_type": stn.service_type,
        "address": stn.address,
        "latitude": stn.latitude,
        "longitude": stn.longitude,
        "phone_number": stn.phone_number,
        "alternate_phone": stn.alternate_phone,
        "operating_status": stn.operating_status,
        "status_verified": stn.status_verified,
        "data_source": stn.data_source,
        "last_verified_at": stn.last_verified_at.isoformat() if stn.last_verified_at else None,
        "capabilities": [c.strip() for c in (stn.capabilities or "").split(",") if c.strip()],
        "dispatch_integrated": stn.dispatch_integrated,
        "live_eta_available": live_eta_available,
        "eta_source": eta_source,
        "route_distance_km": dist_km,
        "straight_line_distance_km": round(spatial_km, 2),
        "estimated_travel_minutes": dur_min,
        "eta_description": status_desc,
        "eta_calculated_at": calc_timestamp,
        "directions_url": directions_google,
        "osm_directions_url": directions_osm,
    }

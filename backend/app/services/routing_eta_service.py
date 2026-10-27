import math
import time
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.station import EmergencyStation

# In-memory LRU-style cache for route calculations to respect public API limits
# Cache key: (round(lat1, 4), round(lon1, 4), round(lat2, 4), round(lon2, 4)) -> (distance_m, duration_s, timestamp)
_ROUTE_CACHE: Dict[tuple, tuple] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in kilometers."""
    r = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def fetch_osrm_route(
    lat1: float, lon1: float, lat2: float, lon2: float, timeout_sec: float = 2.5
) -> Optional[Dict[str, float]]:
    """
    Queries Open Source Routing Machine (OSRM) driving profile for road distance and duration.
    Coordinates format: {longitude},{latitude};{longitude},{latitude}
    Returns {'distance_meters': float, 'duration_seconds': float} or None on error/timeout.
    """
    cache_key = (round(lat1, 4), round(lon1, 4), round(lat2, 4), round(lon2, 4))
    now = time.time()

    # Check cache
    if cache_key in _ROUTE_CACHE:
        dist_m, dur_s, ts = _ROUTE_CACHE[cache_key]
        if now - ts < CACHE_TTL_SECONDS:
            return {"distance_meters": dist_m, "duration_seconds": dur_s}

    url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CivicHelp-EmergencyDispatcher/3.0"}
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("code") == "Ok" and data.get("routes"):
                    first_route = data["routes"][0]
                    dist_m = float(first_route.get("distance", 0.0))
                    dur_s = float(first_route.get("duration", 0.0))
                    _ROUTE_CACHE[cache_key] = (dist_m, dur_s, now)
                    return {"distance_meters": dist_m, "duration_seconds": dur_s}
    except Exception:
        # Gracefully handle network timeouts or rate limits without raising
        pass

    return None


def get_nearest_stations_with_eta(
    db: Session,
    user_lat: float,
    user_lon: float,
    service_type: Optional[str] = None,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Identifies verified emergency stations nearest to the given GPS coordinates.
    Computes road distance and estimated travel time via OSRM.
    If routing fails or is unconfigured, straight-line distance is provided with explicit 'Live ETA unavailable'.
    """
    query = db.query(EmergencyStation).filter(EmergencyStation.is_active == True)
    if service_type and service_type.upper() != "ALL":
        query = query.filter(EmergencyStation.service_type == service_type.upper())

    stations = query.all()
    if not stations:
        return []

    # Calculate spatial distance to each station to pick top candidates
    candidates = []
    for stn in stations:
        spatial_km = haversine_distance_km(user_lat, user_lon, stn.latitude, stn.longitude)
        candidates.append((spatial_km, stn))

    # Sort by spatial distance and take candidates
    candidates.sort(key=lambda x: x[0])
    top_candidates = candidates[:max(limit * 2, 8)]

    results: List[Dict[str, Any]] = []
    calc_timestamp = datetime.now(timezone.utc).isoformat()

    for spatial_km, stn in top_candidates:
        route_info = fetch_osrm_route(user_lat, user_lon, stn.latitude, stn.longitude)

        directions_google = (
            f"https://www.google.com/maps/dir/?api=1&origin={user_lat},{user_lon}&destination={stn.latitude},{stn.longitude}"
        )
        directions_osm = (
            f"https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route={user_lat},{user_lon}%3B{stn.latitude},{stn.longitude}"
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

        results.append({
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
        })

    # Sort results primarily by route duration (if available) or straight-line distance
    def sort_key(item):
        if item["live_eta_available"] and item["estimated_travel_minutes"] is not None:
            return (0, item["estimated_travel_minutes"])
        return (1, item["straight_line_distance_km"])

    results.sort(key=sort_key)
    return results[:limit]

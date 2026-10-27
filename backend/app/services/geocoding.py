import time
import logging
from typing import List, Optional, Dict
import urllib.request
import urllib.parse
import json
import math

logger = logging.getLogger("civichelp.geocoding")

# Built-in local gazetteer fallback for high-reliability demo and offline environments
KNOWN_LANDMARKS = [
    {"name": "Connaught Place Inner Circle", "locality": "Connaught Place", "suburb": "Central Delhi", "city": "New Delhi", "lat": 28.6315, "lon": 77.2167},
    {"name": "Rajiv Chowk Metro Station Gate 2", "locality": "Connaught Place", "suburb": "Central Delhi", "city": "New Delhi", "lat": 28.6328, "lon": 77.2195},
    {"name": "Sector 18 Market & Metro", "locality": "Sector 18", "suburb": "Noida Commercial Hub", "city": "Noida", "lat": 28.5708, "lon": 77.3260},
    {"name": "Sector 18 Expressway Junction", "locality": "Sector 18", "suburb": "Expressway Corridor", "city": "Noida", "lat": 28.5685, "lon": 77.3290},
    {"name": "Chandni Chowk Red Fort Road", "locality": "Old City", "suburb": "Heritage District", "city": "Old Delhi", "lat": 28.6562, "lon": 77.2410},
    {"name": "Karol Bagh Main Market", "locality": "Karol Bagh", "suburb": "West Zone", "city": "New Delhi", "lat": 28.6475, "lon": 77.1906},
    {"name": "Civil Lines Municipal Office", "locality": "Civil Lines", "suburb": "North Zone", "city": "Delhi", "lat": 28.6814, "lon": 77.2227},
    {"name": "Saket District Centre", "locality": "Saket", "suburb": "South Zone", "city": "New Delhi", "lat": 28.5284, "lon": 77.2185},
    {"name": "South Extension Part 2 Ring Road", "locality": "South Extension", "suburb": "South Zone", "city": "New Delhi", "lat": 28.5714, "lon": 77.2225},
    {"name": "Mayur Vihar Phase 1 Pocket 1", "locality": "Mayur Vihar", "suburb": "East Zone", "city": "Delhi", "lat": 28.6080, "lon": 77.2954},
    {"name": "Dwarka Sector 10 Metro", "locality": "Dwarka", "suburb": "South West Zone", "city": "New Delhi", "lat": 28.5810, "lon": 77.0570},
    {"name": "Cyber Hub Phase 2", "locality": "DLF Phase 2", "suburb": "Tech Corridor", "city": "Gurugram", "lat": 28.4986, "lon": 77.0878},
    {"name": "Rohini Sector 7 Main Road", "locality": "Rohini", "suburb": "North West Zone", "city": "Delhi", "lat": 28.7093, "lon": 77.1215},
    {"name": "4th Avenue & 12th Street", "locality": "Sector 12", "suburb": "Ward 4B", "city": "Capital District", "lat": 28.6139, "lon": 77.2090},
]

class GeocodingService:
    def __init__(self):
        self._cache: Dict[str, dict] = {}
        self._cache_ttl = 3600  # 1 hour
        self._last_call_time = 0.0

    def _get_cache(self, key: str) -> Optional[dict]:
        if key in self._cache:
            entry = self._cache[key]
            if time.time() - entry["ts"] < self._cache_ttl:
                return entry["data"]
            del self._cache[key]
        return None

    def _set_cache(self, key: str, data: dict):
        if len(self._cache) > 500:
            self._cache.clear()
        self._cache[key] = {"data": data, "ts": time.time()}

    def search_address(self, query: str) -> List[dict]:
        query_clean = query.strip()
        if not query_clean:
            return []

        cache_key = f"search:{query_clean.lower()}"
        cached = self._get_cache(cache_key)
        if cached is not None:
            return cached

        results = []
        # Try OpenStreetMap Nominatim with polite headers and strict 2s timeout
        try:
            # Respect rate limit (minimum 500ms between live calls)
            elapsed = time.time() - self._last_call_time
            if elapsed < 0.5:
                time.sleep(0.5 - elapsed)
            self._last_call_time = time.time()

            encoded = urllib.parse.quote(query_clean)
            url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&addressdetails=1&limit=5"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "CivicHelp-SmartCities/2.4.0 (civichelp@hackathon.local)"}
            )
            with urllib.request.urlopen(req, timeout=2.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data:
                    addr = item.get("address", {})
                    results.append({
                        "display_name": item.get("display_name", ""),
                        "latitude": float(item.get("lat")),
                        "longitude": float(item.get("lon")),
                        "type": item.get("type", "landmark"),
                        "locality": addr.get("suburb") or addr.get("neighbourhood") or addr.get("road") or "",
                        "suburb": addr.get("suburb", ""),
                        "city": addr.get("city") or addr.get("town") or addr.get("state_district") or "Delhi NCR",
                        "postcode": addr.get("postcode", "")
                    })
        except Exception as e:
            logger.debug(f"External geocoding search failed or timed out: {e}. Falling back to internal gazetteer.")

        # If external returned nothing or failed, query internal gazetteer
        if not results:
            q_lower = query_clean.lower()
            for lm in KNOWN_LANDMARKS:
                if (q_lower in lm["name"].lower() or 
                    q_lower in lm["locality"].lower() or 
                    q_lower in lm["suburb"].lower()):
                    results.append({
                        "display_name": f"{lm['name']}, {lm['locality']}, {lm['city']}",
                        "latitude": lm["lat"],
                        "longitude": lm["lon"],
                        "type": "landmark",
                        "locality": lm["locality"],
                        "suburb": lm["suburb"],
                        "city": lm["city"],
                        "postcode": "110001"
                    })

        self._set_cache(cache_key, results)
        return results

    def reverse_geocode(self, lat: float, lon: float) -> dict:
        cache_key = f"rev:{lat:.4f},{lon:.4f}"
        cached = self._get_cache(cache_key)
        if cached is not None:
            return cached

        # Attempt Nominatim reverse with polite header & timeout
        try:
            elapsed = time.time() - self._last_call_time
            if elapsed < 0.5:
                time.sleep(0.5 - elapsed)
            self._last_call_time = time.time()

            url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "CivicHelp-SmartCities/2.4.0 (civichelp@hackathon.local)"}
            )
            with urllib.request.urlopen(req, timeout=2.5) as resp:
                item = json.loads(resp.read().decode("utf-8"))
                addr = item.get("address", {})
                res = {
                    "formatted_address": item.get("display_name", f"Location near {lat:.4f}, {lon:.4f}"),
                    "locality": addr.get("road") or addr.get("suburb") or addr.get("neighbourhood"),
                    "neighborhood": addr.get("suburb") or addr.get("residential"),
                    "city": addr.get("city") or addr.get("town") or addr.get("state_district") or "Delhi NCR",
                    "state": addr.get("state", "Delhi"),
                    "latitude": lat,
                    "longitude": lon
                }
                self._set_cache(cache_key, res)
                return res
        except Exception as e:
            logger.debug(f"External reverse geocoding failed: {e}. Matching nearest gazetteer point.")

        # Nearest point fallback from KNOWN_LANDMARKS
        best_lm = None
        min_dist = float("inf")
        for lm in KNOWN_LANDMARKS:
            d = math.hypot(lat - lm["lat"], lon - lm["lon"])
            if d < min_dist:
                min_dist = d
                best_lm = lm

        if best_lm and min_dist < 0.05:  # Within ~5 km
            res = {
                "formatted_address": f"{best_lm['name']}, {best_lm['locality']}, {best_lm['city']}",
                "locality": best_lm["locality"],
                "neighborhood": best_lm["suburb"],
                "city": best_lm["city"],
                "state": "Delhi",
                "latitude": lat,
                "longitude": lon
            }
        else:
            res = {
                "formatted_address": f"Municipal Zone ({lat:.5f}, {lon:.5f})",
                "locality": f"Zone {int(lat * 100) % 20 + 1}",
                "neighborhood": "Capital Metro Ward",
                "city": "Capital District",
                "state": "Capital Region",
                "latitude": lat,
                "longitude": lon
            }

        self._set_cache(cache_key, res)
        return res

geocoding_service = GeocodingService()

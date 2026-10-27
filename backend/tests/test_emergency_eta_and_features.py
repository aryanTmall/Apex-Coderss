import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_emergency_stations_list():
    resp = client.get("/api/emergency/stations")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 8
    names = [s["name"] for s in data]
    assert any("Connaught" in name for name in names)
    assert any("AIIMS" in name for name in names)


def test_emergency_stations_filtering_by_type():
    resp = client.get("/api/emergency/stations?type=FIRE")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    for stn in data:
        assert stn["service_type"] == "FIRE"


def test_emergency_nearest_stations_routing():
    # User coordinates near Connaught Place (28.6289, 77.2183)
    resp = client.get("/api/emergency/nearest?lat=28.6289&lon=77.2183&type=POLICE&limit=3")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    nearest = data[0]
    assert nearest["service_type"] == "POLICE"
    assert "straight_line_distance_km" in nearest
    assert nearest["straight_line_distance_km"] < 5.0
    assert "directions_url" in nearest
    assert "phone_number" in nearest
    # ETA fields must exist and never be fabricated
    assert "live_eta_available" in nearest
    assert "eta_source" in nearest


def test_emergency_nearest_stations_invalid_coords():
    resp = client.get("/api/emergency/nearest?lat=999.0&lon=77.2183")
    assert resp.status_code == 422


def test_emergency_station_eta_endpoint():
    resp = client.get("/api/emergency/eta?lat=28.6289&lon=77.2183&station_id=STN-POL-01")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "STN-POL-01"
    assert "phone_number" in data
    assert data["straight_line_distance_km"] < 1.0


def test_emergency_station_eta_non_existent():
    resp = client.get("/api/emergency/eta?lat=28.6289&lon=77.2183&station_id=STN-INVALID-999")
    assert resp.status_code == 404


def test_news_articles_enriched_with_incident_links():
    resp = client.get("/api/news?scope=LOCAL")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    art = data[0]
    assert "ai_summary" in art
    assert "civic_relevance" in art
    assert "related_incident_count" in art
    assert "related_category" in art


def test_incidents_coordinates_filter():
    # Test has_coords=true
    resp_coords = client.get("/api/incidents?has_coords=true&limit=10")
    assert resp_coords.status_code == 200
    for inc in resp_coords.json():
        assert inc["latitude"] is not None
        assert inc["longitude"] is not None


def test_emergency_services_hotlines_uninterrupted():
    resp = client.get("/api/emergency/services")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 5
    numbers = [s["phone_number"] for s in data]
    assert "112" in numbers
    assert "100" in numbers
    assert "101" in numbers
    assert "108" in numbers

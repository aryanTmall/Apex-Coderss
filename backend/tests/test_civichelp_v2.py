import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_v2_attachment_upload_and_sha256_verification(client):
    """Verifies multipart upload, real-time SHA-256 calculation, and cryptographic integrity verification."""
    file_content = b"CIVIC-HELP-EVIDENCE-TEST-PAYLOAD-FOR-SHA256-VERIFICATION-2026"
    files = {"file": ("evidence_pothole_4th_ave.jpg", io.BytesIO(file_content), "image/jpeg")}
    data = {"report_id": "rep_test_01"}

    upload_res = client.post("/api/attachments", files=files, data=data)
    assert upload_res.status_code == 200
    att = upload_res.json()
    assert att["original_filename"] == "evidence_pothole_4th_ave.jpg"
    assert att["mime_type"] == "image/jpeg"
    assert len(att["sha256_hash"]) == 64
    assert att["file_size"] == len(file_content)
    att_id = att["id"]

    # Verify download
    down_res = client.get(f"/api/attachments/{att_id}/download")
    assert down_res.status_code == 200
    assert down_res.content == file_content

    # Verify cryptographic integrity endpoint
    verify_res = client.post(f"/api/attachments/{att_id}/verify")
    assert verify_res.status_code == 200
    v = verify_res.json()
    assert v["is_valid"] is True
    assert v["status"] == "VERIFIED"
    assert v["stored_hash"] == att["sha256_hash"]
    assert v["calculated_hash"] == att["sha256_hash"]

def test_v2_location_intelligence_search_and_reverse(client):
    """Verifies location search and reverse geocoding with fallback gazetteer."""
    # Search query
    search_res = client.get("/api/location/search?q=Connaught Place")
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) >= 1
    assert "Connaught" in results[0]["display_name"]
    assert isinstance(results[0]["latitude"], float)
    assert isinstance(results[0]["longitude"], float)

    # Reverse geocoding
    rev_res = client.get("/api/location/reverse?lat=28.6315&lon=77.2167")
    assert rev_res.status_code == 200
    rev = rev_res.json()
    assert "formatted_address" in rev
    assert rev["latitude"] == 28.6315
    assert rev["longitude"] == 77.2167

def test_v2_unconfirmed_location_report_triage_and_corroborate(client):
    """Verifies submitting a report in UNCONFIRMED mode, queuing in triage, and operator corroboration."""
    rep_res = client.post("/api/reports", json={
        "description": "Massive commercial water pipe burst observed on morning commute. Flooding road.",
        "category": "water_leak",
        "location_mode": "UNCONFIRMED",
        "approximate_locality": "South Extension Part 2 near Metro",
        "observation_time": "Today morning 8:15 AM",
        "reporter_name": "Commuter Anita"
    })
    assert rep_res.status_code == 200
    r = rep_res.json()
    assert r["location_mode"] == "UNCONFIRMED"
    assert r["location_status"] == "LOCATION_UNCONFIRMED"
    report_id = r["report"]["id"]

    # Verify report is visible in unconfirmed queue
    queue_res = client.get("/api/intelligence/unconfirmed-reports")
    assert queue_res.status_code == 200
    queue = queue_res.json()
    matching = [q for q in queue if q["report_id"] == report_id]
    assert len(matching) == 1
    assert matching[0]["location_status"] == "LOCATION_UNCONFIRMED"

    # Operator corroborates coordinates
    corrob_res = client.post(f"/api/intelligence/corroborate/{report_id}", json={
        "latitude": 28.5714,
        "longitude": 77.2225,
        "address": "South Extension Part 2, Sector Service Road",
        "notes": "Field supervisor confirmed pipe fracture location."
    })
    assert corrob_res.status_code == 200
    assert corrob_res.json()["location_status"] == "CORROBORATED"

    # Confirm report updated
    check_rep = client.get(f"/api/reports/{report_id}")
    assert check_rep.status_code == 200
    assert check_rep.json()["location_status"] == "CORROBORATED"
    assert check_rep.json()["latitude"] == 28.5714

def test_v2_spatial_hotspots_and_multi_tier_escalation(client):
    """Verifies spatial hotspot computation and governance escalation."""
    # Seed multi-zone demo data
    client.post("/api/simulation/seed-demo-data")

    # Query hotspots
    hotspots_res = client.get("/api/intelligence/hotspots")
    assert hotspots_res.status_code == 200
    hotspots = hotspots_res.json()
    assert len(hotspots) >= 1
    hs = hotspots[0]
    assert "center_latitude" in hs
    assert "center_longitude" in hs
    assert hs["incident_count"] >= 3
    assert hs["severity_level"] in ["CRITICAL", "HIGH", "MEDIUM"]

    # Check multi-tier escalations list
    esc_res = client.get("/api/intelligence/escalations")
    assert esc_res.status_code == 200
    escalations = esc_res.json()
    assert len(escalations) >= 1
    tiers = {e["tier"] for e in escalations}
    assert any(t in [1, 2, 3] for t in tiers)

def test_v2_ai_chatbot_assistant_and_tools(client):
    """Verifies AI Operations Assistant tool calling and status endpoint."""
    # Status endpoint (zero key leaks)
    status_res = client.get("/api/chat/status")
    assert status_res.status_code == 200
    s = status_res.json()
    assert s["status"] == "ready"
    assert s["fallback_available"] is True
    assert "TRACK_INCIDENT" in s["supported_intents"]
    assert "OPERATIONAL_METRICS" in s["supported_intents"]

    # Ask for operational metrics
    chat_res = client.post("/api/chat", json={
        "message": "Show operational metrics and performance summary",
        "conversation_history": []
    })
    assert chat_res.status_code == 200
    c = chat_res.json()
    assert "CivicHelp Live Operational Intelligence" in c["reply"] or "Total Incidents" in c["reply"]
    assert len(c["suggested_actions"]) >= 1

    # Seed demo data so CIV-2026-9841 exists
    client.post("/api/simulation/seed-demo-data")

    # Ask for tracking an incident
    track_chat = client.post("/api/chat", json={
        "message": "What is the status of incident CIV-2026-9841?",
        "conversation_history": []
    })
    assert track_chat.status_code == 200
    tc = track_chat.json()
    assert "CIV-2026-9841" in tc["reply"]
    assert "Status" in tc["reply"]

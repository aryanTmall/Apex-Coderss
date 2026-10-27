import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_full_end_to_end_acceptance_scenario(client):
    """
    Executes the complete 18-step End-to-End Acceptance Scenario defined in Section 20:
    Citizen reports -> duplicate reports linked -> department assigned ->
    invalid closure rejected -> incident reopened -> priority increased ->
    SLA recalculated -> SLA escalation on time advance -> auditable recovery -> tracking check.
    """

    print("\n--- STEP 1 & 2: Health Check & System Readiness ---")
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

    print("--- STEP 3: Seed Demo Data ---")
    seed_res = client.post("/api/simulation/seed-demo-data")
    assert seed_res.status_code == 200
    assert "Successfully seeded" in seed_res.json()["message"]

    print("--- STEP 4: Citizen Report 1 (Canonical Pothole in Sector 18 Corridor) ---")
    # Coordinates in Sector 18 (>1.5 km from the market seed cases)
    pothole_lat = 28.6300
    pothole_lon = 77.2250

    rep1 = client.post("/api/reports", json={
        "description": "Hazardous road crater pothole near Sector 18 Express Highway exit with exposed steel rebar causing severe wheel damage.",
        "category": "pothole",
        "latitude": pothole_lat,
        "longitude": pothole_lon,
        "location_description": "Sector 18 Express Exit ramp",
        "reporter_name": "Citizen One"
    })
    assert rep1.status_code == 200
    d1 = rep1.json()
    canonical_id = d1["incident_id"]
    rep1_track = d1["report"]["tracking_id"]
    assert d1["is_duplicate"] is False
    assert d1["assigned_department_id"] == "dept_roads"
    assert d1["priority"] in [4, 5]

    print("--- STEP 5 & 6: Citizen Reports 2 & 3 (Nearby Reports - Duplicate Detection) ---")
    rep2 = client.post("/api/reports", json={
        "description": "Hazardous road crater pothole near Sector 18 Express Highway exit, steel rebar exposed. Dangerous for two-wheelers.",
        "category": "pothole",
        "latitude": pothole_lat + 0.00010,  # ~11 meters away
        "longitude": pothole_lon + 0.00008,
        "location_description": "Sector 18 Express Exit ramp near bridge",
        "reporter_name": "Citizen Two"
    })
    assert rep2.status_code == 200
    d2 = rep2.json()
    assert d2["is_duplicate"] is True
    assert d2["duplicate_action"] == "LINKED"
    assert d2["incident_id"] == canonical_id
    assert d2["duplicate_score"] >= 0.75

    rep3 = client.post("/api/reports", json={
        "description": "Severe road crater pothole at Sector 18 Express Highway exit ramp with exposed steel rebar.",
        "category": "pothole",
        "latitude": pothole_lat - 0.00012,  # ~13 meters away
        "longitude": pothole_lon + 0.00005,
        "location_description": "Sector 18 Express exit lane",
        "reporter_name": "Citizen Three"
    })
    assert rep3.status_code == 200
    d3 = rep3.json()
    assert d3["is_duplicate"] is True
    assert d3["duplicate_action"] == "LINKED"
    assert d3["incident_id"] == canonical_id
    assert d3["duplicate_score"] >= 0.75

    print("--- STEP 7: Confirm Canonical Incident Details ---")
    inc_res = client.get(f"/api/incidents/{canonical_id}")
    assert inc_res.status_code == 200
    inc_data = inc_res.json()
    assert inc_data["status"] == "ASSIGNED"
    assert inc_data["reports_count"] == 3
    assert len(inc_data["reports"]) == 3
    orig_priority = inc_data["priority"]

    print("--- STEP 8 & 9: Submit Bad Closure (~300m away) ---")
    bad_closure_res = client.post(f"/api/incidents/{canonical_id}/closure", json={
        "description": "Pothole filled with hot asphalt and resurfaced completely.",
        "photo_ref": "distant_proof.jpg",
        "latitude": pothole_lat + 0.0028,  # ~310m away
        "longitude": pothole_lon + 0.0019
    })
    assert bad_closure_res.status_code == 200
    cls_data = bad_closure_res.json()

    print("--- STEP 10: Verify Location Check Failed ---")
    assert cls_data["verdict"] == "REJECTED"
    assert cls_data["individual_checks"]["within_50m"]["status"] == "FAILED"
    assert "Geofence violation" in cls_data["individual_checks"]["within_50m"]["explanation"]

    print("--- STEP 11, 12, 13: Verify Case Reopened & Side Effects Applied ---")
    inc_after_cls = client.get(f"/api/incidents/{canonical_id}").json()
    assert inc_after_cls["status"] == "REOPENED"
    assert inc_after_cls["reopen_count"] == 1
    # Priority should be incremented (capped at 5)
    assert inc_after_cls["priority"] == min(5, orig_priority + 1)
    # SLA should be recalculated
    assert inc_after_cls["sla_due_at"] is not None

    print("--- STEP 14: Inspect Audit Events Timeline ---")
    evts_res = client.get(f"/api/incidents/{canonical_id}/events")
    assert evts_res.status_code == 200
    evts = evts_res.json()
    reopen_evt = next((e for e in evts if e["to_status"] == "REOPENED"), None)
    assert reopen_evt is not None
    assert "Closure verification rejected" in reopen_evt["reason"]

    print("--- STEP 15 & 16: Advance Simulation Time & SLA Escalation ---")
    # Advance time by 300 minutes (5 hours) to breach SLA deadline
    adv_res = client.post("/api/simulation/advance-time", json={"minutes": 300})
    assert adv_res.status_code == 200
    adv_data = adv_res.json()
    assert adv_data["escalated_count"] >= 1
    assert canonical_id in adv_data["escalated_incident_ids"]

    # Verify incident is now ESCALATED
    inc_after_adv = client.get(f"/api/incidents/{canonical_id}").json()
    assert inc_after_adv["status"] == "ESCALATED"
    assert inc_after_adv["escalation_count"] >= 1

    print("--- STEP 17: Verify Dashboard Metrics Reflect Persisted Changes ---")
    metrics_res = client.get("/api/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics["open_cases"] >= 1
    assert metrics["escalated_cases"] >= 1
    assert metrics["closure_rejection_rate_pct"] > 0

    print("--- STEP 18: Open Citizen Tracking and Confirm Correct Status ---")
    track_res = client.get(f"/api/track/{rep1_track}")
    assert track_res.status_code == 200
    trk = track_res.json()
    assert trk["incident_id"] == canonical_id
    assert trk["status"] == "ESCALATED"
    assert len(trk["timeline"]) >= 3

    print("\n>>> ALL 18 ACCEPTANCE STEPS PASSED WITH 100% SUCCESS! <<<\n")

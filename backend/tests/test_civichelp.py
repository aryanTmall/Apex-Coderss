import uuid
from datetime import timedelta
import pytest
from app.models.incident import Incident
from app.models.report import CitizenReport
from app.models.department import Department
from app.models.audit import AuditEvent
from app.services.classification import classifier
from app.services.duplicate_detection import duplicate_detector, haversine_distance
from app.services.state_machine import state_machine
from app.services.closure_verification import closure_verifier
from app.services.routing import router_service
from app.services.sla_monitor import sla_monitor
from app.services.intelligence import civic_intelligence
from app.services.sim_clock import sim_clock

BASE_LAT = 28.6139
BASE_LON = 77.2090

# 1. Application health endpoint
def test_01_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "CivicHelp"
    assert "simulated_utc_now" in data

# 2. Valid report submission
def test_02_valid_report_submission(client):
    payload = {
        "description": "Large trench pothole near Metro station entrance causing flat tires.",
        "category": "pothole",
        "latitude": BASE_LAT,
        "longitude": BASE_LON,
        "location_description": "Metro Station Gate 1",
        "reporter_name": "Aarav Gupta"
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["report"]["tracking_id"].startswith("REP-")
    assert data["incident_tracking_id"].startswith("CIV-")
    assert data["category"] == "pothole"
    assert data["is_duplicate"] is False
    assert data["assigned_department_id"] == "dept_roads"

# 3. Invalid report validation
def test_03_invalid_report_validation(client):
    # Description too short
    res = client.post("/api/reports", json={"description": "bad"})
    assert res.status_code == 422

    # Invalid latitude
    res2 = client.post("/api/reports", json={
        "description": "Valid pothole description here.",
        "latitude": 999.0
    })
    assert res2.status_code == 422

# 4. Deterministic fallback classification
def test_04_fallback_classification():
    text = "Massive water pipe burst gushing drinking water into the roadway."
    result = classifier.classify(text)
    assert result["category"] == "water_leak"
    assert result["suggested_department_id"] == "dept_water"
    assert result["priority"] in [4, 5]
    assert result["source"] == "FALLBACK"

# 5. Duplicate report linking (score >= 0.75)
def test_05_duplicate_report_linking(client):
    # First report
    p1 = {
        "description": "Deep asphalt pothole near Pillar 50 on Trunk Road.",
        "category": "pothole",
        "latitude": BASE_LAT,
        "longitude": BASE_LON,
        "reporter_name": "Reporter One"
    }
    res1 = client.post("/api/reports", json=p1)
    assert res1.status_code == 200
    inc_id = res1.json()["incident_id"]

    # Second report within 20 meters with matching text
    p2 = {
        "description": "Deep asphalt pothole right near Pillar 50 on Trunk Road.",
        "category": "pothole",
        "latitude": BASE_LAT + 0.00015,  # ~16 meters
        "longitude": BASE_LON + 0.00005,
        "reporter_name": "Reporter Two"
    }
    res2 = client.post("/api/reports", json=p2)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["is_duplicate"] is True
    assert data2["duplicate_action"] == "LINKED"
    assert data2["incident_id"] == inc_id
    assert data2["duplicate_score"] >= 0.75

# 6. Medium-confidence duplicate review (score 0.50 to 0.75)
def test_06_medium_confidence_duplicate_review(db):
    now = sim_clock.now()
    # Create existing incident
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Pothole: Main Street",
        description="Deep pothole on Main Street in front of the bakery.",
        category="pothole",
        priority=3,
        priority_reasons=["Normal maintenance"],
        status="ASSIGNED",
        latitude=BASE_LAT,
        longitude=BASE_LON,
        created_at=now
    )
    db.add(inc)
    db.commit()

    # Query with identical category and ~100 meters away (geo score ~0.4)
    # text similarity moderate
    dup_res = duplicate_detector.find_duplicate(
        db=db,
        text="A broken road pothole near the bakery on Main Street.",
        category="pothole",
        lat=BASE_LAT + 0.0009,  # ~100m away
        lon=BASE_LON + 0.0002
    )
    # Score should be between 0.50 and 0.85
    assert dup_res["action"] in ["ACTION_REVIEW", "ACTION_LINK"]
    assert dup_res["score"] >= 0.50

# 7. Non-duplicate incident creation (score < 0.50)
def test_07_non_duplicate_incident_creation(client):
    # First report
    p1 = {
        "description": "Garbage dump pile overflowing outside school gate.",
        "category": "garbage",
        "latitude": BASE_LAT,
        "longitude": BASE_LON
    }
    res1 = client.post("/api/reports", json=p1)
    assert res1.status_code == 200

    # Second report: completely different category and 2 km away
    p2 = {
        "description": "Streetlight pole broken and dark at industrial highway.",
        "category": "streetlight",
        "latitude": BASE_LAT + 0.02,  # > 2 km away
        "longitude": BASE_LON + 0.02
    }
    res2 = client.post("/api/reports", json=p2)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["is_duplicate"] is False
    assert data2["duplicate_action"] == "CREATED"
    assert data2["incident_id"] != res1.json()["incident_id"]

# 8. Missing-coordinate handling
def test_08_missing_coordinate_handling(client):
    payload = {
        "description": "Clogged storm drain with plastic bottles, street waterlogging.",
        "category": "drainage",
        "latitude": None,
        "longitude": None,
        "location_description": "Market backlane"
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["report"]["latitude"] is None
    assert data["category"] == "drainage"
    assert data["is_duplicate"] is False

# 9. Department routing
def test_09_department_routing(db):
    dept_id, rationale, was_fallback = router_service.route_incident(db, "pothole")
    assert dept_id == "dept_roads"
    assert was_fallback is False

    dept_id2, _, _ = router_service.route_incident(db, "water_leak")
    assert dept_id2 == "dept_water"

# 10. Department fallback
def test_10_department_fallback(db):
    dept = db.query(Department).filter(Department.id == "dept_roads").first()
    dept.available = False
    db.commit()

    dept_id, rationale, was_fallback = router_service.route_incident(db, "pothole")
    assert dept_id == "dept_sanitation"  # Configured fallback for roads
    assert was_fallback is True
    assert "unavailable" in rationale.lower()

    # Restore
    dept.available = True
    db.commit()

# 11. Legal state transitions
def test_11_legal_state_transitions(db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Pothole Test",
        description="Testing state transitions",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="NEW",
        created_at=now
    )
    db.add(inc)
    db.commit()

    # NEW -> ASSIGNED
    state_machine.transition(db, inc, "ASSIGNED", "AGENT:router", "Assigned to Roads")
    assert inc.status == "ASSIGNED"

    # ASSIGNED -> IN_PROGRESS
    state_machine.transition(db, inc, "IN_PROGRESS", "AGENT:field", "Crew on site")
    assert inc.status == "IN_PROGRESS"

    # IN_PROGRESS -> CLOSURE_SUBMITTED
    state_machine.transition(db, inc, "CLOSURE_SUBMITTED", "AGENT:field", "Work done")
    assert inc.status == "CLOSURE_SUBMITTED"

    # CLOSURE_SUBMITTED -> RESOLVED
    state_machine.transition(db, inc, "RESOLVED", "AGENT:verifier", "All checks passed")
    assert inc.status == "RESOLVED"
    assert inc.resolved_at is not None

# 12. Rejection of illegal state transitions
def test_12_rejection_of_illegal_state_transitions(db):
    from fastapi import HTTPException
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Illegal Transition Test",
        description="Testing illegal transition",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="NEW",
        created_at=now
    )
    db.add(inc)
    db.commit()

    # NEW -> RESOLVED is illegal
    with pytest.raises(HTTPException) as excinfo:
        state_machine.transition(db, inc, "RESOLVED", "HUMAN:test", "Illegal jump")
    assert excinfo.value.status_code == 400
    assert "Illegal state transition" in excinfo.value.detail

# 13. Successful closure verification (all 5 checks pass)
def test_13_successful_closure_verification(db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Pothole Near Plaza",
        description="Pothole on Main Plaza",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="ASSIGNED",
        latitude=BASE_LAT,
        longitude=BASE_LON,
        created_at=now - timedelta(hours=2),
        assigned_at=now - timedelta(hours=2)
    )
    db.add(inc)
    db.commit()

    closure, verdict = closure_verifier.verify_closure(
        db=db,
        incident=inc,
        description="Pothole completely filled and patched with hot-mix asphalt, road resurfaced.",
        photo_ref="pothole_fixed_verified.jpg",
        lat=BASE_LAT + 0.0001,  # ~11 meters away (within 50m)
        lon=BASE_LON + 0.0001,
        department_id="dept_roads"
    )
    assert verdict == "APPROVED"
    assert inc.status == "RESOLVED"
    assert closure.verdict == "APPROVED"
    assert closure.individual_checks["within_50m"]["status"] == "PASSED"
    assert closure.individual_checks["has_description_and_photo"]["status"] == "PASSED"
    assert closure.individual_checks["completion_keywords"]["status"] == "PASSED"

# 14. Failed location verification (closure > 50m)
def test_14_failed_location_verification(db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Pothole Distance Test",
        description="Pothole to verify distance check",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="ASSIGNED",
        latitude=BASE_LAT,
        longitude=BASE_LON,
        created_at=now - timedelta(hours=2),
        assigned_at=now - timedelta(hours=2)
    )
    db.add(inc)
    db.commit()

    # Coordinates 300 meters away
    bad_lat = BASE_LAT + 0.0027
    bad_lon = BASE_LON + 0.0018

    checks = closure_verifier.evaluate_checks(
        db=db,
        incident=inc,
        description="Pothole filled and patched properly.",
        photo_ref="photo.jpg",
        lat=bad_lat,
        lon=bad_lon,
        submitted_at=now
    )
    assert checks["within_50m"]["status"] == "FAILED"
    assert "Geofence violation" in checks["within_50m"]["explanation"]

# 15. Failed closure reopening
def test_15_failed_closure_reopening(db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Pothole Reopen Test",
        description="Pothole for reopening verification",
        category="pothole",
        priority=3,
        priority_reasons=["Normal priority"],
        status="ASSIGNED",
        latitude=BASE_LAT,
        longitude=BASE_LON,
        created_at=now - timedelta(hours=2),
        assigned_at=now - timedelta(hours=2)
    )
    db.add(inc)
    db.commit()

    closure, verdict = closure_verifier.verify_closure(
        db=db,
        incident=inc,
        description="Pothole filled and patched.",
        photo_ref="photo.jpg",
        lat=BASE_LAT + 0.0030,  # ~330m away
        lon=BASE_LON + 0.0020
    )
    assert verdict == "REJECTED"
    assert inc.status == "REOPENED"
    assert inc.reopen_count == 1
    assert closure.verdict == "REJECTED"

# 16. Priority increase with cap at 5
def test_16_priority_increase_cap(db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Priority Bump Test",
        description="Checking priority increment",
        category="pothole",
        priority=4,
        priority_reasons=[],
        status="CLOSURE_SUBMITTED",
        created_at=now
    )
    db.add(inc)
    db.commit()

    # Reopen once: P4 -> P5
    state_machine.reopen(db, inc, "AGENT:verifier", "Failed check")
    assert inc.priority == 5

    # Reopen again: P5 -> P5 (capped)
    state_machine.reopen(db, inc, "AGENT:verifier", "Failed check again")
    assert inc.priority == 5

# 17. SLA recalculation after reopening
def test_17_sla_recalculation_after_reopening(db):
    now = sim_clock.now()
    old_sla = now - timedelta(hours=5)
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="SLA Recalc Test",
        description="Checking SLA deadline refresh",
        category="pothole",
        priority=2,
        priority_reasons=[],
        status="CLOSURE_SUBMITTED",
        created_at=now - timedelta(days=2),
        sla_due_at=old_sla
    )
    db.add(inc)
    db.commit()

    state_machine.reopen(db, inc, "AGENT:verifier", "Failed verification")
    # Priority becomes 3 -> SLA is 24 hours from sim_clock.now()
    expected_sla = now + timedelta(hours=24)
    assert inc.sla_due_at is not None
    assert abs((inc.sla_due_at - expected_sla).total_seconds()) < 5

# 18. Audit event creation
def test_18_audit_event_creation(db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Audit Test",
        description="Testing audit log creation",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="NEW",
        created_at=now
    )
    db.add(inc)
    db.commit()

    state_machine.transition(db, inc, "ASSIGNED", "AGENT:router", "Routing to department", {"dept": "dept_roads"})
    db.commit()

    events = db.query(AuditEvent).filter(AuditEvent.incident_id == inc.id).all()
    assert len(events) == 1
    assert events[0].actor == "AGENT:router"
    assert events[0].from_status == "NEW"
    assert events[0].to_status == "ASSIGNED"

# 19. SLA escalation after time advancement
def test_19_sla_escalation_after_time_advancement(db):
    now = sim_clock.now()
    # Incident due in 60 minutes
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Escalation Test",
        description="Testing SLA escalation on time advance",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="ASSIGNED",
        created_at=now,
        assigned_at=now,
        sla_due_at=now + timedelta(minutes=60)
    )
    db.add(inc)
    db.commit()

    # Advance time by 90 minutes
    sim_clock.advance(90)
    escalated = sla_monitor.check_and_escalate(db)

    assert any(i.id == inc.id for i in escalated)
    assert inc.status == "ESCALATED"
    assert inc.escalation_count == 1

# 20. No escalation of resolved incidents
def test_20_no_escalation_of_resolved_incidents(db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Resolved Case SLA Test",
        description="Resolved incident should not escalate",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="RESOLVED",
        created_at=now - timedelta(days=5),
        sla_due_at=now - timedelta(days=4),
        resolved_at=now - timedelta(days=4, hours=2)
    )
    db.add(inc)
    db.commit()

    sim_clock.advance(120)
    escalated = sla_monitor.check_and_escalate(db)

    assert not any(i.id == inc.id for i in escalated)
    assert inc.status == "RESOLVED"

# 21. Manual review authorization and validation
def test_21_manual_review_workflow(client, db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Review Test",
        description="Manual supervisor review",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="NEEDS_REVIEW",
        created_at=now
    )
    db.add(inc)
    db.commit()

    # Approve
    res = client.post(f"/api/incidents/{inc.id}/review", json={
        "decision": "APPROVE",
        "note": "Field supervisor verified work on ground via call.",
        "reviewer_id": "supervisor_01"
    })
    assert res.status_code == 200
    assert res.json()["status"] == "RESOLVED"

# 22. Recurring-incident detection
def test_22_recurring_incident_detection(db):
    now = sim_clock.now()
    # Past resolved incident within 50m
    past = Incident(
        id=f"inc_past_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Past Resolved Pothole",
        description="Prior resolved pothole",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="RESOLVED",
        latitude=BASE_LAT,
        longitude=BASE_LON,
        created_at=now - timedelta(days=10),
        resolved_at=now - timedelta(days=9)
    )
    db.add(past)
    db.commit()

    # New incident 20m away
    new_inc = Incident(
        id=f"inc_new_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="New Pothole at Same Site",
        description="Asphalt opened up again",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="NEW",
        latitude=BASE_LAT + 0.00018,  # ~20m
        longitude=BASE_LON + 0.00005,
        created_at=now
    )
    db.add(new_inc)
    db.commit()

    rec_result = civic_intelligence.check_recurring(db, new_inc)
    assert rec_result["recurring"] is True
    assert past.id in rec_result["prior_ids"]

# 23. Root-cause hypothesis detection
def test_23_root_cause_hypothesis_detection(db):
    now = sim_clock.now()
    # 3 distinct incidents within 150m created within 7 days with multi-category
    inc1 = Incident(
        id=f"inc_rc_1_{uuid.uuid4().hex[:6]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Pipe Burst",
        description="Water main leak",
        category="water_leak",
        status="ASSIGNED",
        latitude=BASE_LAT,
        longitude=BASE_LON,
        created_at=now - timedelta(days=1)
    )
    inc2 = Incident(
        id=f"inc_rc_2_{uuid.uuid4().hex[:6]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Road Subsidence",
        description="Asphalt crater collapsing",
        category="pothole",
        status="ASSIGNED",
        latitude=BASE_LAT + 0.0005,  # ~55m away
        longitude=BASE_LON + 0.0003,
        created_at=now - timedelta(days=2)
    )
    inc3 = Incident(
        id=f"inc_rc_3_{uuid.uuid4().hex[:6]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Clogged Gutter",
        description="Drain backing up with muddy silt",
        category="drainage",
        status="ASSIGNED",
        latitude=BASE_LAT - 0.0004,  # ~45m away
        longitude=BASE_LON + 0.0002,
        created_at=now - timedelta(days=1)
    )
    db.add_all([inc1, inc2, inc3])
    db.commit()

    hypotheses = civic_intelligence.detect_root_causes(db)
    assert len(hypotheses) >= 1
    assert "Possible root-cause hypothesis" in hypotheses[0]["hypothesis"]
    assert hypotheses[0]["incident_count"] >= 3

# 24. Metrics computed from persisted records
def test_24_metrics_persisted_calculation(client):
    res = client.get("/api/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "total_reports" in data
    assert "canonical_incidents" in data
    assert "sla_compliance_pct" in data
    assert "closure_verdict_distribution" in data
    assert isinstance(data["total_reports"], int)

# 25. Tracking endpoint privacy and correctness
def test_25_tracking_endpoint(client, db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_trk_{uuid.uuid4().hex[:8]}",
        tracking_id="CIV-2026-TRK99",
        title="Public Streetlight Outage",
        description="Streetlight out on 5th Ave",
        category="streetlight",
        priority=3,
        priority_reasons=[],
        status="ASSIGNED",
        department_id="dept_streetlights",
        created_at=now,
        assigned_at=now,
        sla_due_at=now + timedelta(hours=24)
    )
    db.add(inc)

    rep = CitizenReport(
        id=f"rep_trk_{uuid.uuid4().hex[:8]}",
        tracking_id="REP-TRK99",
        incident_id=inc.id,
        reporter_name="Private Citizen Secret Name",
        text="Light is out",
        category="streetlight",
        created_at=now
    )
    db.add(rep)
    db.commit()

    # Track by report tracking ID
    res = client.get("/api/track/REP-TRK99")
    assert res.status_code == 200
    data = res.json()
    assert data["incident_tracking_id"] == "CIV-2026-TRK99"
    assert data["status"] == "ASSIGNED"
    assert data["department_name"] == "Streetlights"
    # Ensure private citizen name is NOT exposed in response payload
    assert "Private Citizen Secret Name" not in str(data)

# 26. Simulation reset confirmation
def test_26_simulation_reset(client):
    # Without confirm=True -> rejected
    res1 = client.post("/api/simulation/reset", json={"confirm": False})
    assert res1.status_code == 200
    assert res1.json()["reset_performed"] is False

    # With confirm=True -> reset performed
    res2 = client.post("/api/simulation/reset", json={"confirm": True})
    assert res2.status_code == 200
    assert res2.json()["reset_performed"] is True

# 27. Idempotency of reopening side effects
def test_27_reopening_idempotency(db):
    now = sim_clock.now()
    inc = Incident(
        id=f"inc_idem_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Idempotency Test",
        description="Testing safe reopening",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="CLOSURE_SUBMITTED",
        created_at=now
    )
    db.add(inc)
    db.commit()

    # Reopen
    state_machine.reopen(db, inc, "AGENT:verifier", "Check 1 failed")
    assert inc.status == "REOPENED"
    assert inc.reopen_count == 1
    assert inc.priority == 4

    # Subsequent valid state transition can proceed without corruption
    state_machine.transition(db, inc, "IN_PROGRESS", "AGENT:field", "Resuming work")
    assert inc.status == "IN_PROGRESS"
    assert inc.reopen_count == 1
    assert inc.priority == 4

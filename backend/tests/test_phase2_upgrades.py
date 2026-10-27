import uuid
from datetime import timedelta
from app.services.sim_clock import sim_clock
from app.models.incident import Incident
from app.models.department import Department
from app.models.audit import AuditEvent
from app.services.audit_service import audit_service
from app.services.closure_verification import closure_verifier

def test_area_complaint_density_endpoint(client, db):
    """Verifies the GET /api/incidents/density endpoint correctly counts active incidents within 150m."""
    base_lat = 28.6315
    base_lon = 77.2167

    # Add 2 nearby active incidents (~30m and ~60m away)
    inc1 = Incident(
        id=f"inc_dense_1_{uuid.uuid4().hex[:6]}",
        tracking_id=f"CIV-DENSE-1",
        title="Active Pothole Downtown",
        description="Hazardous crater in active traffic",
        category="pothole",
        priority=4,
        priority_reasons=["Traffic risk"],
        status="ASSIGNED",
        latitude=base_lat + 0.0002,
        longitude=base_lon + 0.0002,
        created_at=sim_clock.now()
    )
    inc2 = Incident(
        id=f"inc_dense_2_{uuid.uuid4().hex[:6]}",
        tracking_id=f"CIV-DENSE-2",
        title="Active Water Leak Downtown",
        description="Water main leaking onto street",
        category="water_leak",
        priority=3,
        priority_reasons=["Utility leak"],
        status="IN_PROGRESS",
        latitude=base_lat - 0.0003,
        longitude=base_lon + 0.0002,
        created_at=sim_clock.now()
    )
    db.add(inc1)
    db.add(inc2)
    db.commit()

    # Query density at base coordinates with default 150m radius
    res = client.get(f"/api/incidents/density?lat={base_lat}&lon={base_lon}&radius=150")
    assert res.status_code == 200
    data = res.json()
    assert data["density_count"] >= 2
    assert data["is_high_density"] is True
    assert "High-Density Zone Detected" in data["message"]
    assert len(data["active_incidents"]) >= 2

def test_tamper_evident_sha256_audit_chain(client, db):
    """Verifies that sequential audit events link via SHA-256 hashes."""
    inc_id = f"inc_audit_{uuid.uuid4().hex[:8]}"
    
    evt1 = audit_service.record_event(
        db=db,
        incident_id=inc_id,
        event_type="STATE_TRANSITION",
        actor="AGENT:test",
        action="TEST_ACTION_1",
        reason="Initial test event",
        from_status="NEW",
        to_status="ASSIGNED"
    )
    db.commit()
    assert evt1.event_hash is not None
    assert len(evt1.event_hash) == 16
    assert evt1.previous_hash is not None

    evt2 = audit_service.record_event(
        db=db,
        incident_id=inc_id,
        event_type="STATE_TRANSITION",
        actor="AGENT:test",
        action="TEST_ACTION_2",
        reason="Subsequent test event",
        from_status="ASSIGNED",
        to_status="IN_PROGRESS"
    )
    db.commit()
    assert evt2.previous_hash == evt1.event_hash
    assert evt2.event_hash != evt1.event_hash

def test_contractor_spoofing_penalty_and_audit(client, db):
    """Verifies that submitting closure outside 50m geofence penalizes department trust score and logs SPOOFING_GEOFENCE_BREACH."""
    now = sim_clock.now()
    dept = db.query(Department).filter(Department.id == "dept_roads").first()
    assert dept is not None
    initial_trust = dept.trust_score
    initial_spoofs = dept.spoofing_flags_count

    inc = Incident(
        id=f"inc_spoof_{uuid.uuid4().hex[:6]}",
        tracking_id=f"CIV-SPOOF-01",
        title="Road pothole for spoofing test",
        description="Road crater needing repair",
        category="pothole",
        priority=3,
        priority_reasons=[],
        status="ASSIGNED",
        latitude=28.6315,
        longitude=77.2167,
        department_id="dept_roads",
        created_at=now - timedelta(hours=3),
        assigned_at=now - timedelta(hours=2),
        sla_due_at=now + timedelta(hours=20)
    )
    db.add(inc)
    db.commit()

    # Contractor submits closure 350m away
    bad_lat = 28.6315 + 0.0032
    bad_lon = 77.2167 + 0.0025
    closure, verdict = closure_verifier.verify_closure(
        db=db,
        incident=inc,
        description="Patched pothole with asphalt and sealed road completely.",
        photo_ref="proof_far_away.jpg",
        lat=bad_lat,
        lon=bad_lon,
        department_id="dept_roads"
    )
    assert verdict == "REJECTED"
    assert inc.status == "REOPENED"

    # Verify trust score deducted by 15 points
    db.refresh(dept)
    assert dept.trust_score == max(10, initial_trust - 15)
    assert dept.spoofing_flags_count == initial_spoofs + 1

    # Verify SPOOFING_GEOFENCE_BREACH event logged
    spoof_evt = db.query(AuditEvent).filter(
        AuditEvent.incident_id == inc.id,
        AuditEvent.action == "SPOOFING_GEOFENCE_BREACH"
    ).first()
    assert spoof_evt is not None
    assert "Contractor spoofing detected" in spoof_evt.reason
    assert spoof_evt.event_hash is not None

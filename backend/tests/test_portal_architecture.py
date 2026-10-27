import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.incident import Incident
from app.models.contractor import Contractor
from app.models.user import User
from app.services.auth_service import create_access_token

client = TestClient(app)


@pytest.fixture
def auth_tokens():
    db = SessionLocal()
    try:
        # Create or fetch auditor user
        auditor = db.query(User).filter(User.role == "WHISTLEBLOWER_AUDITOR").first()
        admin = db.query(User).filter(User.role == "ADMIN").first()
        officer = db.query(User).filter(User.role == "FIELD_OFFICER").first()
        citizen = db.query(User).filter(User.role == "CITIZEN").first()

        auditor_token = create_access_token({"sub": auditor.id, "role": auditor.role}) if auditor else ""
        admin_token = create_access_token({"sub": admin.id, "role": admin.role}) if admin else ""
        officer_token = create_access_token({"sub": officer.id, "role": officer.role}) if officer else ""
        citizen_token = create_access_token({"sub": citizen.id, "role": citizen.role}) if citizen else ""

        return {
            "auditor": auditor_token,
            "admin": admin_token,
            "officer": officer_token,
            "citizen": citizen_token
        }
    finally:
        db.close()


def test_public_endpoints_accessible_without_auth():
    """Verify all public Citizen Hub endpoints return 200 without requiring auth tokens."""
    # 1. Public intelligence feed
    r1 = client.get("/api/news/articles")
    assert r1.status_code == 200
    assert isinstance(r1.json(), list)

    # 2. Public municipal funds summary
    r2 = client.get("/api/funds/summary")
    assert r2.status_code == 200
    assert "total_approved_budget" in r2.json()

    # 3. Public community proposals
    r3 = client.get("/api/participation/proposals")
    assert r3.status_code == 200

    # 4. Public rewards catalog
    r4 = client.get("/api/rewards/catalog")
    assert r4.status_code == 200

    # 5. Public emergency stations
    r5 = client.get("/api/emergency/stations")
    assert r5.status_code == 200


def test_government_operational_feed_auth_enforcement(auth_tokens):
    """Verify Government Operational Feed rejects unauthenticated and non-gov requests."""
    # Unauthenticated -> 401
    r_unauth = client.get("/api/intelligence/operational-feed")
    assert r_unauth.status_code == 401

    # Citizen token -> 403 Forbidden
    if auth_tokens["citizen"]:
        r_citizen = client.get(
            "/api/intelligence/operational-feed",
            headers={"Authorization": f"Bearer {auth_tokens['citizen']}"}
        )
        assert r_citizen.status_code == 403

    # Government officer -> 200 OK
    r_gov = client.get(
        "/api/intelligence/operational-feed",
        headers={"Authorization": f"Bearer {auth_tokens['officer']}"}
    )
    assert r_gov.status_code == 200
    assert isinstance(r_gov.json(), list)


def test_government_operational_feed_generation_and_acknowledgment(auth_tokens):
    """Verify operational feed dynamically generates events and supports acknowledgment."""
    db = SessionLocal()
    test_inc_id = "INC-TEST-FEED-01"
    try:
        # Clean any prior run artifacts
        from app.models.operational_alert import OperationalAlertAcknowledgment
        db.query(OperationalAlertAcknowledgment).filter(OperationalAlertAcknowledgment.id.like("%TEST-FEED%")).delete()
        db.query(Incident).filter(Incident.id == test_inc_id).delete()
        db.commit()

        # Create an incident with breached SLA
        now = datetime.now(timezone.utc)
        past_sla = now - timedelta(hours=5)

        inc = Incident(
            id=test_inc_id,
            tracking_id="CIV-FEED-001",
            title="Critical Sewerage Backflow on Trunk Line",
            description="High volume sewage backup posing immediate health hazard.",
            category="DRAINAGE",
            priority=5,
            priority_reasons=["Immediate public health threat"],
            status="ASSIGNED",
            department_id="DEP-WATER",
            created_at=past_sla - timedelta(hours=2),
            sla_due_at=past_sla,
            reopen_count=0,
            reports_count=1
        )
        db.add(inc)
        db.commit()

        # Query operational feed as officer
        r = client.get(
            "/api/intelligence/operational-feed",
            headers={"Authorization": f"Bearer {auth_tokens['officer']}"}
        )
        assert r.status_code == 200
        feed = r.json()
        assert len(feed) > 0

        # Look for the overdue alert
        target_alert = next((a for a in feed if a["incident_id"] == test_inc_id), None)
        assert target_alert is not None
        assert target_alert["event_type"] == "OVERDUE_SLA"
        assert target_alert["severity"] == "CRITICAL"
        assert target_alert["status"] == "PENDING_ACTION"
        assert "ESCALATE_TIER" in target_alert["permitted_action"]

        # Acknowledge the alert
        alert_id = target_alert["id"]
        ack_res = client.post(
            f"/api/intelligence/operational-feed/{alert_id}/acknowledge",
            json={"status": "ACKNOWLEDGED", "resolution_notes": "Supervisor notified for immediate action."},
            headers={"Authorization": f"Bearer {auth_tokens['officer']}"}
        )
        assert ack_res.status_code == 200
        assert ack_res.json()["status"] == "ACKNOWLEDGED"

        # Verify alert now reflects ACKNOWLEDGED status
        r2 = client.get(
            "/api/intelligence/operational-feed?status=ACKNOWLEDGED",
            headers={"Authorization": f"Bearer {auth_tokens['officer']}"}
        )
        assert r2.status_code == 200
        updated_alert = next((a for a in r2.json() if a["id"] == alert_id), None)
        assert updated_alert is not None
        assert updated_alert["status"] == "ACKNOWLEDGED"

    finally:
        # Cleanup
        to_del = db.query(Incident).filter(Incident.id == test_inc_id).first()
        if to_del:
            db.delete(to_del)
        from app.models.operational_alert import OperationalAlertAcknowledgment
        db.query(OperationalAlertAcknowledgment).filter(OperationalAlertAcknowledgment.id.like("%TEST-FEED%")).delete()
        db.commit()
        db.close()


def test_whistleblower_data_isolation_and_rbac(auth_tokens):
    """Verify confidential whistleblower cases are isolated from regular government staff."""
    # 1. Non-auditor officer gets 403 Forbidden
    r_officer = client.get(
        "/api/whistleblower/cases",
        headers={"Authorization": f"Bearer {auth_tokens['officer']}"}
    )
    assert r_officer.status_code == 403

    # 2. Authorized auditor gets 200 OK
    r_auditor = client.get(
        "/api/whistleblower/cases",
        headers={"Authorization": f"Bearer {auth_tokens['auditor']}"}
    )
    assert r_auditor.status_code == 200
    assert isinstance(r_auditor.json(), list)


def test_public_data_sanitization():
    """Verify citizen PII is never exposed on public endpoints."""
    # Leaderboard must mask citizen identities
    r_leaderboard = client.get("/api/rewards/leaderboard")
    assert r_leaderboard.status_code == 200
    entries = r_leaderboard.json()
    for entry in entries:
        assert "phone" not in entry
        assert "email" not in entry
        assert "password" not in entry
        # Display name or pseudonymous id only
        assert "display_name" in entry or "citizen_identifier" in entry

import pytest
from starlette.testclient import TestClient
from app.services.auth_service import hash_password, verify_password, create_access_token, decode_access_token
from app.models.user import User
from app.models.emergency import EmergencyResource
from app.models.news import NewsArticle
from app.models.incident import Incident
from app.models.report import CitizenReport

def test_auth_password_hashing():
    """Verifies cryptographic PBKDF2-HMAC-SHA256 password hashing and validation."""
    pwd = "SecureMunicipal2026!#"
    hashed, salt = hash_password(pwd)
    assert len(hashed) == 64
    assert len(salt) == 32
    assert verify_password(pwd, hashed, salt) is True
    assert verify_password("WrongPassword!", hashed, salt) is False

def test_auth_jwt_tokens():
    """Verifies JWT token encoding, decoding, and expiration."""
    data = {"sub": "USR-TEST-01", "role": "ADMIN", "email": "admin@civichelp.gov.in"}
    token = create_access_token(data)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "USR-TEST-01"
    assert decoded["role"] == "ADMIN"

def test_auth_api_login_success(client: TestClient):
    """Tests successful government login returning JWT Bearer token."""
    res = client.post("/api/auth/login", json={
        "email": "admin@civichelp.gov.in",
        "password": "CivicHelp@Admin2026!"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["email"] == "admin@civichelp.gov.in"

def test_auth_api_login_invalid_credentials(client: TestClient):
    """Verifies that invalid passwords or non-existent accounts receive 401 Unauthorized."""
    res = client.post("/api/auth/login", json={
        "email": "admin@civichelp.gov.in",
        "password": "IncorrectPassword123"
    })
    assert res.status_code == 401
    assert "Invalid municipal credentials" in res.json()["detail"]

def test_auth_api_profile_and_logout(client: TestClient):
    """Verifies /api/auth/me returns authenticated profile and logout confirmation."""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@civichelp.gov.in",
        "password": "CivicHelp@Admin2026!"
    })
    token = login_res.json()["access_token"]
    
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "admin@civichelp.gov.in"
    
    # Missing token gives 401
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401

    logout_res = client.post("/api/auth/logout")
    assert logout_res.status_code == 200

def test_emergency_services_directory(client: TestClient):
    """Verifies public emergency services endpoint provides verified national & municipal hotlines without login."""
    res = client.get("/api/emergency")
    assert res.status_code == 200
    services = res.json()
    assert len(services) >= 7
    
    phones = [s["phone_number"] for s in services]
    assert "112" in phones  # National Emergency
    assert "100" in phones  # Police
    assert "101" in phones  # Fire
    assert "108" in phones or "102" in phones  # Ambulance

    for s in services:
        assert s["verification_status"] == "OFFICIALLY_VERIFIED"
        assert s["source_url"].startswith("http")
        assert s["available_hours"] == "24 Hours / 7 Days"

def test_emergency_services_category_filtering(client: TestClient):
    """Verifies category filtering on emergency directory."""
    res = client.get("/api/emergency?category=POLICE")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    for it in items:
        assert it["category"] == "POLICE"

def test_news_public_intelligence_feed(client: TestClient):
    """Verifies public intelligence news feed with geographic scopes."""
    res = client.get("/api/news")
    assert res.status_code == 200
    articles = res.json()
    assert len(articles) >= 8

    scopes = {a["geographic_scope"] for a in articles}
    assert "LOCAL" in scopes
    assert "CITY" in scopes
    assert "STATE" in scopes
    assert "NATIONAL" in scopes
    assert "GLOBAL" in scopes

    for a in articles:
        assert len(a["title"]) > 10
        assert a["source_url"].startswith("http")
        assert a["is_live"] is True

def test_news_scope_filtering(client: TestClient):
    """Verifies filtering public intelligence by geographic scope."""
    res = client.get("/api/news?scope=CITY")
    assert res.status_code == 200
    city_articles = res.json()
    assert len(city_articles) >= 2
    for art in city_articles:
        assert art["geographic_scope"] == "CITY"

def test_pdf_report_summary_generation(client: TestClient):
    """Verifies server-side PDF generation for citizen report summaries."""
    # Submit report to obtain tracking ID
    rep_res = client.post("/api/reports", json={
        "description": "Critical asphalt pothole on Expressway underpass causing severe tire damage.",
        "category": "pothole",
        "location_mode": "PRECISE",
        "latitude": 28.6315,
        "longitude": 77.2167,
        "address": "Expressway Underpass, Connaught Place",
        "reporter_name": "Dev Test Citizen"
    })
    assert rep_res.status_code == 200
    report_data = rep_res.json()
    report_id = report_data["report"]["id"]
    tracking_id = report_data["report"]["tracking_id"]

    # 1. Download via /api/reports/{id}/summary.pdf
    pdf_res = client.get(f"/api/reports/{report_id}/summary.pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in pdf_res.headers["content-disposition"]
    assert pdf_res.content[:4] == b"%PDF" # Valid PDF magic header
    assert len(pdf_res.content) > 1000

    # 2. Download via /api/track/{tracking_id}/summary.pdf
    track_pdf_res = client.get(f"/api/track/{tracking_id}/summary.pdf")
    assert track_pdf_res.status_code == 200
    assert track_pdf_res.headers["content-type"] == "application/pdf"
    assert track_pdf_res.content[:4] == b"%PDF"

def test_pdf_unconfirmed_location_warning(client: TestClient):
    """Verifies PDF generation gracefully renders unconfirmed-location reports with warning badge."""
    rep_res = client.post("/api/reports", json={
        "description": "Report submitted after leaving site. Water pipe burst observed near market gate.",
        "category": "water_leak",
        "location_mode": "UNCONFIRMED",
        "approximate_locality": "Karol Bagh Central Market",
        "reporter_name": "Transit Citizen"
    })
    assert rep_res.status_code == 200
    report_id = rep_res.json()["report"]["id"]

    pdf_res = client.get(f"/api/reports/{report_id}/summary.pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.content[:4] == b"%PDF"

def test_synthetic_demo_450_records_seeding(client: TestClient):
    """Verifies seeding 450 synthetic demo records through simulation endpoint."""
    res = client.post("/api/simulation/seed-demo-450?count=450&seed=42")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["incidents_seeded"] == 450
    assert data["reports_seeded"] >= 450
    assert data["categories_covered"] == 14
    assert data["dataset_marker"] == "DEMO"

    # Verify incidents count via /api/incidents
    inc_res = client.get("/api/incidents?is_demo=true&limit=500")
    assert inc_res.status_code == 200
    inc_list = inc_res.json()
    assert len(inc_list) == 450

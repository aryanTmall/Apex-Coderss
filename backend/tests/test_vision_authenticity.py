import io
import uuid
import base64
from datetime import timedelta
import pytest
from PIL import Image, PngImagePlugin
from app.models.incident import Incident
from app.models.department import Department
from app.models.audit import AuditEvent
from app.services.closure_verification import closure_verifier
from app.services.sim_clock import sim_clock

BASE_LAT = 28.6139
BASE_LON = 77.2090

def create_synthetic_png_bytes(prompt: str = "A deep asphalt pothole, Midjourney v6 photorealistic") -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (300, 300), color=(128, 128, 128))
    png_info = PngImagePlugin.PngInfo()
    png_info.add_text("parameters", prompt)
    img.save(buf, format="PNG", pnginfo=png_info)
    return buf.getvalue()

def test_citizen_report_ai_filename_strictly_rejected(client):
    """Verifies citizen report submission with AI keywords in photo_ref is rejected with HTTP 422."""
    payload = {
        "description": "Hazardous road crater on Outer Ring Road near flyover.",
        "category": "pothole",
        "latitude": BASE_LAT,
        "longitude": BASE_LON,
        "photo_ref": "dall_e_pothole_simulation.png",
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 422
    data = res.json()
    assert "Synthetic / AI-Generated Image Rejected" in data["detail"]
    assert "dall_e" in data["detail"]

def test_citizen_report_ai_embedded_metadata_strictly_rejected(client):
    """Verifies citizen report with embedded AI generation metadata in image is rejected with HTTP 422."""
    raw_bytes = create_synthetic_png_bytes("pothole in street, Stable Diffusion XL model")
    b64_data = "data:image/png;base64," + base64.b64encode(raw_bytes).decode("ascii")

    payload = {
        "description": "Deep trench on road shoulder causing vehicle damage.",
        "category": "pothole",
        "latitude": BASE_LAT,
        "longitude": BASE_LON,
        "photo_ref": "site_photo.png",
        "photo_data": b64_data
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 422
    data = res.json()
    assert "Synthetic / AI-Generated Image Rejected" in data["detail"]

def test_citizen_report_authentic_photo_accepted(client):
    """Verifies authentic real-world camera capture passes verification."""
    buf = io.BytesIO()
    img = Image.new("RGB", (640, 480), color=(100, 100, 100))
    img.save(buf, format="JPEG")
    b64_data = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    payload = {
        "description": "Authentic on-site physical camera capture of pothole.",
        "category": "pothole",
        "latitude": BASE_LAT,
        "longitude": BASE_LON,
        "photo_ref": "IMG_20261029_140211.jpg",
        "photo_data": b64_data
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["incident_id"] is not None

def test_contractor_closure_ai_photo_rejection_and_fraud_penalty(db):
    """
    Verifies that contractor closure submission with an AI-generated photo
    is strictly rejected (check #6 FAILED), reopening the incident and slashing contractor trust score.
    """
    now = sim_clock.now()

    # Create active department
    dept = db.query(Department).filter(Department.id == "dept_roads_test").first()
    if not dept:
        dept = Department(
            id="dept_roads_test",
            name="Roads & Bridges Test Division",
            trust_score=90,
            spoofing_flags_count=0
        )
        db.add(dept)
        db.commit()
    else:
        dept.trust_score = 90
        dept.spoofing_flags_count = 0
        db.commit()

    inc = Incident(
        id=f"inc_{uuid.uuid4().hex[:8]}",
        tracking_id=f"CIV-{uuid.uuid4().hex[:4]}",
        title="Major Crater Repair Work Order",
        description="Pothole on Ring Road",
        category="pothole",
        priority=2,
        priority_reasons=[],
        status="ASSIGNED",
        department_id="dept_roads_test",
        latitude=BASE_LAT,
        longitude=BASE_LON,
        created_at=now - timedelta(hours=3),
        assigned_at=now - timedelta(hours=2)
    )
    db.add(inc)
    db.commit()

    # Contractor attempts to submit synthetic DALL-E photo as completion proof
    closure, verdict = closure_verifier.verify_closure(
        db=db,
        incident=inc,
        description="Pothole filled and patched with bitumen asphalt.",
        photo_ref="midjourney_fixed_pothole_resolution.png",
        lat=BASE_LAT + 0.0001,
        lon=BASE_LON + 0.0001,
        department_id="dept_roads_test"
    )

    assert verdict == "REJECTED"
    assert closure.verdict == "REJECTED"
    assert "ai_authenticity_check" in closure.individual_checks
    assert closure.individual_checks["ai_authenticity_check"]["status"] == "FAILED"
    assert inc.status == "REOPENED"

    # Verify anti-fraud penalty
    db.refresh(dept)
    assert dept.trust_score == 65  # 90 - 25 penalty
    assert dept.spoofing_flags_count >= 1

    # Verify fraud audit event logged
    fraud_event = db.query(AuditEvent).filter(
        AuditEvent.incident_id == inc.id,
        AuditEvent.action == "SYNTHETIC_AI_IMAGE_FRAUD"
    ).first()
    assert fraud_event is not None
    assert "Fraudulent closure attempt" in fraud_event.reason

def test_attachment_upload_ai_image_strictly_rejected(client):
    """Verifies that direct attachment upload endpoint /attachments/upload rejects AI photos."""
    raw_bytes = create_synthetic_png_bytes("flooded road, ComfyUI SDXL checkpoint")
    files = {
        "file": ("flux_comfyui_flooded_road.png", raw_bytes, "image/png")
    }
    res = client.post("/api/attachments", files=files)
    assert res.status_code == 422
    data = res.json()
    assert "Synthetic / AI-Generated Image Rejected" in data["detail"]

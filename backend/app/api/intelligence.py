from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.models.escalation import EscalationRecord
from app.models.user import User
from app.api.deps import require_government_user, get_current_user_optional
from app.schemas.hotspot import HotspotResponse
from app.schemas.escalation import EscalationResponse
from app.services.intelligence import civic_intelligence
from app.services.operational_feed_service import generate_operational_feed, acknowledge_alert

router = APIRouter(prefix="/intelligence", tags=["Intelligence, Hotspots & Governance"])


class AlertAcknowledgeRequest(BaseModel):
    status: str = "ACKNOWLEDGED"  # ACKNOWLEDGED, RESOLVED
    resolution_notes: Optional[str] = None


@router.get("/operational-feed", response_model=List[Dict[str, Any]])
def get_government_operational_feed(
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, INFO"),
    department_id: Optional[str] = Query(None),
    ward_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None, description="OVERDUE_SLA, SLA_APPROACHING, URGENT_UNASSIGNED, FAILED_CLOSURE, SPATIAL_HOTSPOT, CONTRACTOR_ANOMALY"),
    status: Optional[str] = Query(None, description="PENDING_ACTION, ACKNOWLEDGED, RESOLVED"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_government_user)
):
    """
    Government Intelligence Feed:
    Action-oriented operational events generated from actual backend records and audited state changes.
    Enforces strict access control: Government authorized roles only.
    Excludes citizen PII and confidential whistleblower records.
    """
    return generate_operational_feed(
        db=db,
        severity=severity,
        department_id=department_id,
        ward_id=ward_id,
        event_type=event_type,
        status_filter=status,
        limit=limit
    )


@router.post("/operational-feed/{alert_id}/acknowledge")
def acknowledge_operational_alert_endpoint(
    alert_id: str,
    payload: AlertAcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_government_user)
):
    """
    Acknowledge or resolve an operational intelligence alert.
    Prevents duplicate warnings and maintains operator audit attribution.
    """
    return acknowledge_alert(
        db=db,
        alert_id=alert_id,
        user_id=current_user.id,
        resolution_notes=payload.resolution_notes,
        status=payload.status
    )


@router.get("/recurring")
def get_recurring_incidents(db: Session = Depends(get_db)):
    """Returns all incidents flagged with recurrence in the previous 30 days."""
    recurring_cases = db.query(Incident).filter(Incident.recurring_flag == True).all()

    results = []
    for inc in recurring_cases:
        results.append({
            "incident_id": inc.id,
            "tracking_id": inc.tracking_id,
            "title": inc.title,
            "category": inc.category,
            "priority": inc.priority,
            "status": inc.status,
            "location_description": inc.location_description,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "reopen_count": inc.reopen_count,
            "created_at": inc.created_at.isoformat(),
            "prior_incident_ids": inc.root_cause_evidence_ids or []
        })
    return results

@router.get("/root-causes")
def get_root_cause_hypotheses(db: Session = Depends(get_db)):
    """
    Detects neighborhood-level systemic hypotheses:
    Clusters of >= 3 incidents within 150m created within 7 days across multiple categories.
    """
    hypotheses = civic_intelligence.detect_root_causes(db)
    return hypotheses

@router.get("/hotspots", response_model=List[HotspotResponse])
def get_active_hotspots(db: Session = Depends(get_db)):
    """
    Computes and returns spatial hotspot clusters (>=3 incidents within 150m in 7 days).
    """
    hotspots = civic_intelligence.sync_hotspots(db)
    return [HotspotResponse.model_validate(h) for h in hotspots]

@router.get("/unconfirmed-reports")
def get_unconfirmed_reports(db: Session = Depends(get_db)):
    """
    Returns unconfirmed location reports waiting in the operator triage queue.
    """
    return civic_intelligence.get_unconfirmed_reports(db)

@router.post("/corroborate/{report_id}")
def corroborate_report_location(
    report_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Allows a dispatcher or field inspector to corroborate coordinates for an unconfirmed report.
    """
    lat = payload.get("latitude")
    lon = payload.get("longitude")
    address = payload.get("address", "Corroborated by field dispatch")
    notes = payload.get("notes")

    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required to corroborate location.")

    try:
        res = civic_intelligence.corroborate_unconfirmed_report(
            db=db,
            report_id=report_id,
            latitude=float(lat),
            longitude=float(lon),
            address=str(address),
            operator_notes=notes
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/escalations", response_model=List[EscalationResponse])
def get_all_escalations(db: Session = Depends(get_db)):
    """
    Returns multi-tier governance escalation records (Supervisor, Ward Authority, Commissioner).
    """
    recs = db.query(EscalationRecord).order_by(EscalationRecord.triggered_at.desc()).all()
    return [EscalationResponse.model_validate(r) for r in recs]

@router.post("/escalate/{incident_id}", response_model=EscalationResponse)
def trigger_incident_escalation(
    incident_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Manually triggers or advances an incident's governance escalation tier (1, 2, or 3).
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    tier = payload.get("tier", min(3, incident.escalation_tier + 1))
    reason = payload.get("reason", "Operator escalated to next governance tier.")
    actor = payload.get("actor", "OPERATOR:escalation")

    rec = civic_intelligence.escalate_tier(
        db=db,
        incident=incident,
        tier=tier,
        reason=reason,
        actor=actor
    )
    return EscalationResponse.model_validate(rec)

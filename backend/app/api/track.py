from datetime import timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.models.report import CitizenReport
from app.models.department import Department
from app.models.audit import AuditEvent
from app.services.sim_clock import sim_clock

router = APIRouter(prefix="/track", tags=["Tracking"])

def to_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

@router.get("/{tracking_id}")
def track_resolution(tracking_id: str, db: Session = Depends(get_db)):
    """
    Public tracking endpoint for citizens.
    Accepts either Report tracking_id (REP-...) or Incident tracking_id (CIV-...).
    Returns sanitized public timeline, SLA status, department, and verification results.
    """
    clean_id = tracking_id.strip()

    # 1. Check CitizenReport
    report = db.query(CitizenReport).filter(CitizenReport.tracking_id == clean_id).first()
    incident = None

    if report:
        if report.incident_id:
            incident = db.query(Incident).filter(Incident.id == report.incident_id).first()
    else:
        # Check Incident tracking_id or ID directly
        incident = db.query(Incident).filter(
            (Incident.tracking_id == clean_id) | (Incident.id == clean_id)
        ).first()
        if incident:
            report = db.query(CitizenReport).filter(CitizenReport.incident_id == incident.id).first()

    if not incident and not report:
        raise HTTPException(
            status_code=404,
            detail=f"Tracking identifier '{clean_id}' was not found in municipal records."
        )

    # Department details
    dept_name = "Assigned Municipal Team"
    if incident and incident.department_id:
        dept = db.query(Department).filter(Department.id == incident.department_id).first()
        if dept:
            dept_name = dept.name

    # SLA evaluation
    now = sim_clock.now()
    sla_status = "UNKNOWN"
    if incident:
        if incident.status == "RESOLVED":
            sla_status = "RESOLVED"
        elif incident.sla_due_at:
            due_utc = to_utc(incident.sla_due_at)
            if now > due_utc:
                sla_status = "BREACHED"
            elif (due_utc - now).total_seconds() < 7200:  # < 2 hours
                sla_status = "AT_RISK"
            else:
                sla_status = "HEALTHY"

    # Sanitized timeline events
    timeline = []
    if incident:
        events = db.query(AuditEvent).filter(
            AuditEvent.incident_id == incident.id
        ).order_by(AuditEvent.timestamp.asc()).all()

        for ev in events:
            timeline.append({
                "timestamp": to_utc(ev.timestamp).isoformat() if ev.timestamp else "",
                "action": ev.action,
                "actor_type": ev.actor.split(":")[0] if ":" in ev.actor else "SYSTEM",
                "summary": ev.reason,
                "from_status": ev.from_status,
                "to_status": ev.to_status
            })

    is_duplicate = bool(report and report.duplicate_score and report.duplicate_score >= 0.75)

    return {
        "tracking_id": clean_id,
        "incident_id": incident.id if incident else None,
        "incident_tracking_id": incident.tracking_id if incident else None,
        "title": incident.title if incident else "Citizen Report",
        "category": incident.category if incident else (report.category if report else "general"),
        "status": incident.status if incident else "PENDING_TRIAGE",
        "priority": incident.priority if incident else 3,
        "department_name": dept_name,
        "created_at": to_utc(report.created_at if report else incident.created_at).isoformat(),
        "sla_due_at": to_utc(incident.sla_due_at).isoformat() if (incident and incident.sla_due_at) else None,
        "sla_status": sla_status,
        "reopen_count": incident.reopen_count if incident else 0,
        "escalation_count": incident.escalation_count if incident else 0,
        "is_linked_duplicate": is_duplicate,
        "duplicate_explanation": report.duplicate_rationale if is_duplicate else None,
        "location_description": incident.location_description if incident else (report.location_description if report else None),
        "timeline": timeline
    }

@router.get("/{tracking_id}/summary.pdf")
def download_tracking_pdf(tracking_id: str, db: Session = Depends(get_db)):
    """Downloads official municipal PDF report summary via tracking ID."""
    from fastapi.responses import Response
    from app.services.pdf_service import generate_report_pdf

    clean_id = tracking_id.strip()
    report = db.query(CitizenReport).filter(CitizenReport.tracking_id == clean_id).first()
    incident = None

    if not report:
        # Check by incident tracking id or id
        incident = db.query(Incident).filter(
            (Incident.tracking_id == clean_id) | (Incident.id == clean_id)
        ).first()
        if incident and incident.reports:
            report = incident.reports[0]

    if not report:
        raise HTTPException(status_code=404, detail="No report found matching this tracking identifier.")

    if not incident and report.incident_id:
        incident = db.query(Incident).filter(Incident.id == report.incident_id).first()

    pdf_bytes = generate_report_pdf(report, incident)
    filename = f"CivicHelp_{clean_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

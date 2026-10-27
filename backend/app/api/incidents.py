from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.models.report import CitizenReport
from app.models.closure import ClosureSubmission
from app.models.audit import AuditEvent
from app.models.department import Department
from app.schemas.incident import (
    IncidentResponse,
    IncidentDetailResponse,
    IncidentAssignRequest,
    DensityResponse,
    DensityIncidentSummary,
)
from app.schemas.report import ReportResponse
from app.schemas.closure import (
    ClosureSubmitRequest,
    ClosureResponse,
    IncidentReviewRequest,
)
from app.schemas.audit import AuditEventResponse
from app.services.state_machine import state_machine
from app.services.closure_verification import closure_verifier
from app.services.routing import router_service
from app.services.duplicate_detection import haversine_distance
from app.services.sim_clock import sim_clock

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status: Optional[str] = None,
    category: Optional[str] = None,
    department_id: Optional[str] = None,
    search: Optional[str] = None,
    priority: Optional[int] = None,
    has_coords: Optional[bool] = None,
    is_demo: Optional[bool] = None,
    dataset: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)

    if is_demo is not None:
        query = query.filter(Incident.is_demo == is_demo)
    if dataset:
        query = query.filter(Incident.dataset == dataset.upper())
    if status:
        if status.upper() == "OPEN":
            query = query.filter(Incident.status != "RESOLVED")
        else:
            query = query.filter(Incident.status == status.upper())
    if category:
        query = query.filter(Incident.category == category.lower())
    if priority:
        query = query.filter(Incident.priority == priority)
    if department_id:
        query = query.filter(Incident.department_id == department_id)
    if has_coords is True:
        query = query.filter(Incident.latitude.isnot(None), Incident.longitude.isnot(None))
    elif has_coords is False:
        query = query.filter(
            (Incident.latitude.is_(None)) |
            (Incident.longitude.is_(None)) |
            (Incident.location_mode == "UNCONFIRMED")
        )
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (Incident.title.ilike(search_fmt)) |
            (Incident.tracking_id.ilike(search_fmt)) |
            (Incident.description.ilike(search_fmt)) |
            (Incident.location_description.ilike(search_fmt))
        )

    return query.order_by(Incident.priority.desc(), Incident.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/density", response_model=DensityResponse)
def get_complaint_density(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radius: float = Query(150.0, ge=10.0, le=5000.0),
    db: Session = Depends(get_db)
):
    """
    Calculates active incident density within radius meters (default 150m) of given coordinates.
    Used by the interactive pin dropper to alert citizens to high-density zones with automatic priority boost.
    """
    # Look for active incidents (excluding RESOLVED) with coordinates
    active_incidents = db.query(Incident).filter(
        Incident.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS", "NEEDS_REVIEW", "ESCALATED", "REOPENED"]),
        Incident.latitude.isnot(None),
        Incident.longitude.isnot(None)
    ).all()

    nearby: List[DensityIncidentSummary] = []
    for inc in active_incidents:
        dist = haversine_distance(lat, lon, inc.latitude, inc.longitude)
        if dist <= radius:
            nearby.append(
                DensityIncidentSummary(
                    id=inc.id,
                    tracking_id=inc.tracking_id,
                    title=inc.title,
                    category=inc.category,
                    priority=inc.priority,
                    status=inc.status,
                    distance_meters=round(dist, 1)
                )
            )

    nearby.sort(key=lambda x: x.distance_meters)
    count = len(nearby)
    is_high = count >= 2

    if count >= 2:
        msg = f"High-Density Zone Detected: {count} active reports within {int(radius)}m — Automatic Priority Boost & Higher-Rank Escalation Enabled."
    elif count == 1:
        msg = f"1 active incident detected within {int(radius)}m ({nearby[0].title})."
    else:
        msg = f"Normal complaint density: No active unresolved incidents within {int(radius)}m."

    return DensityResponse(
        density_count=count,
        is_high_density=is_high,
        radius_meters=radius,
        message=msg,
        active_incidents=nearby
    )

@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(
        (Incident.id == incident_id) | (Incident.tracking_id == incident_id)
    ).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    return incident

@router.post("/{incident_id}/assign", response_model=IncidentResponse)
def assign_incident(incident_id: str, payload: IncidentAssignRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail=f"Department '{payload.department_id}' does not exist.")

    incident.department_id = dept.id
    incident.assignment_rationale = payload.reason or f"Manually assigned to {dept.name}."

    # If in NEW, REOPENED, or ESCALATED, transition to ASSIGNED
    if incident.status in ["NEW", "REOPENED", "ESCALATED", "NEEDS_REVIEW"]:
        state_machine.transition(
            db=db,
            incident=incident,
            new_status="ASSIGNED",
            actor="HUMAN:operator",
            reason=payload.reason or f"Assigned to {dept.name}",
            metadata={"department_id": dept.id}
        )

    db.commit()
    db.refresh(incident)
    return incident

@router.post("/{incident_id}/start", response_model=IncidentResponse)
def start_work(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    state_machine.transition(
        db=db,
        incident=incident,
        new_status="IN_PROGRESS",
        actor="AGENT:field_ops",
        reason="Field crew dispatched on-site; work initiated."
    )
    db.commit()
    db.refresh(incident)
    return incident

@router.post("/{incident_id}/closure", response_model=ClosureResponse)
def submit_closure(incident_id: str, payload: ClosureSubmitRequest, db: Session = Depends(get_db)):
    """
    Submits completion evidence and runs deterministic verification:
    - If 5 checks pass: resolves case
    - If any mandatory check fails: rejects closure and autonomous state machine reopens case!
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    closure, verdict = closure_verifier.verify_closure(
        db=db,
        incident=incident,
        description=payload.description,
        photo_ref=payload.photo_ref,
        lat=payload.latitude,
        lon=payload.longitude,
        department_id=payload.department_id or incident.department_id
    )
    return closure

@router.post("/{incident_id}/review", response_model=IncidentResponse)
def review_incident(incident_id: str, payload: IncidentReviewRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    decision = payload.decision.upper()
    actor = f"HUMAN:{payload.reviewer_id}"

    if decision == "APPROVE":
        state_machine.transition(
            db=db,
            incident=incident,
            new_status="RESOLVED",
            actor=actor,
            reason=f"Human reviewer approved closure: {payload.note}",
            metadata={"reviewer_note": payload.note}
        )
    elif decision == "REOPEN":
        state_machine.reopen(
            db=db,
            incident=incident,
            actor=actor,
            reason=f"Human reviewer rejected closure / ordered case reopening: {payload.note}",
            metadata={"reviewer_note": payload.note}
        )
    elif decision == "ASSIGN":
        if not payload.department_id:
            raise HTTPException(status_code=400, detail="Department ID is required when decision is ASSIGN.")
        dept = db.query(Department).filter(Department.id == payload.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail=f"Department '{payload.department_id}' not found.")
        incident.department_id = dept.id
        incident.assignment_rationale = f"Reassigned by supervisor: {payload.note}"
        state_machine.transition(
            db=db,
            incident=incident,
            new_status="ASSIGNED",
            actor=actor,
            reason=f"Human supervisor assigned to {dept.name}: {payload.note}",
            metadata={"reviewer_note": payload.note, "assigned_department": dept.id}
        )

    db.commit()
    db.refresh(incident)
    return incident

@router.get("/{incident_id}/events", response_model=List[AuditEventResponse])
def get_incident_events(incident_id: str, db: Session = Depends(get_db)):
    return db.query(AuditEvent).filter(
        AuditEvent.incident_id == incident_id
    ).order_by(AuditEvent.timestamp.asc()).all()

@router.get("/{incident_id}/duplicates", response_model=List[ReportResponse])
def get_incident_duplicates(incident_id: str, db: Session = Depends(get_db)):
    return db.query(CitizenReport).filter(
        CitizenReport.incident_id == incident_id
    ).order_by(CitizenReport.created_at.desc()).all()

@router.get("/{incident_id}/verification", response_model=Optional[ClosureResponse])
def get_latest_verification(incident_id: str, db: Session = Depends(get_db)):
    return db.query(ClosureSubmission).filter(
        ClosureSubmission.incident_id == incident_id
    ).order_by(ClosureSubmission.submitted_at.desc()).first()

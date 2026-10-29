import base64
from app.services.image_authenticity_service import image_authenticity_service
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.models.report import CitizenReport
from app.models.audit import AuditEvent
from app.models.attachment import Attachment
from app.schemas.report import ReportCreate, ReportResponse, ReportIntakeResult
from app.services.classification import classifier
from app.services.duplicate_detection import duplicate_detector
from app.services.routing import router_service
from app.services.intelligence import civic_intelligence
from app.services.sim_clock import sim_clock
from app.services.state_machine import state_machine
from app.services.audit_service import audit_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", response_model=ReportIntakeResult)
def submit_report(payload: ReportCreate, db: Session = Depends(get_db)):
    """
    Ingests citizen report through the real intake pipeline:
    1. Validates input and determines location mode (PRECISE vs UNCONFIRMED)
    2. Classifies category and priority (handles custom 'Other' categories)
    3. Runs multi-factor duplicate detection against open / 14-day resolved cases
    4. Automatically links if score >= 0.75, flags review if >= 0.50, or creates canonical incident
    5. Associates any uploaded cryptographic attachments
    6. Returns intake decision, tracking IDs, location status, and assignment details.
    """
    # 0. Forensic AI Image Authenticity Verification
    if payload.photo_data or payload.photo_ref:
        img_bytes = b""
        mime_type = "image/jpeg"
        if payload.photo_data:
            try:
                raw_b64 = payload.photo_data
                if "," in raw_b64:
                    header, raw_b64 = raw_b64.split(",", 1)
                    if "image/png" in header:
                        mime_type = "image/png"
                    elif "image/webp" in header:
                        mime_type = "image/webp"
                img_bytes = base64.b64decode(raw_b64)
            except Exception:
                img_bytes = b""

        auth_check = image_authenticity_service.verify_authenticity(
            image_bytes=img_bytes,
            filename=payload.photo_ref or "",
            mime_type=mime_type
        )
        if auth_check["verdict"] == "REJECTED":
            raise HTTPException(
                status_code=422,
                detail=f"Synthetic / AI-Generated Image Rejected: {auth_check['reason']}"
            )

    now = sim_clock.now()

    # Determine location mode & status
    is_unconfirmed = (payload.location_mode == "UNCONFIRMED") or (payload.latitude is None and payload.longitude is None)
    loc_mode = "UNCONFIRMED" if is_unconfirmed else "PRECISE"
    loc_status = "LOCATION_UNCONFIRMED" if is_unconfirmed else "USER_SELECTED"

    # 1. Classification
    category_input = payload.custom_category if (payload.category == "other" and payload.custom_category) else payload.category
    classification = classifier.classify(payload.description, category_input)
    cat = classification["category"]
    priority = classification["priority"]

    # 2. Location Intelligence & Duplicate Detection
    loc_area = (payload.approximate_locality or payload.location_description or payload.address or "").strip().lower()
    corroborating_incident = None
    matching_reports_count = 0

    if is_unconfirmed and loc_area:
        # Search open incidents in that text landmark/area
        candidates = db.query(Incident).filter(
            Incident.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS", "NEEDS_REVIEW", "ESCALATED"]),
            Incident.category == cat
        ).all()
        for cand in candidates:
            cand_area = (cand.approximate_locality or cand.location_description or cand.address or "").lower()
            if cand_area and (loc_area in cand_area or cand_area in loc_area):
                rep_count = db.query(CitizenReport).filter(CitizenReport.incident_id == cand.id).count()
                if rep_count >= 2:
                    corroborating_incident = cand
                    matching_reports_count = rep_count
                    break

    if is_unconfirmed:
        if corroborating_incident:
            action = "ACTION_LINK"
            best_cand = corroborating_incident
            score = 0.85
            loc_status = "CORROBORATED"
            explanation = f"Corroborated by {matching_reports_count} citizen reports in {payload.approximate_locality or payload.location_description}."
        else:
            action = "CREATE_NEW"
            best_cand = None
            score = 0.0
            loc_status = "LOCATION_UNCONFIRMED"
            explanation = "Awaiting Field/Crowd Location Confirmation (fewer than 2 corroborating reports in area)."
    else:
        dup_result = duplicate_detector.find_duplicate(
            db=db,
            text=payload.description,
            category=cat,
            lat=payload.latitude,
            lon=payload.longitude
        )
        action = dup_result["action"]
        best_cand = dup_result["best_match"]
        score = dup_result["score"]
        explanation = dup_result["rationale"]

    report_id = f"rep_{uuid.uuid4().hex[:10]}"
    tracking_id = f"REP-{uuid.uuid4().hex[:6].upper()}"

    # Handle Matching Resolved Incident (Recurrence)
    if best_cand and best_cand.status == "RESOLVED" and action == "ACTION_LINK":
        state_machine.reopen(
            db=db,
            incident=best_cand,
            actor="AGENT:linker",
            reason=f"Recurrence detected via new citizen report: {explanation}",
            metadata={"new_report_tracking_id": tracking_id}
        )

    if action == "ACTION_LINK" and best_cand:
        # Link to Existing Incident
        report = CitizenReport(
            id=report_id,
            tracking_id=tracking_id,
            incident_id=best_cand.id,
            reporter_name=payload.reporter_name or "Anonymous Citizen",
            text=payload.description,
            language=payload.language,
            category=cat,
            custom_category=payload.custom_category,
            location_mode=loc_mode,
            location_status=loc_status,
            latitude=payload.latitude,
            longitude=payload.longitude,
            location_description=payload.location_description,
            address=payload.address,
            approximate_locality=payload.approximate_locality,
            observation_time=payload.observation_time,
            photo_ref=payload.photo_ref,
            photo_data=payload.photo_data,
            sha256_hash=payload.sha256_hash,
            created_at=now,
            duplicate_score=score,
            duplicate_rationale=explanation,
            is_synthetic=best_cand.is_synthetic
        )
        db.add(report)
        best_cand.reports_count += 1

        # Link attachments
        if payload.attachment_ids:
            db.query(Attachment).filter(Attachment.id.in_(payload.attachment_ids)).update(
                {Attachment.report_id: report_id, Attachment.incident_id: best_cand.id},
                synchronize_session=False
            )

        audit_service.record_event(
            db=db,
            incident_id=best_cand.id,
            event_type="DUPLICATE_LINK",
            from_status=None,
            to_status=None,
            actor="AGENT:linker",
            action="LINK_DUPLICATE_REPORT",
            reason=f"Citizen report linked to canonical incident ({score:.2f} >= 0.75). {explanation}",
            metadata={"report_tracking_id": tracking_id, "score": score, "location_mode": loc_mode},
            timestamp=now
        )
        db.commit()
        db.refresh(report)
        db.refresh(best_cand)

        return ReportIntakeResult(
            report=ReportResponse.model_validate(report),
            incident_id=best_cand.id,
            incident_tracking_id=best_cand.tracking_id,
            is_duplicate=True,
            duplicate_action="LINKED",
            duplicate_score=score,
            explanation=explanation,
            category=best_cand.category,
            priority=best_cand.priority,
            assigned_department_id=best_cand.department_id,
            location_mode=loc_mode,
            location_status=loc_status
        )

    elif action == "ACTION_REVIEW" and best_cand:
        # Borderline match: create case in NEEDS_REVIEW
        dept_id, routing_rationale, _ = router_service.route_incident(db, cat)
        sla_due = router_service.calculate_sla_due(priority)

        incident_id = f"inc_{uuid.uuid4().hex[:10]}"
        inc_tracking_id = f"CIV-2026-{uuid.uuid4().hex[:4].upper()}"

        incident = Incident(
            id=incident_id,
            tracking_id=inc_tracking_id,
            title=classification["title"],
            description=payload.description,
            category=cat,
            custom_category=payload.custom_category,
            priority=priority,
            priority_reasons=classification["priority_reasons"],
            status="NEEDS_REVIEW",
            location_mode=loc_mode,
            location_status=loc_status,
            latitude=payload.latitude,
            longitude=payload.longitude,
            location_description=payload.location_description,
            address=payload.address,
            approximate_locality=payload.approximate_locality,
            photo_data=payload.photo_data,
            sha256_hash=payload.sha256_hash,
            department_id=dept_id,
            created_at=now,
            assigned_at=now,
            sla_due_at=sla_due,
            reports_count=1,
            ai_classification_metadata=classification,
            assignment_rationale=f"Flagged for human triage due to possible duplicate match with {best_cand.tracking_id} (Score: {score:.2f}).",
            is_synthetic=False
        )
        db.add(incident)
        db.flush()

        report = CitizenReport(
            id=report_id,
            tracking_id=tracking_id,
            incident_id=incident.id,
            reporter_name=payload.reporter_name or "Anonymous Citizen",
            text=payload.description,
            language=payload.language,
            category=cat,
            custom_category=payload.custom_category,
            location_mode=loc_mode,
            location_status=loc_status,
            latitude=payload.latitude,
            longitude=payload.longitude,
            location_description=payload.location_description,
            address=payload.address,
            approximate_locality=payload.approximate_locality,
            observation_time=payload.observation_time,
            photo_ref=payload.photo_ref,
            photo_data=payload.photo_data,
            sha256_hash=payload.sha256_hash,
            created_at=now,
            duplicate_score=score,
            duplicate_rationale=explanation,
            is_synthetic=False
        )
        db.add(report)

        if payload.attachment_ids:
            db.query(Attachment).filter(Attachment.id.in_(payload.attachment_ids)).update(
                {Attachment.report_id: report_id, Attachment.incident_id: incident.id},
                synchronize_session=False
            )

        audit_service.record_event(
            db=db,
            incident_id=incident.id,
            event_type="DUPLICATE_REVIEW",
            from_status=None,
            to_status="NEEDS_REVIEW",
            actor="AGENT:linker",
            action="FLAG_DUPLICATE_REVIEW",
            reason=explanation,
            metadata={"suggested_incident_id": best_cand.id, "score": score},
            timestamp=now
        )
        db.commit()
        db.refresh(report)
        db.refresh(incident)

        return ReportIntakeResult(
            report=ReportResponse.model_validate(report),
            incident_id=incident.id,
            incident_tracking_id=incident.tracking_id,
            is_duplicate=True,
            duplicate_action="REVIEW",
            duplicate_score=score,
            explanation=explanation,
            category=incident.category,
            priority=incident.priority,
            assigned_department_id=incident.department_id,
            location_mode=loc_mode,
            location_status=loc_status
        )

    else:
        # Create New Canonical Incident
        dept_id, routing_rationale, _ = router_service.route_incident(db, cat)
        sla_due = router_service.calculate_sla_due(priority)

        incident_id = f"inc_{uuid.uuid4().hex[:10]}"
        inc_tracking_id = f"CIV-2026-{uuid.uuid4().hex[:4].upper()}"

        init_status = "NEEDS_REVIEW" if loc_mode == "UNCONFIRMED" else "ASSIGNED"

        incident = Incident(
            id=incident_id,
            tracking_id=inc_tracking_id,
            title=classification["title"],
            description=payload.description,
            category=cat,
            custom_category=payload.custom_category,
            priority=priority,
            priority_reasons=classification["priority_reasons"],
            status=init_status,
            location_mode=loc_mode,
            location_status=loc_status,
            latitude=payload.latitude,
            longitude=payload.longitude,
            location_description=payload.location_description,
            address=payload.address,
            approximate_locality=payload.approximate_locality,
            photo_data=payload.photo_data,
            sha256_hash=payload.sha256_hash,
            department_id=dept_id,
            created_at=now,
            assigned_at=now,
            sla_due_at=sla_due,
            reports_count=1,
            ai_classification_metadata=classification,
            assignment_rationale=routing_rationale if loc_mode != "UNCONFIRMED" else f"{routing_rationale} (Queued in Unconfirmed Location Reports for field verification)",
            is_synthetic=False
        )
        db.add(incident)
        db.flush()

        rec_check = civic_intelligence.check_recurring(db, incident)
        if rec_check["recurring"]:
            incident.recurring_flag = True
            incident.root_cause_evidence_ids = rec_check["prior_ids"]
            reasons = list(incident.priority_reasons)
            reasons.append(rec_check["explanation"])
            incident.priority_reasons = reasons

        report = CitizenReport(
            id=report_id,
            tracking_id=tracking_id,
            incident_id=incident.id,
            reporter_name=payload.reporter_name or "Anonymous Citizen",
            text=payload.description,
            language=payload.language,
            category=cat,
            custom_category=payload.custom_category,
            location_mode=loc_mode,
            location_status=loc_status,
            latitude=payload.latitude,
            longitude=payload.longitude,
            location_description=payload.location_description,
            address=payload.address,
            approximate_locality=payload.approximate_locality,
            observation_time=payload.observation_time,
            photo_ref=payload.photo_ref,
            photo_data=payload.photo_data,
            sha256_hash=payload.sha256_hash,
            created_at=now,
            duplicate_score=score,
            duplicate_rationale="Canonical primary report.",
            is_synthetic=False
        )
        db.add(report)

        if payload.attachment_ids:
            db.query(Attachment).filter(Attachment.id.in_(payload.attachment_ids)).update(
                {Attachment.report_id: report_id, Attachment.incident_id: incident.id},
                synchronize_session=False
            )

        audit_service.record_event(
            db=db,
            incident_id=incident.id,
            event_type="INTAKE_CLASSIFICATION",
            from_status="NEW",
            to_status=init_status,
            actor="AGENT:intake",
            action="CREATE_AND_ROUTE",
            reason=f"New incident created and routed to {dept_id}. {routing_rationale}",
            metadata={"classification": classification, "location_mode": loc_mode},
            timestamp=now
        )
        db.commit()
        db.refresh(report)
        db.refresh(incident)

        return ReportIntakeResult(
            report=ReportResponse.model_validate(report),
            incident_id=incident.id,
            incident_tracking_id=incident.tracking_id,
            is_duplicate=False,
            duplicate_action="CREATED",
            duplicate_score=score,
            explanation=explanation,
            category=incident.category,
            priority=incident.priority,
            assigned_department_id=incident.department_id,
            location_mode=loc_mode,
            location_status=loc_status
        )

@router.get("", response_model=List[ReportResponse])
def list_reports(
    incident_id: Optional[str] = None,
    location_mode: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(CitizenReport)
    if incident_id:
        query = query.filter(CitizenReport.incident_id == incident_id)
    if location_mode:
        query = query.filter(CitizenReport.location_mode == location_mode)
    return query.order_by(CitizenReport.created_at.desc()).limit(limit).all()

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report

@router.get("/{report_id}/summary.pdf")
def download_report_pdf(report_id: str, db: Session = Depends(get_db)):
    """Downloads official municipal PDF report summary for a report."""
    from fastapi.responses import Response
    from app.services.pdf_service import generate_report_pdf

    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        report = db.query(CitizenReport).filter(CitizenReport.tracking_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report record not found.")

    incident = None
    if report.incident_id:
        incident = db.query(Incident).filter(Incident.id == report.incident_id).first()

    pdf_bytes = generate_report_pdf(report, incident)
    filename = f"CivicHelp_{report.tracking_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

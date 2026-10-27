import os
import uuid
import secrets
import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.whistleblower import WhistleblowerCase, WhistleblowerAttachment, WhistleblowerAuditLog
from app.models.funds import Ward

logger = logging.getLogger("civichelp.whistleblower")

CONFIDENTIAL_UPLOAD_DIR = os.path.join("uploads", "confidential")

SEED_WHISTLEBLOWER_CASES = [
    {
        "id": "WB-8F92-4C10",
        "case_token": "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0",
        "allegation_category": "SUBSTANDARD_WORKS",
        "title": "Substandard bitumen binder ratio on South Delhi arterial resurfacing",
        "narrative": "Contractor deployed low-viscosity emulsion instead of VG-30 bitumen grade specified in tender document PWD/HQ/MAINT/2025/1108. Core samples taken at night show 30% binder deficiency.",
        "ward_id": "WARD-DEL-044",
        "suspect_organization": "Apex Road Infrastructure Ltd",
        "is_anonymous": True,
        "contact_channel": "proton-secure-handle@internal",
        "status": "UNDER_REVIEW",
        "verification_label": "CORROBORATING_PHYSICAL_EVIDENCE",
        "investigation_outcome": "Field audit team dispatched with portable pavement core drill on 2026-10-22. Lab density tests pending."
    },
    {
        "id": "WB-3A19-9B21",
        "case_token": "f0e1d2c3b4a5968778695a4b3c2d1e0f0987654321fedcba",
        "allegation_category": "ILLEGAL_CONSTRUCTION",
        "title": "Unauthorized commercial encroachment directly over stormwater trunk drain",
        "narrative": "Three-story commercial storage shed erected over open municipal drain reserve without building sanction or drainage clearance, causing monsoon backflow in Ward 43.",
        "ward_id": "WARD-DEL-043",
        "suspect_organization": "Private Builder Consortium",
        "is_anonymous": True,
        "contact_channel": None,
        "status": "ACTION_RECOMMENDED",
        "verification_label": "VERIFIED_IRREGULARITY",
        "investigation_outcome": "Demolition and drain restoration notice served under Section 343 DMC Act. Coordinated with local enforcement squad."
    }
]


def seed_whistleblower_cases(db: Session) -> None:
    os.makedirs(CONFIDENTIAL_UPLOAD_DIR, exist_ok=True)
    for c_data in SEED_WHISTLEBLOWER_CASES:
        existing = db.query(WhistleblowerCase).filter(WhistleblowerCase.id == c_data["id"]).first()
        if not existing:
            wb_case = WhistleblowerCase(
                id=c_data["id"],
                case_token=c_data["case_token"],
                allegation_category=c_data["allegation_category"],
                title=c_data["title"],
                narrative=c_data["narrative"],
                ward_id=c_data["ward_id"],
                suspect_organization=c_data.get("suspect_organization"),
                is_anonymous=c_data["is_anonymous"],
                contact_channel=c_data.get("contact_channel"),
                status=c_data["status"],
                verification_label=c_data["verification_label"],
                investigation_outcome=c_data.get("investigation_outcome"),
                created_at=datetime.now(timezone.utc)
            )
            db.add(wb_case)
            db.flush()

            # Seed initial audit log
            db.add(WhistleblowerAuditLog(
                id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
                case_id=wb_case.id,
                actor_user_id="ANONYMOUS_WHISTLEBLOWER",
                action="CREATED",
                details="Case registered with cryptographic secret token.",
                timestamp=datetime.now(timezone.utc)
            ))
    db.commit()
    logger.info("Whistleblower confidential demo cases seeded.")


def submit_case(
    db: Session,
    title: str,
    allegation_category: str,
    narrative: str,
    ward_id: Optional[str] = None,
    suspect_organization: Optional[str] = None,
    is_anonymous: bool = True,
    contact_channel: Optional[str] = None
) -> Dict[str, Any]:
    case_token = secrets.token_hex(24)  # 48 chars non-guessable
    case_id = f"WB-{secrets.token_hex(2).upper()}-{secrets.token_hex(2).upper()}"

    case = WhistleblowerCase(
        id=case_id,
        case_token=case_token,
        allegation_category=allegation_category,
        title=title,
        narrative=narrative,
        ward_id=ward_id,
        suspect_organization=suspect_organization,
        is_anonymous=is_anonymous,
        contact_channel=contact_channel if not is_anonymous else None,
        status="SUBMITTED",
        verification_label="UNVERIFIED_ALLEGATION",
        created_at=datetime.now(timezone.utc)
    )
    db.add(case)
    db.flush()

    audit = WhistleblowerAuditLog(
        id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        case_id=case.id,
        actor_user_id="ANONYMOUS_SUBMITTER",
        action="CREATED",
        details="Initial submission registered with zero citizen tracking identifiers.",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()
    db.refresh(case)

    return {
        "case_id": case.id,
        "case_token": case.case_token,
        "status": case.status,
        "verification_label": case.verification_label,
        "created_at": case.created_at.isoformat()
    }


def track_case_by_token(db: Session, case_token: str) -> Optional[Dict[str, Any]]:
    case = db.query(WhistleblowerCase).filter(WhistleblowerCase.case_token == case_token).first()
    if not case:
        return None

    # Log inquiry access
    audit = WhistleblowerAuditLog(
        id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        case_id=case.id,
        actor_user_id="TOKEN_HOLDER",
        action="VIEWED",
        details="Case status queried using secret token.",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()

    ward = db.query(Ward).filter(Ward.id == case.ward_id).first() if case.ward_id else None
    attachments = db.query(WhistleblowerAttachment).filter(WhistleblowerAttachment.case_id == case.id).all()

    return {
        "case_id": case.id,
        "title": case.title,
        "allegation_category": case.allegation_category,
        "ward_name": ward.name if ward else "Unspecified Ward",
        "suspect_organization": case.suspect_organization,
        "status": case.status,
        "verification_label": case.verification_label,
        "investigation_outcome": case.investigation_outcome,
        "created_at": case.created_at.isoformat(),
        "updated_at": case.updated_at.isoformat() if case.updated_at else None,
        "attachments_count": len(attachments)
    }


def list_auditor_cases(
    db: Session,
    category: Optional[str] = None,
    status: Optional[str] = None,
    auditor_user_id: str = "AUDITOR"
) -> List[Dict[str, Any]]:
    query = db.query(WhistleblowerCase)
    if category:
        query = query.filter(WhistleblowerCase.allegation_category == category)
    if status:
        query = query.filter(WhistleblowerCase.status == status)

    cases = query.order_by(desc(WhistleblowerCase.created_at)).all()
    results = []
    for c in cases:
        ward = db.query(Ward).filter(Ward.id == c.ward_id).first() if c.ward_id else None
        att_count = db.query(WhistleblowerAttachment).filter(WhistleblowerAttachment.case_id == c.id).count()
        results.append({
            "id": c.id,
            "title": c.title,
            "allegation_category": c.allegation_category,
            "ward_id": c.ward_id,
            "ward_name": ward.name if ward else "Unspecified",
            "suspect_organization": c.suspect_organization,
            "status": c.status,
            "verification_label": c.verification_label,
            "narrative_preview": c.narrative[:120] + "..." if len(c.narrative) > 120 else c.narrative,
            "attachments_count": att_count,
            "created_at": c.created_at.isoformat()
        })
    return results


def get_auditor_case_detail(
    db: Session,
    case_id: str,
    auditor_user_id: str = "AUDITOR"
) -> Optional[Dict[str, Any]]:
    c = db.query(WhistleblowerCase).filter(WhistleblowerCase.id == case_id).first()
    if not c:
        return None

    # Log auditor view
    audit = WhistleblowerAuditLog(
        id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        case_id=c.id,
        actor_user_id=auditor_user_id,
        action="VIEWED",
        details=f"Auditor {auditor_user_id} inspected full case dossier.",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()

    ward = db.query(Ward).filter(Ward.id == c.ward_id).first() if c.ward_id else None
    attachments = db.query(WhistleblowerAttachment).filter(WhistleblowerAttachment.case_id == c.id).all()
    logs = db.query(WhistleblowerAuditLog).filter(WhistleblowerAuditLog.case_id == c.id).order_by(desc(WhistleblowerAuditLog.timestamp)).all()

    return {
        "id": c.id,
        "title": c.title,
        "allegation_category": c.allegation_category,
        "narrative": c.narrative,
        "ward_id": c.ward_id,
        "ward_name": ward.name if ward else "Unspecified Ward",
        "suspect_organization": c.suspect_organization,
        "is_anonymous": c.is_anonymous,
        "contact_channel": c.contact_channel,
        "status": c.status,
        "verification_label": c.verification_label,
        "investigation_outcome": c.investigation_outcome,
        "assigned_reviewer_id": c.assigned_reviewer_id,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        "attachments": [
            {
                "id": a.id,
                "original_filename": a.original_filename,
                "file_size_bytes": a.file_size_bytes,
                "mime_type": a.mime_type,
                "sha256_hash": a.sha256_hash,
                "uploaded_at": a.uploaded_at.isoformat()
            }
            for a in attachments
        ],
        "audit_logs": [
            {
                "id": log.id,
                "actor_user_id": log.actor_user_id,
                "action": log.action,
                "details": log.details,
                "timestamp": log.timestamp.isoformat()
            }
            for log in logs
        ]
    }


def update_case_status(
    db: Session,
    case_id: str,
    status: str,
    verification_label: Optional[str] = None,
    investigation_outcome: Optional[str] = None,
    auditor_user_id: str = "AUDITOR"
) -> Dict[str, Any]:
    c = db.query(WhistleblowerCase).filter(WhistleblowerCase.id == case_id).first()
    if not c:
        raise ValueError(f"Whistleblower case '{case_id}' not found.")

    valid_statuses = [
        "SUBMITTED",
        "TRIAGE",
        "ASSIGNED_TO_AUTHORIZED_REVIEWER",
        "UNDER_REVIEW",
        "ACTION_RECOMMENDED",
        "CLOSED"
    ]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status '{status}'. Valid options: {', '.join(valid_statuses)}")

    old_status = c.status
    c.status = status
    if verification_label:
        c.verification_label = verification_label
    if investigation_outcome:
        c.investigation_outcome = investigation_outcome
    c.updated_at = datetime.now(timezone.utc)

    # Log status change
    audit = WhistleblowerAuditLog(
        id=f"LOG-{uuid.uuid4().hex[:8].upper()}",
        case_id=c.id,
        actor_user_id=auditor_user_id,
        action="STATUS_CHANGE",
        details=f"Status changed from '{old_status}' to '{status}'. Label: {c.verification_label}",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()
    db.refresh(c)

    return {
        "id": c.id,
        "status": c.status,
        "verification_label": c.verification_label,
        "investigation_outcome": c.investigation_outcome,
        "updated_at": c.updated_at.isoformat()
    }

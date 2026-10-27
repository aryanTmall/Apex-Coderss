import uuid
import re
from datetime import timezone
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.closure import ClosureSubmission
from app.models.audit import AuditEvent
from app.models.report import CitizenReport
from app.models.department import Department
from app.services.duplicate_detection import haversine_distance
from app.services.sim_clock import sim_clock
from app.services.state_machine import state_machine
from app.services.audit_service import audit_service

CATEGORY_KEYWORDS = {
    "pothole": ["filled", "patched", "resurfaced", "repaired", "fixed", "sealed", "tarred", "asphalt applied", "completed"],
    "streetlight": ["replaced", "repaired", "working", "fixed", "restored", "installed", "bulb changed", "powered"],
    "garbage": ["collected", "removed", "cleared", "cleaned", "disposed", "emptied", "hauled", "sanitized"],
    "water_leak": ["repaired", "sealed", "stopped", "plugged", "fixed", "replaced", "welded", "clamped"],
    "drainage": ["cleared", "unclogged", "repaired", "desilted", "drained", "fixed", "flowing", "opened"],
    "other": ["repaired", "resolved", "fixed", "completed", "cleared", "serviced"]
}

def to_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

class ClosureVerificationService:

    @classmethod
    def evaluate_checks(
        cls,
        db: Session,
        incident: Incident,
        description: str,
        photo_ref: Optional[str],
        lat: Optional[float],
        lon: Optional[float],
        submitted_at
    ) -> Dict[str, Dict[str, Any]]:
        checks = {}
        sub_utc = to_utc(submitted_at)

        # 1. has_description_and_photo
        has_desc = bool(description and len(description.strip()) >= 5)
        has_photo = bool(photo_ref and len(photo_ref.strip()) > 0)
        if has_desc and has_photo:
            checks["has_description_and_photo"] = {
                "name": "has_description_and_photo",
                "status": "PASSED",
                "mandatory": True,
                "explanation": f"Mandatory completion description and photographic evidence provided ({photo_ref})."
            }
        else:
            missing = []
            if not has_desc:
                missing.append("completion description")
            if not has_photo:
                missing.append("closure photo evidence")
            checks["has_description_and_photo"] = {
                "name": "has_description_and_photo",
                "status": "FAILED",
                "mandatory": True,
                "explanation": f"Missing mandatory proof: {', '.join(missing)}."
            }

        # 2. within_50m
        if lat is None or lon is None or incident.latitude is None or incident.longitude is None:
            checks["within_50m"] = {
                "name": "within_50m",
                "status": "FAILED",
                "mandatory": True,
                "explanation": "Missing geofence coordinates. Closure telemetry must provide valid GPS coordinates."
            }
        else:
            dist = haversine_distance(lat, lon, incident.latitude, incident.longitude)
            if dist <= 50.0:
                checks["within_50m"] = {
                    "name": "within_50m",
                    "status": "PASSED",
                    "mandatory": True,
                    "explanation": f"Geofence match verified: closure site is {dist:.1f}m from reported incident (tolerance <= 50m)."
                }
            else:
                checks["within_50m"] = {
                    "name": "within_50m",
                    "status": "FAILED",
                    "mandatory": True,
                    "explanation": f"Geofence violation: closure coordinates are {dist:.1f}m away from the incident location (exceeds 50m tolerance)."
                }

        # 3. after_assignment
        assigned_time = to_utc(incident.assigned_at or incident.created_at)
        if assigned_time and sub_utc >= assigned_time:
            checks["after_assignment"] = {
                "name": "after_assignment",
                "status": "PASSED",
                "mandatory": True,
                "explanation": "Temporal validity verified: closure was submitted after work order dispatch."
            }
        else:
            checks["after_assignment"] = {
                "name": "after_assignment",
                "status": "FAILED",
                "mandatory": True,
                "explanation": "Temporal anomaly: closure timestamp precedes dispatch/assignment timestamp."
            }

        # 4. completion_keywords
        cat_key = incident.category.lower() if incident.category else "other"
        valid_words = CATEGORY_KEYWORDS.get(cat_key, CATEGORY_KEYWORDS["other"])
        desc_lower = description.lower()
        matched_words = [w for w in valid_words if re.search(r'\b' + re.escape(w) + r'\b', desc_lower)]

        if matched_words:
            checks["completion_keywords"] = {
                "name": "completion_keywords",
                "status": "PASSED",
                "mandatory": True,
                "explanation": f"Category-specific resolution terms detected: {', '.join(matched_words)}."
            }
        else:
            checks["completion_keywords"] = {
                "name": "completion_keywords",
                "status": "FAILED",
                "mandatory": True,
                "explanation": f"No valid completion terms found for category '{cat_key}'. Expected terms like: {', '.join(valid_words[:4])}."
            }

        # 5. no_contradicting_reports
        contradicting = db.query(CitizenReport).filter(
            CitizenReport.incident_id == incident.id,
            CitizenReport.created_at > sub_utc
        ).count()

        if contradicting == 0:
            checks["no_contradicting_reports"] = {
                "name": "no_contradicting_reports",
                "status": "PASSED",
                "mandatory": False,
                "explanation": "No subsequent citizen complaints or contradictory dispatches logged."
            }
        else:
            checks["no_contradicting_reports"] = {
                "name": "no_contradicting_reports",
                "status": "NEEDS_REVIEW",
                "mandatory": False,
                "explanation": f"{contradicting} new citizen reports submitted after closure claim indicating unresolved issue."
            }

        return checks

    @classmethod
    def verify_closure(
        cls,
        db: Session,
        incident: Incident,
        description: str,
        photo_ref: Optional[str],
        lat: Optional[float],
        lon: Optional[float],
        department_id: Optional[str] = None
    ) -> Tuple[ClosureSubmission, str]:
        now = sim_clock.now()

        checks = cls.evaluate_checks(
            db=db,
            incident=incident,
            description=description,
            photo_ref=photo_ref,
            lat=lat,
            lon=lon,
            submitted_at=now
        )

        failed_checks = [c for c in checks.values() if c["status"] == "FAILED"]
        review_checks = [c for c in checks.values() if c["status"] == "NEEDS_REVIEW"]

        reasons = []
        if failed_checks:
            verdict = "REJECTED"
            for fc in failed_checks:
                reasons.append(f"[{fc['name']} FAILED]: {fc['explanation']}")
        elif review_checks:
            verdict = "NEEDS_REVIEW"
            for rc in review_checks:
                reasons.append(f"[{rc['name']} REVIEW]: {rc['explanation']}")
        else:
            verdict = "APPROVED"
            reasons.append("All 5 multi-modal closure verification checks passed autonomously.")

        closure = ClosureSubmission(
            id=f"cls_{uuid.uuid4().hex[:12]}",
            incident_id=incident.id,
            department_id=department_id or incident.department_id,
            description=description,
            photo_ref=photo_ref,
            latitude=lat,
            longitude=lon,
            submitted_at=now,
            verdict=verdict,
            verdict_reasons=reasons,
            individual_checks=checks,
            is_synthetic=incident.is_synthetic
        )
        db.add(closure)
        db.flush()

        # Legally transition to CLOSURE_SUBMITTED first if not already
        if incident.status in ["ASSIGNED", "IN_PROGRESS", "ESCALATED"]:
            state_machine.transition(
                db=db,
                incident=incident,
                new_status="CLOSURE_SUBMITTED",
                actor="AGENT:verifier",
                reason="Closure evidence submitted for autonomous multi-modal verification.",
                metadata={"closure_id": closure.id}
            )

        # Apply State Machine logic based on verdict
        if verdict == "REJECTED":
            fail_summary = "; ".join([fc["explanation"] for fc in failed_checks])
            
            # Contractor Spoofing Forensics & Trust Score Tracking
            geofence_failed = any(fc["name"] == "within_50m" for fc in failed_checks)
            target_dept_id = department_id or incident.department_id
            if geofence_failed and target_dept_id:
                dept = db.query(Department).filter(Department.id == target_dept_id).first()
                if dept:
                    dept.trust_score = max(10, dept.trust_score - 15)
                    dept.spoofing_flags_count += 1
                    audit_service.record_event(
                        db=db,
                        incident_id=incident.id,
                        event_type="SPOOFING_ALERT",
                        actor="AGENT:verifier",
                        action="SPOOFING_GEOFENCE_BREACH",
                        reason=f"Contractor spoofing detected: closure submitted outside 50m geofence. Department trust score decreased to {dept.trust_score}%.",
                        metadata={
                            "closure_id": closure.id,
                            "department_id": dept.id,
                            "new_trust_score": dept.trust_score,
                            "spoofing_flags_count": dept.spoofing_flags_count
                        },
                        timestamp=now
                    )

            state_machine.reopen(
                db=db,
                incident=incident,
                actor="AGENT:verifier",
                reason=f"Closure verification rejected: {fail_summary}",
                metadata={"closure_id": closure.id, "failed_checks": [c["name"] for c in failed_checks]}
            )
        elif verdict == "NEEDS_REVIEW":
            state_machine.transition(
                db=db,
                incident=incident,
                new_status="NEEDS_REVIEW",
                actor="AGENT:verifier",
                reason="Verification checks indicate ambiguity; routed to human triage supervisor.",
                metadata={"closure_id": closure.id}
            )
        else:  # APPROVED
            state_machine.transition(
                db=db,
                incident=incident,
                new_status="RESOLVED",
                actor="AGENT:verifier",
                reason="All resolution criteria verified. Incident officially resolved.",
                metadata={"closure_id": closure.id}
            )

        db.commit()
        db.refresh(closure)
        db.refresh(incident)
        return closure, verdict

closure_verifier = ClosureVerificationService()

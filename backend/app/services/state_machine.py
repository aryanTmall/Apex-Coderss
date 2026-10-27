import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.audit import AuditEvent
from app.models.department import Department
from app.services.sim_clock import sim_clock
from app.services.audit_service import audit_service

VALID_STATUSES = {
    "NEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "CLOSURE_SUBMITTED",
    "NEEDS_REVIEW",
    "RESOLVED",
    "REOPENED",
    "ESCALATED"
}

# Explicit legal transitions
ALLOWED_TRANSITIONS = {
    "NEW": {"ASSIGNED", "NEEDS_REVIEW"},
    "ASSIGNED": {"IN_PROGRESS", "CLOSURE_SUBMITTED", "NEEDS_REVIEW", "ESCALATED"},
    "IN_PROGRESS": {"CLOSURE_SUBMITTED", "NEEDS_REVIEW", "ESCALATED"},
    "CLOSURE_SUBMITTED": {"RESOLVED", "REOPENED", "NEEDS_REVIEW"},
    "RESOLVED": {"REOPENED"},
    "REOPENED": {"ASSIGNED", "IN_PROGRESS", "NEEDS_REVIEW"},
    "NEEDS_REVIEW": {"RESOLVED", "REOPENED", "ASSIGNED"},
    "ESCALATED": {"ASSIGNED", "IN_PROGRESS", "NEEDS_REVIEW"}
}

# SLA Durations by priority
SLA_HOURS_BY_PRIORITY = {
    5: 2,    # 2 hours
    4: 4,    # 4 hours
    3: 24,   # 24 hours
    2: 48,   # 48 hours
    1: 72    # 72 hours
}

class StateMachineService:

    @staticmethod
    def calculate_sla_deadline(priority: int, start_time: Optional[datetime] = None) -> datetime:
        now = start_time or sim_clock.now()
        hours = SLA_HOURS_BY_PRIORITY.get(priority, 24)
        return now + timedelta(hours=hours)

    @staticmethod
    def validate_transition(current_status: str, new_status: str) -> bool:
        if new_status not in VALID_STATUSES:
            return False
        if current_status == new_status:
            return True
        allowed = ALLOWED_TRANSITIONS.get(current_status, set())
        return new_status in allowed

    @classmethod
    def transition(
        cls,
        db: Session,
        incident: Incident,
        new_status: str,
        actor: str,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Incident:
        """Applies a legal state machine transition and writes an AuditEvent."""
        if not cls.validate_transition(incident.status, new_status):
            raise HTTPException(
                status_code=400,
                detail=f"Illegal state transition from '{incident.status}' to '{new_status}'. Allowed: {sorted(ALLOWED_TRANSITIONS.get(incident.status, []))}"
            )

        old_status = incident.status
        incident.status = new_status
        now = sim_clock.now()

        if new_status == "RESOLVED":
            incident.resolved_at = now
        elif old_status == "RESOLVED" and new_status != "RESOLVED":
            incident.resolved_at = None

        if new_status == "ASSIGNED" and not incident.assigned_at:
            incident.assigned_at = now
            if not incident.sla_due_at:
                incident.sla_due_at = cls.calculate_sla_deadline(incident.priority, now)

        # Audit Event with cryptographic hash chaining
        audit_service.record_event(
            db=db,
            incident_id=incident.id,
            event_type="STATE_TRANSITION",
            from_status=old_status,
            to_status=new_status,
            actor=actor,
            action=f"TRANSITION_{new_status}",
            reason=reason,
            metadata=metadata or {},
            timestamp=now
        )
        return incident

    @classmethod
    def reopen(
        cls,
        db: Session,
        incident: Incident,
        actor: str,
        reason: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Incident:
        """
        Executes atomic reopening side effects:
        1. Set status to REOPENED
        2. Increment reopen_count
        3. Increment priority by 1 (capped at 5)
        4. Recalculate SLA deadline from SimClock.now()
        5. Reassign to available department or fallback
        6. Create audit events
        7. Clear active resolution state
        """
        now = sim_clock.now()
        old_status = incident.status
        old_priority = incident.priority

        # 1. Status update
        incident.status = "REOPENED"
        incident.resolved_at = None

        # 2. Increment reopen count
        incident.reopen_count += 1
        
        # Advance governance escalation tier accordingly
        tier = min(3, max(1, incident.reopen_count))
        incident.escalation_tier = tier

        # 3. Increase priority capped at 5
        new_priority = min(5, incident.priority + 1)
        incident.priority = new_priority
        if f"Reopened case priority increased from P{old_priority} to P{new_priority}" not in incident.priority_reasons:
            reasons = list(incident.priority_reasons)
            reasons.append(f"Reopened case priority increased to P{new_priority} due to failed resolution/re-emergence")
            incident.priority_reasons = reasons

        # 4. Recalculate SLA
        incident.sla_due_at = cls.calculate_sla_deadline(new_priority, now)

        # 5. Check department availability or fallback
        dept_assigned = incident.department_id
        if incident.department_id:
            dept = db.query(Department).filter(Department.id == incident.department_id).first()
            if dept and not dept.available and dept.fallback_department_id:
                incident.department_id = dept.fallback_department_id
                incident.assignment_rationale = f"Reassigned to fallback department {dept.fallback_department_id} due to {dept.name} outage."
                dept_assigned = dept.fallback_department_id

        # 6. Audit Trail
        reopen_meta = metadata or {}
        reopen_meta.update({
            "old_priority": old_priority,
            "new_priority": new_priority,
            "reopen_count": incident.reopen_count,
            "new_sla_due_at": incident.sla_due_at.isoformat() if incident.sla_due_at else None,
            "department_id": dept_assigned
        })

        audit_service.record_event(
            db=db,
            incident_id=incident.id,
            event_type="REOPEN",
            from_status=old_status,
            to_status="REOPENED",
            actor=actor,
            action="INCIDENT_REOPENED",
            reason=reason,
            metadata=reopen_meta,
            timestamp=now
        )
        return incident

state_machine = StateMachineService()

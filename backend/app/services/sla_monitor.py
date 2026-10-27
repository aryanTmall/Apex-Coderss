import uuid
from datetime import timezone
from typing import List
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.audit import AuditEvent
from app.services.sim_clock import sim_clock

OPEN_ELIGIBLE_STATUSES = {"ASSIGNED", "IN_PROGRESS", "REOPENED", "NEEDS_REVIEW"}

def to_utc(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

class SlaMonitorService:

    @classmethod
    def check_and_escalate(cls, db: Session) -> List[Incident]:
        """
        Scans all open unresolved incidents whose SLA deadline has passed.
        Transitions eligible cases to ESCALATED and records a SYSTEM:sla audit event.
        Never escalates RESOLVED cases. Avoids duplicate escalation in the same state.
        """
        now = sim_clock.now()
        
        # Query open incidents with an SLA
        open_candidates = db.query(Incident).filter(
            Incident.status.in_(OPEN_ELIGIBLE_STATUSES),
            Incident.sla_due_at != None
        ).all()

        escalated_list = []
        for incident in open_candidates:
            due_utc = to_utc(incident.sla_due_at)
            if due_utc and due_utc <= now:
                old_status = incident.status
                incident.status = "ESCALATED"
                incident.escalation_count += 1
                if incident.escalation_tier < 1:
                    incident.escalation_tier = 1
                
                breach_delta = now - due_utc
                breach_mins = max(1, int(breach_delta.total_seconds() / 60))

                reason = f"SLA breached by {breach_mins} minutes (Target deadline was {due_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}). Autonomous escalation triggered."
                
                audit = AuditEvent(
                    id=f"evt_{uuid.uuid4().hex[:12]}",
                    incident_id=incident.id,
                    event_type="SLA_BREACH",
                    from_status=old_status,
                    to_status="ESCALATED",
                    actor="SYSTEM:sla",
                    action="SLA_BREACH_ESCALATION",
                    reason=reason,
                    structured_metadata={
                        "sla_due_at": due_utc.isoformat(),
                        "breached_at": now.isoformat(),
                        "breach_minutes": breach_mins,
                        "escalation_count": incident.escalation_count
                    },
                    timestamp=now
                )
                db.add(audit)
                escalated_list.append(incident)

        if escalated_list:
            db.commit()

        return escalated_list

sla_monitor = SlaMonitorService()

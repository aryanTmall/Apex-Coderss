import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditEvent
from app.services.sim_clock import sim_clock

class AuditService:
    @staticmethod
    def record_event(
        db: Session,
        incident_id: Optional[str],
        event_type: str,
        actor: str,
        action: str,
        reason: str,
        from_status: Optional[str] = None,
        to_status: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ) -> AuditEvent:
        """
        Appends an immutable audit event linked into a cryptographic SHA-256 chain.
        Each event links to the preceding event's hash to ensure tamper evidence.
        """
        now = timestamp or sim_clock.now()

        # Find latest audit event for this incident or system-wide
        last_event = None
        if incident_id:
            last_event = (
                db.query(AuditEvent)
                .filter(AuditEvent.incident_id == incident_id)
                .order_by(AuditEvent.timestamp.desc(), AuditEvent.id.desc())
                .first()
            )
        if not last_event:
            last_event = (
                db.query(AuditEvent)
                .order_by(AuditEvent.timestamp.desc(), AuditEvent.id.desc())
                .first()
            )

        prev_hash = last_event.event_hash if (last_event and last_event.event_hash) else "0000000000000000"
        time_str = now.isoformat() if hasattr(now, "isoformat") else str(now)
        payload = f"{prev_hash}:{incident_id or 'SYSTEM'}:{event_type}:{action}:{actor}:{time_str}:{reason}"
        event_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]

        event = AuditEvent(
            id=f"evt_{uuid.uuid4().hex[:12]}",
            incident_id=incident_id,
            event_type=event_type,
            from_status=from_status,
            to_status=to_status,
            actor=actor,
            action=action,
            reason=reason,
            structured_metadata=metadata or {},
            previous_hash=prev_hash,
            event_hash=event_hash,
            timestamp=now
        )
        db.add(event)
        return event

audit_service = AuditService()

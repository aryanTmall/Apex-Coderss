from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import AuditEvent
from app.schemas.audit import AuditEventResponse

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("", response_model=List[AuditEventResponse])
def get_audit_events(
    since: Optional[datetime] = None,
    incident_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)

    if since:
        query = query.filter(AuditEvent.timestamp > since)
    if incident_id:
        query = query.filter(AuditEvent.incident_id == incident_id)

    return query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()

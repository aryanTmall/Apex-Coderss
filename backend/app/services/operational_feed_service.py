import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.incident import Incident
from app.models.hotspot import Hotspot
from app.models.contractor import Contractor
from app.models.operational_alert import OperationalAlertAcknowledgment
from app.services.sim_clock import sim_clock

logger = logging.getLogger("civichelp.services.operational_feed")


def get_current_operational_time() -> datetime:
    """Returns the effective operational timestamp from sim_clock or UTC now."""
    try:
        return sim_clock.now()
    except Exception:
        return datetime.now(timezone.utc)


def generate_operational_feed(
    db: Session,
    severity: Optional[str] = None,
    department_id: Optional[str] = None,
    ward_id: Optional[str] = None,
    event_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Generates real-time, action-oriented operational intelligence alerts from database state.
    Excludes citizen PII and whistleblower data.
    """
    now = get_current_operational_time()
    alerts: List[Dict[str, Any]] = []

    # 1. Fetch all existing acknowledgments
    acks = {
        ack.id: ack
        for ack in db.query(OperationalAlertAcknowledgment).all()
    }

    # 2. OVERDUE_SLA Alerts
    overdue_incidents = db.query(Incident).filter(
        Incident.sla_due_at != None,
        Incident.sla_due_at < now,
        ~Incident.status.in_(["RESOLVED", "CLOSED"])
    ).order_by(Incident.sla_due_at.desc()).limit(50).all()

    for inc in overdue_incidents:
        alert_id = f"OP-OVERDUE-{inc.id}"
        ack = acks.get(alert_id)
        current_status = ack.status if ack else "PENDING_ACTION"
        delay_hours = max(0.1, (now - inc.sla_due_at).total_seconds() / 3600.0)

        alerts.append({
            "id": alert_id,
            "event_type": "OVERDUE_SLA",
            "severity": "CRITICAL" if inc.priority >= 4 else "HIGH",
            "title": f"SLA Breached: {inc.tracking_id} ({inc.category})",
            "explanation": f"Incident has exceeded its resolution SLA by {delay_hours:.1f} hours. Priority P{inc.priority} requiring immediate operational intervention.",
            "incident_id": inc.id,
            "tracking_id": inc.tracking_id,
            "project_id": None,
            "department_id": inc.department_id,
            "ward_id": inc.approximate_locality,
            "timestamp": inc.sla_due_at.isoformat(),
            "status": current_status,
            "permitted_action": "ESCALATE_TIER",
            "action_url": f"/government/incidents/{inc.id}",
            "data_origin": "OBSERVED_FACT",
            "metadata": {
                "priority": inc.priority,
                "reopen_count": inc.reopen_count,
                "delay_hours": round(delay_hours, 1)
            }
        })

    # 3. SLA_APPROACHING Alerts (deadline within next 8 hours)
    approaching_window = now + timedelta(hours=8)
    approaching_incidents = db.query(Incident).filter(
        Incident.sla_due_at != None,
        Incident.sla_due_at >= now,
        Incident.sla_due_at <= approaching_window,
        ~Incident.status.in_(["RESOLVED", "CLOSED"])
    ).order_by(Incident.sla_due_at.asc()).limit(20).all()

    for inc in approaching_incidents:
        alert_id = f"OP-APPROACHING-{inc.id}"
        ack = acks.get(alert_id)
        current_status = ack.status if ack else "PENDING_ACTION"
        hours_remaining = max(0.1, (inc.sla_due_at - now).total_seconds() / 3600.0)

        alerts.append({
            "id": alert_id,
            "event_type": "SLA_APPROACHING",
            "severity": "HIGH" if hours_remaining < 3 else "MEDIUM",
            "title": f"SLA Approaching: {inc.tracking_id} ({hours_remaining:.1f}h remaining)",
            "explanation": f"Resolution SLA will breach in {hours_remaining:.1f} hours for priority P{inc.priority} {inc.category}. Field dispatch expedited.",
            "incident_id": inc.id,
            "tracking_id": inc.tracking_id,
            "project_id": None,
            "department_id": inc.department_id,
            "ward_id": inc.approximate_locality,
            "timestamp": now.isoformat(),
            "status": current_status,
            "permitted_action": "EXPEDITE_DISPATCH",
            "action_url": f"/government/incidents/{inc.id}",
            "data_origin": "CALCULATED_INDICATOR",
            "metadata": {
                "priority": inc.priority,
                "hours_remaining": round(hours_remaining, 1)
            }
        })

    # 4. URGENT_UNASSIGNED Incidents (P4/P5 with no department or status NEW)
    urgent_unassigned = db.query(Incident).filter(
        Incident.priority >= 4,
        or_(Incident.department_id == None, Incident.status == "NEW")
    ).order_by(Incident.created_at.desc()).limit(15).all()

    for inc in urgent_unassigned:
        alert_id = f"OP-UNASSIGNED-{inc.id}"
        ack = acks.get(alert_id)
        current_status = ack.status if ack else "PENDING_ACTION"

        alerts.append({
            "id": alert_id,
            "event_type": "URGENT_UNASSIGNED",
            "severity": "HIGH",
            "title": f"Urgent P{inc.priority} Incident Awaiting Assignment: {inc.tracking_id}",
            "explanation": f"High priority report '{inc.title}' is unassigned or pending initial triage. Immediate dispatcher routing required.",
            "incident_id": inc.id,
            "tracking_id": inc.tracking_id,
            "project_id": None,
            "department_id": inc.department_id,
            "ward_id": inc.approximate_locality,
            "timestamp": inc.created_at.isoformat(),
            "status": current_status,
            "permitted_action": "ASSIGN_DEPARTMENT",
            "action_url": f"/government/incidents/{inc.id}",
            "data_origin": "OBSERVED_FACT",
            "metadata": {
                "priority": inc.priority,
                "category": inc.category
            }
        })

    # 5. FAILED_CLOSURE / REOPENED Incidents
    reopened_incidents = db.query(Incident).filter(
        Incident.reopen_count > 0,
        Incident.status == "REOPENED"
    ).order_by(Incident.created_at.desc()).limit(15).all()

    for inc in reopened_incidents:
        alert_id = f"OP-REOPENED-{inc.id}"
        ack = acks.get(alert_id)
        current_status = ack.status if ack else "PENDING_ACTION"

        alerts.append({
            "id": alert_id,
            "event_type": "FAILED_CLOSURE",
            "severity": "HIGH",
            "title": f"Closure Contested: {inc.tracking_id} Reopened ({inc.reopen_count}x)",
            "explanation": f"Previous closure failed cryptographic validation or was rejected by citizen/auditor. Reopened {inc.reopen_count} time(s).",
            "incident_id": inc.id,
            "tracking_id": inc.tracking_id,
            "project_id": None,
            "department_id": inc.department_id,
            "ward_id": inc.approximate_locality,
            "timestamp": now.isoformat(),
            "status": current_status,
            "permitted_action": "INSPECT_CLOSURE_EVIDENCE",
            "action_url": "/government/verification",
            "data_origin": "OBSERVED_FACT",
            "metadata": {
                "reopen_count": inc.reopen_count,
                "priority": inc.priority
            }
        })

    # 6. SPATIAL_HOTSPOT Alerts
    active_hotspots = db.query(Hotspot).filter(
        Hotspot.is_active == True
    ).order_by(Hotspot.incident_count.desc()).limit(10).all()

    for hs in active_hotspots:
        alert_id = f"OP-HOTSPOT-{hs.id}"
        ack = acks.get(alert_id)
        current_status = ack.status if ack else "PENDING_ACTION"

        alerts.append({
            "id": alert_id,
            "event_type": "SPATIAL_HOTSPOT",
            "severity": hs.severity_level if hs.severity_level in ["CRITICAL", "HIGH", "MEDIUM", "INFO"] else "MEDIUM",
            "title": f"Spatial Hotspot Cluster: {hs.name or hs.category} ({hs.incident_count} reports)",
            "explanation": f"Localized cluster of {hs.incident_count} incidents within {hs.radius_meters:.0f}m in {hs.zone_name} at [{hs.center_latitude:.4f}, {hs.center_longitude:.4f}]. Systemic failure pattern detected.",
            "incident_id": None,
            "tracking_id": None,
            "project_id": None,
            "department_id": None,
            "ward_id": hs.zone_name,
            "timestamp": hs.detected_at.isoformat() if hs.detected_at else now.isoformat(),
            "status": current_status,
            "permitted_action": "INVESTIGATE_ROOT_CAUSE",
            "action_url": "/government/hotspots",
            "data_origin": "CALCULATED_INDICATOR",
            "metadata": {
                "incident_count": hs.incident_count,
                "radius_meters": hs.radius_meters
            }
        })

    # 7. CONTRACTOR_PERFORMANCE_ANOMALY Alerts
    underperforming_contractors = db.query(Contractor).filter(
        Contractor.trust_score < 80
    ).order_by(Contractor.trust_score.asc()).limit(10).all()

    for con in underperforming_contractors:
        alert_id = f"OP-CONTRACTOR-{con.id}"
        ack = acks.get(alert_id)
        current_status = ack.status if ack else "PENDING_ACTION"

        alerts.append({
            "id": alert_id,
            "event_type": "CONTRACTOR_ANOMALY",
            "severity": "CRITICAL" if con.trust_score < 60 else "HIGH",
            "title": f"Contractor Trust Dip: {con.name} ({con.trust_score}%)",
            "explanation": f"Trust score dropped to {con.trust_score}% due to delay penalties or defective closures. Official contract review required.",
            "incident_id": None,
            "tracking_id": None,
            "project_id": None,
            "department_id": None,
            "ward_id": None,
            "timestamp": now.isoformat(),
            "status": current_status,
            "permitted_action": "REVIEW_CONTRACTOR_SLA",
            "action_url": "/government/contractors",
            "data_origin": "CALCULATED_INDICATOR",
            "metadata": {
                "trust_score": con.trust_score,
                "contractor_id": con.id
            }
        })

    # Sort alerts: CRITICAL first, then HIGH, then MEDIUM, then by timestamp descending
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "INFO": 3}
    alerts.sort(key=lambda x: (
        0 if x["status"] == "PENDING_ACTION" else 1,
        severity_order.get(x["severity"], 4),
        x["timestamp"]
    ))

    # Apply filters
    filtered_alerts = alerts
    if severity and severity != "ALL":
        filtered_alerts = [a for a in filtered_alerts if a["severity"] == severity.upper()]
    if department_id and department_id != "ALL":
        filtered_alerts = [a for a in filtered_alerts if a.get("department_id") == department_id]
    if event_type and event_type != "ALL":
        filtered_alerts = [a for a in filtered_alerts if a["event_type"] == event_type.upper()]
    if status_filter and status_filter != "ALL":
        filtered_alerts = [a for a in filtered_alerts if a["status"] == status_filter.upper()]

    return filtered_alerts[:limit]


def acknowledge_alert(
    db: Session,
    alert_id: str,
    user_id: str,
    resolution_notes: Optional[str] = None,
    status: str = "ACKNOWLEDGED"
) -> Dict[str, Any]:
    """
    Records operator acknowledgment or resolution of an operational alert,
    preventing duplicate notifications.
    """
    existing = db.query(OperationalAlertAcknowledgment).filter(
        OperationalAlertAcknowledgment.id == alert_id
    ).first()

    now = datetime.now(timezone.utc)
    if existing:
        existing.status = status
        existing.resolution_notes = resolution_notes or existing.resolution_notes
        existing.user_id = user_id
        existing.acknowledged_at = now
    else:
        ack = OperationalAlertAcknowledgment(
            id=alert_id,
            user_id=user_id,
            status=status,
            resolution_notes=resolution_notes,
            acknowledged_at=now
        )
        db.add(ack)

    db.commit()
    return {
        "success": True,
        "alert_id": alert_id,
        "status": status,
        "acknowledged_at": now.isoformat(),
        "user_id": user_id
    }

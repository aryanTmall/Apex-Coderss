import uuid
from datetime import timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.report import CitizenReport
from app.models.hotspot import Hotspot
from app.models.escalation import EscalationRecord
from app.models.audit import AuditEvent
from app.services.duplicate_detection import haversine_distance
from app.services.sim_clock import sim_clock

TIER_CONFIG = {
    1: {"name": "Field Supervisor Escalation", "title": "Divisional Field Supervisor"},
    2: {"name": "Ward Authority Escalation", "title": "Ward Executive Engineer"},
    3: {"name": "City Commissioner Escalation", "title": "Municipal Commissioner / Chief City Engineer"}
}

class CivicIntelligenceService:

    @classmethod
    def check_recurring(cls, db: Session, incident: Incident) -> Dict[str, Any]:
        """
        Flags an incident as recurring if a resolved incident existed within 50m
        during the previous 30 days.
        """
        if incident.latitude is None or incident.longitude is None:
            return {"recurring": False, "prior_ids": [], "explanation": "Coordinates unavailable."}

        now = sim_clock.now()
        thirty_days_ago = now - timedelta(days=30)

        past_resolved = db.query(Incident).filter(
            Incident.id != incident.id,
            Incident.status == "RESOLVED",
            Incident.resolved_at >= thirty_days_ago,
            Incident.latitude != None,
            Incident.longitude != None
        ).all()

        matching_prior_ids = []
        for past in past_resolved:
            dist = haversine_distance(incident.latitude, incident.longitude, past.latitude, past.longitude)
            if dist <= 50.0:
                matching_prior_ids.append(past.id)

        if matching_prior_ids:
            return {
                "recurring": True,
                "prior_ids": matching_prior_ids,
                "explanation": f"Recurring incident detected within 50m of {len(matching_prior_ids)} previously resolved case(s) ({', '.join(matching_prior_ids[:3])}) within the last 30 days."
            }

        return {
            "recurring": False,
            "prior_ids": [],
            "explanation": "No matching resolved cases detected within 50m in the previous 30 days."
        }

    @classmethod
    def detect_root_causes(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Detects possible neighborhood-level systemic issues:
        - At least 3 distinct incidents
        - Fall within 150m radius
        - Created within rolling 7-day window
        - Multi-category (at least 2 distinct categories)
        """
        now = sim_clock.now()
        seven_days_ago = now - timedelta(days=7)

        recent_incidents = db.query(Incident).filter(
            Incident.created_at >= seven_days_ago,
            Incident.latitude != None,
            Incident.longitude != None
        ).all()

        if len(recent_incidents) < 3:
            return []

        hypotheses = []
        visited = set()

        for i, inc1 in enumerate(recent_incidents):
            if inc1.id in visited:
                continue

            cluster = [inc1]
            for j, inc2 in enumerate(recent_incidents):
                if i != j and inc2.id not in visited:
                    dist = haversine_distance(inc1.latitude, inc1.longitude, inc2.latitude, inc2.longitude)
                    if dist <= 150.0:
                        cluster.append(inc2)

            if len(cluster) >= 3:
                categories = {c.category for c in cluster}
                if len(categories) >= 2:
                    for c in cluster:
                        visited.add(c.id)

                    cluster_ids = [c.id for c in cluster]
                    cat_summary = ", ".join(sorted(list(categories)))
                    
                    if "water_leak" in categories and "pothole" in categories:
                        hypo_text = "Possible root-cause hypothesis: Subterranean water supply leakage causing structural asphalt washout and accelerated roadbed subsidence."
                    elif "drainage" in categories and "water_leak" in categories:
                        hypo_text = "Possible root-cause hypothesis: Stormwater drainage blockage triggering localized hydrostatic pressure and subterranean utility rupture."
                    else:
                        hypo_text = f"Possible root-cause hypothesis: Shared utility corridor failure impacting multiple civic vectors ({cat_summary}) within 150m."

                    hypotheses.append({
                        "hypothesis": hypo_text,
                        "cluster_size": len(cluster),
                        "incident_count": len(cluster),
                        "categories": sorted(list(categories)),
                        "incident_ids": cluster_ids,
                        "location_description": cluster[0].location_description or f"Sector near {cluster[0].latitude:.4f}, {cluster[0].longitude:.4f}",
                        "center_latitude": sum(c.latitude for c in cluster) / len(cluster),
                        "center_longitude": sum(c.longitude for c in cluster) / len(cluster),
                        "radius_meters": 150.0,
                    })

        return hypotheses

    @classmethod
    def sync_hotspots(cls, db: Session) -> List[Hotspot]:
        """
        Computes spatial hotspots (>=3 incidents within 150m in 7 days),
        synchronizes the Hotspot records in the database, and links incidents to their hotspot.
        """
        now = sim_clock.now()
        seven_days_ago = now - timedelta(days=7)

        recent_incidents = db.query(Incident).filter(
            Incident.created_at >= seven_days_ago,
            Incident.latitude != None,
            Incident.longitude != None
        ).all()

        hotspots_detected = []
        visited = set()

        for i, inc1 in enumerate(recent_incidents):
            if inc1.id in visited:
                continue

            cluster = [inc1]
            for j, inc2 in enumerate(recent_incidents):
                if i != j and inc2.id not in visited:
                    dist = haversine_distance(inc1.latitude, inc1.longitude, inc2.latitude, inc2.longitude)
                    if dist <= 150.0:
                        cluster.append(inc2)

            if len(cluster) >= 3:
                for c in cluster:
                    visited.add(c.id)

                cluster_ids = [c.id for c in cluster]
                avg_lat = sum(c.latitude for c in cluster) / len(cluster)
                avg_lon = sum(c.longitude for c in cluster) / len(cluster)

                # Determine dominant category
                cat_counts: Dict[str, int] = {}
                for c in cluster:
                    cat_counts[c.category] = cat_counts.get(c.category, 0) + 1
                dom_cat = max(cat_counts.items(), key=lambda x: x[1])[0]

                # Severity calculation
                max_priority = max(c.priority for c in cluster)
                reopen_sum = sum(c.reopen_count for c in cluster)
                if max_priority >= 5 or reopen_sum >= 2 or len(cluster) >= 5:
                    sev = "CRITICAL"
                elif max_priority >= 4 or len(cluster) >= 4:
                    sev = "HIGH"
                else:
                    sev = "MEDIUM"

                zone_desc = cluster[0].approximate_locality or cluster[0].location_description or f"Zone ({avg_lat:.3f}, {avg_lon:.3f})"
                name = f"{dom_cat.replace('_', ' ').title()} Cluster — {zone_desc}"
                hotspot_id = f"hotspot_{uuid.uuid4().hex[:10]}"

                # Update or insert Hotspot in DB
                existing_hs = db.query(Hotspot).filter(Hotspot.id == hotspot_id).first()
                if not existing_hs:
                    # check if any existing hotspot covers this center within 100m
                    for hs in db.query(Hotspot).filter(Hotspot.is_active == True).all():
                        if haversine_distance(avg_lat, avg_lon, hs.center_latitude, hs.center_longitude) <= 100.0:
                            existing_hs = hs
                            break

                if existing_hs:
                    existing_hs.incident_count = len(cluster)
                    existing_hs.incident_ids = cluster_ids
                    existing_hs.center_latitude = avg_lat
                    existing_hs.center_longitude = avg_lon
                    existing_hs.severity_level = sev
                    existing_hs.last_activity_at = now
                    existing_hs.is_active = True
                    target_hs = existing_hs
                else:
                    target_hs = Hotspot(
                        id=hotspot_id,
                        name=name,
                        category=dom_cat,
                        zone_name=zone_desc,
                        center_latitude=avg_lat,
                        center_longitude=avg_lon,
                        radius_meters=150.0,
                        incident_count=len(cluster),
                        severity_level=sev,
                        incident_ids=cluster_ids,
                        detected_at=cluster[0].created_at,
                        last_activity_at=now,
                        is_active=True
                    )
                    db.add(target_hs)

                # Link incidents to hotspot
                for c in cluster:
                    c.hotspot_id = target_hs.id

                hotspots_detected.append(target_hs)

        db.commit()
        return hotspots_detected

    @classmethod
    def escalate_tier(
        cls,
        db: Session,
        incident: Incident,
        tier: int,
        reason: str,
        actor: str = "SYSTEM:escalation"
    ) -> EscalationRecord:
        """
        Applies a multi-tier governance escalation (Tier 1: Supervisor, Tier 2: Ward Authority, Tier 3: Commissioner).
        Logs both an AuditEvent and an EscalationRecord.
        """
        now = sim_clock.now()
        tier = max(1, min(3, tier))
        incident.escalation_tier = tier
        if incident.status not in ["ESCALATED", "RESOLVED"]:
            incident.status = "ESCALATED"
        incident.escalation_count += 1

        cfg = TIER_CONFIG.get(tier, TIER_CONFIG[1])
        rec = EscalationRecord(
            id=f"esc_{uuid.uuid4().hex[:10]}",
            incident_id=incident.id,
            tier=tier,
            tier_name=cfg["name"],
            authority_title=cfg["title"],
            reason=reason,
            triggered_at=now
        )
        db.add(rec)

        audit = AuditEvent(
            id=f"evt_{uuid.uuid4().hex[:12]}",
            incident_id=incident.id,
            event_type="GOVERNANCE_ESCALATION",
            from_status=incident.status,
            to_status="ESCALATED",
            actor=actor,
            action=f"ESCALATION_TIER_{tier}",
            reason=f"Governance Escalation to Level {tier} ({cfg['name']}): {reason}",
            structured_metadata={
                "tier": tier,
                "tier_name": cfg["name"],
                "authority_title": cfg["title"],
                "reason": reason
            },
            timestamp=now
        )
        db.add(audit)
        db.commit()
        db.refresh(rec)
        return rec

    @classmethod
    def get_unconfirmed_reports(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Fetches all citizen reports or incidents submitted in UNCONFIRMED mode
        awaiting operator triage or corroboration.
        """
        unconfirmed = db.query(CitizenReport).filter(
            (CitizenReport.location_mode == "UNCONFIRMED") |
            (CitizenReport.location_status == "LOCATION_UNCONFIRMED")
        ).order_by(CitizenReport.created_at.desc()).all()

        results = []
        for rep in unconfirmed:
            results.append({
                "report_id": rep.id,
                "tracking_id": rep.tracking_id,
                "incident_id": rep.incident_id,
                "category": rep.category,
                "custom_category": rep.custom_category,
                "text": rep.text,
                "approximate_locality": rep.approximate_locality,
                "observation_time": rep.observation_time,
                "location_description": rep.location_description,
                "location_status": rep.location_status,
                "created_at": rep.created_at.isoformat(),
                "reporter_name": rep.reporter_name
            })
        return results

    @classmethod
    def corroborate_unconfirmed_report(
        cls,
        db: Session,
        report_id: str,
        latitude: float,
        longitude: float,
        address: str,
        operator_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Corroborates an unconfirmed citizen report by assigning verified coordinates
        and updating its status to CORROBORATED.
        """
        report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
        if not report:
            raise ValueError(f"Report {report_id} not found.")

        now = sim_clock.now()
        report.latitude = latitude
        report.longitude = longitude
        report.address = address
        report.location_mode = "PRECISE"
        report.location_status = "CORROBORATED"

        if report.incident_id:
            incident = db.query(Incident).filter(Incident.id == report.incident_id).first()
            if incident and (incident.latitude is None or incident.location_mode == "UNCONFIRMED"):
                incident.latitude = latitude
                incident.longitude = longitude
                incident.address = address
                incident.location_mode = "PRECISE"
                incident.location_status = "CORROBORATED"

                audit = AuditEvent(
                    id=f"evt_{uuid.uuid4().hex[:12]}",
                    incident_id=incident.id,
                    event_type="LOCATION_CORROBORATED",
                    from_status=incident.status,
                    to_status=incident.status,
                    actor="OPERATOR:triage",
                    action="CORROBORATE_LOCATION",
                    reason=f"Unconfirmed report coordinates verified at ({latitude:.5f}, {longitude:.5f}). Notes: {operator_notes or 'Field verification complete.'}",
                    structured_metadata={
                        "latitude": latitude,
                        "longitude": longitude,
                        "address": address,
                        "report_id": report_id
                    },
                    timestamp=now
                )
                db.add(audit)

        db.commit()
        return {
            "status": "success",
            "report_id": report_id,
            "location_status": "CORROBORATED",
            "latitude": latitude,
            "longitude": longitude,
            "address": address
        }

civic_intelligence = CivicIntelligenceService()

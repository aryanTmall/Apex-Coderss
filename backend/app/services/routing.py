import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.department import Department
from app.models.audit import AuditEvent
from app.services.sim_clock import sim_clock
from app.services.state_machine import SLA_HOURS_BY_PRIORITY

CATEGORY_DEFAULT_DEPT = {
    "pothole": "dept_roads",
    "road_damage": "dept_roads",
    "streetlight": "dept_streetlights",
    "garbage": "dept_sanitation",
    "water_leak": "dept_water",
    "drainage": "dept_drainage",
    "other": "dept_sanitation"
}

DEFAULT_DEPARTMENTS = [
    {
        "id": "dept_roads",
        "name": "Roads & PWD",
        "supported_categories": ["pothole", "road_damage"],
        "available": True,
        "escalation_level": 0,
        "trust_score": 85,
        "spoofing_flags_count": 1,
        "fallback_department_id": "dept_sanitation"
    },
    {
        "id": "dept_water",
        "name": "Water Supply",
        "supported_categories": ["water_leak", "pipe_burst"],
        "available": True,
        "escalation_level": 0,
        "trust_score": 92,
        "spoofing_flags_count": 0,
        "fallback_department_id": "dept_drainage"
    },
    {
        "id": "dept_sanitation",
        "name": "Sanitation",
        "supported_categories": ["garbage", "sanitation", "dumping"],
        "available": True,
        "escalation_level": 0,
        "trust_score": 98,
        "spoofing_flags_count": 0,
        "fallback_department_id": "dept_roads"
    },
    {
        "id": "dept_streetlights",
        "name": "Streetlights",
        "supported_categories": ["streetlight", "electrical"],
        "available": True,
        "escalation_level": 0,
        "trust_score": 100,
        "spoofing_flags_count": 0,
        "fallback_department_id": "dept_roads"
    },
    {
        "id": "dept_drainage",
        "name": "Drainage",
        "supported_categories": ["drainage", "sewer", "flooding"],
        "available": True,
        "escalation_level": 0,
        "trust_score": 95,
        "spoofing_flags_count": 0,
        "fallback_department_id": "dept_water"
    }
]

class RoutingService:

    @classmethod
    def seed_departments(cls, db: Session):
        """Initializes the 5 core departments if not present."""
        for dept_data in DEFAULT_DEPARTMENTS:
            existing = db.query(Department).filter(Department.id == dept_data["id"]).first()
            if not existing:
                dept = Department(
                    id=dept_data["id"],
                    name=dept_data["name"],
                    supported_categories=dept_data["supported_categories"],
                    available=dept_data["available"],
                    escalation_level=dept_data["escalation_level"],
                    trust_score=dept_data.get("trust_score", 100),
                    spoofing_flags_count=dept_data.get("spoofing_flags_count", 0),
                    fallback_department_id=dept_data["fallback_department_id"],
                    created_at=sim_clock.now(),
                    updated_at=sim_clock.now()
                )
                db.add(dept)
            else:
                existing.name = dept_data["name"]
                if hasattr(existing, "trust_score") and existing.trust_score is None:
                    existing.trust_score = dept_data.get("trust_score", 100)
                if hasattr(existing, "spoofing_flags_count") and existing.spoofing_flags_count is None:
                    existing.spoofing_flags_count = dept_data.get("spoofing_flags_count", 0)
        db.commit()

    @classmethod
    def route_incident(
        cls,
        db: Session,
        category: str,
        incident_id: Optional[str] = None
    ) -> Tuple[str, str, bool]:
        """
        Determines the appropriate department.
        Returns (department_id, rationale, was_fallback_used).
        If department is unavailable, routes to its fallback.
        """
        target_dept_id = CATEGORY_DEFAULT_DEPT.get(category.lower(), "dept_sanitation")
        dept = db.query(Department).filter(Department.id == target_dept_id).first()

        if not dept:
            # Fallback if DB not seeded
            return target_dept_id, f"Routed directly to default department {target_dept_id}.", False

        if dept.available:
            return dept.id, f"Assigned to {dept.name} based on category '{category}'.", False

        # Department is unavailable -> Fallback
        fallback_id = dept.fallback_department_id or "dept_sanitation"
        fallback_dept = db.query(Department).filter(Department.id == fallback_id).first()
        fallback_name = fallback_dept.name if fallback_dept else fallback_id
        rationale = f"Primary department '{dept.name}' is currently unavailable. Routed to configured fallback '{fallback_name}'."

        if incident_id:
            audit = AuditEvent(
                id=f"evt_{uuid.uuid4().hex[:12]}",
                incident_id=incident_id,
                event_type="ROUTING_FALLBACK",
                from_status=None,
                to_status=None,
                actor="AGENT:router",
                action="ASSIGN_FALLBACK",
                reason=rationale,
                structured_metadata={
                    "primary_department": dept.id,
                    "fallback_department": fallback_id,
                    "category": category
                },
                timestamp=sim_clock.now()
            )
            db.add(audit)

        return fallback_id, rationale, True

    @classmethod
    def calculate_sla_due(cls, priority: int) -> datetime:
        now = sim_clock.now()
        hours = SLA_HOURS_BY_PRIORITY.get(priority, 24)
        return now + timedelta(hours=hours)

router_service = RoutingService()

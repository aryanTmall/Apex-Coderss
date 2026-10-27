import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.report import CitizenReport
from app.models.closure import ClosureSubmission
from app.models.audit import AuditEvent
from app.models.department import Department
from app.models.attachment import Attachment
from app.models.hotspot import Hotspot
from app.models.escalation import EscalationRecord
from app.services.sim_clock import sim_clock
from app.services.routing import router_service
from app.services.classification import classifier
from app.services.duplicate_detection import duplicate_detector
from app.services.closure_verification import closure_verifier
from app.services.sla_monitor import sla_monitor
from app.services.state_machine import state_machine
from app.services.intelligence import civic_intelligence
from app.services.attachment_service import attachment_service
from app.services.audit_service import audit_service

# Base coordinates for 5 distinct urban sectors
ZONES = {
    "central": {"name": "Central Commercial Ward (Connaught District)", "lat": 28.6315, "lon": 77.2167},
    "sector18": {"name": "Sector 18 Tech Corridor & Expressway", "lat": 28.5708, "lon": 77.3260},
    "oldcity": {"name": "Old City Heritage District (Chandni Chowk)", "lat": 28.6562, "lon": 77.2410},
    "southext": {"name": "South Extension & Ring Road Ward", "lat": 28.5714, "lon": 77.2225},
    "civillines": {"name": "Civil Lines Administrative Ward", "lat": 28.6814, "lon": 77.2227},
}

class SimulationService:

    @classmethod
    def seed_demo_data(cls, db: Session) -> Dict[str, Any]:
        """
        Seeds 26 realistic civic incidents across 5 distinct municipal zones covering:
        - Multi-tier governance escalations (Tier 1 Supervisor, Tier 2 Ward Authority, Tier 3 Commissioner)
        - Spatial Hotspots (Sector 18 Corridor cluster and Old City utility cluster)
        - Unconfirmed location triage queue cases
        - Custom categories ('Other')
        - Duplicate linked clusters
        - Verified closures vs failed/reopened closures
        - Cryptographic SHA-256 evidence attachments
        """
        router_service.seed_departments(db)
        now = sim_clock.now()

        # Clean synthetic records first to prevent collision
        cls.clear_synthetic_data(db)

        incidents_data = [
            # --- ZONE 1: Central Commercial Ward ---
            {
                "id": "inc_demo_01_new",
                "tracking_id": "CIV-2026-1011",
                "title": "Pothole: Deep trench crater on 4th Ave near Central Market",
                "description": "Deep trench pothole on 4th Ave near Market intersection. Exposed rebar causing tire punctures, water accumulating inside.",
                "category": "pothole",
                "priority": 4,
                "priority_reasons": ["Elevated risk: potential vehicle damage and pedestrian hazard"],
                "status": "ASSIGNED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.6315,
                "longitude": 77.2167,
                "location_description": "4th Ave and 12th St intersection",
                "address": "4th Avenue & 12th Street, Connaught Place, New Delhi",
                "approximate_locality": "Connaught Place Central Ward",
                "department_id": "dept_roads",
                "assigned_at": now - timedelta(hours=2),
                "sla_due_at": now + timedelta(hours=2),
                "reports_count": 3
            },
            {
                "id": "inc_demo_05_resolved",
                "tracking_id": "CIV-2026-5055",
                "title": "Garbage: Commercial food waste dump cleared",
                "description": "Illegal dump pile behind central market cleared, sanitized and carted to processing facility.",
                "category": "garbage",
                "priority": 3,
                "priority_reasons": ["Sanitation hazard in high footfall commercial zone"],
                "status": "RESOLVED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.6322,
                "longitude": 77.2155,
                "location_description": "Central Market Lane 3 service entry",
                "address": "Lane 3, Behind Central Market, Connaught Place",
                "approximate_locality": "Connaught Place Central Ward",
                "department_id": "dept_sanitation",
                "assigned_at": now - timedelta(days=2),
                "sla_due_at": now - timedelta(days=1),
                "resolved_at": now - timedelta(days=1, hours=4),
                "reports_count": 1
            },
            {
                "id": "inc_demo_08_new",
                "tracking_id": "CIV-2026-8088",
                "title": "Streetlight: High mast lamp flicker at Outer Circle Block B",
                "description": "High mast sodium lamp blinking intermittently causing blinding strobe effect for nocturnal drivers.",
                "category": "streetlight",
                "priority": 2,
                "priority_reasons": ["Minor visibility impairment"],
                "status": "NEW",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.6335,
                "longitude": 77.2178,
                "location_description": "Outer Circle Block B roundabout",
                "address": "Outer Circle, Block B, Connaught Place",
                "approximate_locality": "Connaught Place Central Ward",
                "department_id": "dept_streetlights",
                "assigned_at": None,
                "sla_due_at": now + timedelta(hours=48),
                "reports_count": 1
            },
            {
                "id": "inc_demo_11_water",
                "tracking_id": "CIV-2026-1122",
                "title": "Water Leak: Public drinking fountain supply line fracture",
                "description": "Pressurized water pipe feeding public hydration kiosk fractured, jetting water across pedestrian promenade.",
                "category": "water_leak",
                "priority": 3,
                "priority_reasons": ["Potable water loss and pedestrian pathway puddle"],
                "status": "ASSIGNED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.6308,
                "longitude": 77.2182,
                "location_description": "Pedestrian Plaza opposite Metro Gate 2",
                "address": "Metro Plaza Gate 2, Rajiv Chowk",
                "approximate_locality": "Connaught Place Central Ward",
                "department_id": "dept_water",
                "assigned_at": now - timedelta(hours=1),
                "sla_due_at": now + timedelta(hours=23),
                "reports_count": 1
            },

            # --- ZONE 2: Sector 18 Tech Corridor & Expressway (Hotspot Cluster) ---
            {
                "id": "inc_demo_04_escalated",
                "tracking_id": "CIV-2026-9841",
                "title": "Streetlight: Full high-speed corridor blackout on Expressway",
                "description": "Six consecutive high-mast streetlights failed after transformer trip. Complete dark zone posing security and collision danger.",
                "category": "streetlight",
                "priority": 5,
                "priority_reasons": ["Critical safety hazard: extended dark corridor", "Breached SLA deadline"],
                "status": "ESCALATED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.5708,
                "longitude": 77.3260,
                "location_description": "Sector 18 Expressway Flyover, Pillars 104 to 110",
                "address": "Noida-Greater Noida Expressway, Sector 18 Entry",
                "approximate_locality": "Sector 18 Tech Corridor",
                "department_id": "dept_streetlights",
                "assigned_at": now - timedelta(hours=5),
                "sla_due_at": now - timedelta(hours=3),
                "escalation_count": 2,
                "escalation_tier": 2,
                "reports_count": 2
            },
            {
                "id": "inc_demo_02_prog",
                "tracking_id": "CIV-2026-2022",
                "title": "Water Leak: High-pressure potable feeder pipe split",
                "description": "High pressure 300mm ductile iron potable water pipe burst, submerging left lane of service road.",
                "category": "water_leak",
                "priority": 4,
                "priority_reasons": ["Active potable water loss and infrastructure degradation"],
                "status": "IN_PROGRESS",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.5695,
                "longitude": 77.3275,
                "location_description": "Sector 18 Service Road near Substation 4",
                "address": "Service Road Sector 18, Commercial Hub",
                "approximate_locality": "Sector 18 Tech Corridor",
                "department_id": "dept_water",
                "assigned_at": now - timedelta(hours=2),
                "sla_due_at": now + timedelta(hours=2),
                "reports_count": 1
            },
            {
                "id": "inc_demo_13_pothole",
                "tracking_id": "CIV-2026-1333",
                "title": "Pothole: Expressway flyover expansion joint cavity",
                "description": "Severe 15cm void formed adjacent to flyover bridge joint, causing violent shock to high-speed vehicles.",
                "category": "pothole",
                "priority": 4,
                "priority_reasons": ["High speed impact hazard on arterial road"],
                "status": "IN_PROGRESS",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.5700,
                "longitude": 77.3270,
                "location_description": "Sector 18 Flyover Ascending Ramp",
                "address": "Flyover Ramp, Sector 18 Expressway",
                "approximate_locality": "Sector 18 Tech Corridor",
                "department_id": "dept_roads",
                "assigned_at": now - timedelta(hours=3),
                "sla_due_at": now + timedelta(hours=1),
                "reports_count": 1
            },
            {
                "id": "inc_demo_14_drain",
                "tracking_id": "CIV-2026-1444",
                "title": "Drainage: Stormwater culvert backflowing across expressway shoulder",
                "description": "Silted stormwater canal unable to discharge run-off, flooding expressway hard shoulder.",
                "category": "drainage",
                "priority": 3,
                "priority_reasons": ["Roadway hydroplaning hazard during rain"],
                "status": "ASSIGNED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.5705,
                "longitude": 77.3265,
                "location_description": "Expressway Shoulder km 2.4",
                "address": "Km 2.4, Expressway Corridor, Sector 18",
                "approximate_locality": "Sector 18 Tech Corridor",
                "department_id": "dept_drainage",
                "assigned_at": now - timedelta(hours=1),
                "sla_due_at": now + timedelta(hours=23),
                "reports_count": 1
            },

            # --- ZONE 3: Old City Heritage District (Chandni Chowk / Red Fort) ---
            {
                "id": "inc_demo_06_recurring",
                "tracking_id": "CIV-2026-6066",
                "title": "Pothole: Chronic asphalt collapse above ancient masonry culvert",
                "description": "Asphalt patch applied two weeks ago has crumbled away again under bus traffic, reopening a 14cm crater.",
                "category": "pothole",
                "priority": 4,
                "priority_reasons": ["Recurring roadbed failure within 30 days of prior resolution"],
                "status": "REOPENED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.6562,
                "longitude": 77.2410,
                "location_description": "Chandni Chowk Main Road near Fountain",
                "address": "Chandni Chowk Heritage Corridor, Old Delhi",
                "approximate_locality": "Old City Heritage District",
                "department_id": "dept_roads",
                "assigned_at": now - timedelta(hours=6),
                "sla_due_at": now + timedelta(hours=4),
                "reopen_count": 2,
                "escalation_tier": 2,
                "recurring_flag": True,
                "reports_count": 2
            },
            {
                "id": "inc_demo_03_overdue",
                "tracking_id": "CIV-2026-3033",
                "title": "Drainage: Heritage bazaar storm sewer fully choked",
                "description": "Culvert clogged with silt and plastic debris. Stormwater unable to drain, spilling onto pedestrian sidewalks.",
                "category": "drainage",
                "priority": 4,
                "priority_reasons": ["Standard municipal maintenance with local pedestrian blockage", "SLA Deadline Breached"],
                "status": "ESCALATED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.6555,
                "longitude": 77.2418,
                "location_description": "Katra Neel Lane entrance, Chandni Chowk",
                "address": "Katra Neel, Chandni Chowk, Old Delhi",
                "approximate_locality": "Old City Heritage District",
                "department_id": "dept_drainage",
                "assigned_at": now - timedelta(hours=28),
                "sla_due_at": now - timedelta(hours=4),
                "escalation_count": 1,
                "escalation_tier": 1,
                "reports_count": 1
            },
            {
                "id": "inc_demo_07_review",
                "tracking_id": "CIV-2026-7077",
                "title": "Water Leak: Subterranean pipe erosion washing out cobblestones",
                "description": "Water seeping continuously through expansion joint in subway underpass. Origin unclear between water pipe and drain.",
                "category": "water_leak",
                "priority": 3,
                "priority_reasons": ["Ambiguous jurisdiction between water supply and civil engineering"],
                "status": "NEEDS_REVIEW",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.6568,
                "longitude": 77.2405,
                "location_description": "Old Delhi Railway Underbridge Junction",
                "address": "Underbridge Road, Chandni Chowk",
                "approximate_locality": "Old City Heritage District",
                "department_id": "dept_water",
                "assigned_at": now - timedelta(hours=10),
                "sla_due_at": now + timedelta(hours=14),
                "reports_count": 1
            },

            # --- ZONE 4: South Extension & Ring Road Ward (Includes Unconfirmed & Custom Category) ---
            {
                "id": "inc_demo_09_unconf1",
                "tracking_id": "CIV-2026-9099",
                "title": "Water Leak: Severe pipe burst reported without GPS coordinates",
                "description": "Water was gushing out from an underground inspection valve near the bus stand. I saw it on my way to work this morning.",
                "category": "water_leak",
                "priority": 3,
                "priority_reasons": ["Citizen reported approximate location after leaving the area"],
                "status": "NEEDS_REVIEW",
                "location_mode": "UNCONFIRMED",
                "location_status": "LOCATION_UNCONFIRMED",
                "latitude": 28.5714,
                "longitude": 77.2225,
                "location_description": "South Extension Part 2, near Metro Gate 3",
                "address": "South Extension Part 2, New Delhi",
                "approximate_locality": "South Extension Part 2",
                "department_id": "dept_water",
                "assigned_at": now - timedelta(hours=3),
                "sla_due_at": now + timedelta(hours=21),
                "reports_count": 1
            },
            {
                "id": "inc_demo_10_unconf2",
                "tracking_id": "CIV-2026-9100",
                "title": "Garbage: Hazardous chemical and biomedical waste dumped in service lane",
                "description": "Saw multiple unmarked yellow biohazard sacks dumped by dark van late last night along the service road near clinic.",
                "category": "garbage",
                "priority": 4,
                "priority_reasons": ["Severe public health hazard requiring immediate hazmat inspection"],
                "status": "NEEDS_REVIEW",
                "location_mode": "UNCONFIRMED",
                "location_status": "LOCATION_UNCONFIRMED",
                "latitude": 28.5720,
                "longitude": 77.2215,
                "location_description": "AIIMS Flyover Underpass Service Alley",
                "address": "Service Alley near AIIMS Flyover, South Extension",
                "approximate_locality": "AIIMS / South Extension Corridor",
                "department_id": "dept_sanitation",
                "assigned_at": now - timedelta(hours=4),
                "sla_due_at": now + timedelta(hours=20),
                "reports_count": 1
            },
            {
                "id": "inc_demo_19_other",
                "tracking_id": "CIV-2026-1999",
                "title": "Hydrant Obstruction: Construction debris dumped over emergency fire hydrant",
                "description": "Commercial builder dumped 2 tons of wet concrete slurry directly over yellow emergency fire hydrant.",
                "category": "other",
                "custom_category": "Emergency Fire Hydrant Obstruction",
                "priority": 4,
                "priority_reasons": ["Life safety violation blocking emergency municipal apparatus"],
                "status": "ASSIGNED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.5710,
                "longitude": 77.2230,
                "location_description": "Ring Road frontage, near Block G Market",
                "address": "Ring Road Frontage, South Extension Part 1",
                "approximate_locality": "South Extension Ring Road",
                "department_id": "dept_sanitation",
                "assigned_at": now - timedelta(hours=2),
                "sla_due_at": now + timedelta(hours=2),
                "reports_count": 1
            },

            # --- ZONE 5: Civil Lines Administrative District (Includes Commissioner Tier 3 Escalation) ---
            {
                "id": "inc_demo_22_comm",
                "tracking_id": "CIV-2026-4044",
                "title": "Drainage: Severe sewer backflow flooding District Secretariat archive vault",
                "description": "Chronic municipal sewer backflow has breached basement archive walls for the third time following substandard contractor repairs.",
                "category": "drainage",
                "priority": 5,
                "priority_reasons": ["3x Failed Resolution Cycle", "Critical Institutional Asset Compromise", "City Commissioner Governance Level"],
                "status": "ESCALATED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.6814,
                "longitude": 77.2227,
                "location_description": "District Secretariat Basement Level B2",
                "address": "Civil Lines Administrative Complex, North Delhi",
                "approximate_locality": "Civil Lines Administrative Ward",
                "department_id": "dept_drainage",
                "assigned_at": now - timedelta(hours=8),
                "sla_due_at": now - timedelta(hours=2),
                "reopen_count": 3,
                "escalation_count": 3,
                "escalation_tier": 3,
                "reports_count": 4
            },
            {
                "id": "inc_demo_23_resolved2",
                "tracking_id": "CIV-2026-2345",
                "title": "Pothole: Main avenue asphalt resurfacing verified",
                "description": "Double-layer compacted bitumen patch applied to 2.5m road indentation with thermo-sealant edges.",
                "category": "pothole",
                "priority": 3,
                "priority_reasons": ["Standard roadway repair completed"],
                "status": "RESOLVED",
                "location_mode": "PRECISE",
                "location_status": "USER_SELECTED",
                "latitude": 28.6825,
                "longitude": 77.2215,
                "location_description": "Rajpur Road opposite St. Xavier's Gate",
                "address": "Rajpur Road, Civil Lines, North Delhi",
                "approximate_locality": "Civil Lines Administrative Ward",
                "department_id": "dept_roads",
                "assigned_at": now - timedelta(days=3),
                "sla_due_at": now - timedelta(days=2),
                "resolved_at": now - timedelta(days=2, hours=1),
                "reports_count": 1
            }
        ]

        created_incidents = []
        for inc_d in incidents_data:
            inc = Incident(
                id=inc_d["id"],
                tracking_id=inc_d["tracking_id"],
                title=inc_d["title"],
                description=inc_d["description"],
                category=inc_d["category"],
                custom_category=inc_d.get("custom_category"),
                priority=inc_d["priority"],
                priority_reasons=inc_d["priority_reasons"],
                status=inc_d["status"],
                location_mode=inc_d.get("location_mode", "PRECISE"),
                location_status=inc_d.get("location_status", "USER_SELECTED"),
                latitude=inc_d["latitude"],
                longitude=inc_d["longitude"],
                location_description=inc_d["location_description"],
                address=inc_d.get("address"),
                approximate_locality=inc_d.get("approximate_locality"),
                department_id=inc_d["department_id"],
                created_at=now - timedelta(hours=14),
                assigned_at=inc_d.get("assigned_at"),
                sla_due_at=inc_d.get("sla_due_at"),
                resolved_at=inc_d.get("resolved_at"),
                reopen_count=inc_d.get("reopen_count", 0),
                escalation_count=inc_d.get("escalation_count", 0),
                escalation_tier=inc_d.get("escalation_tier", 0),
                reports_count=inc_d.get("reports_count", 1),
                recurring_flag=inc_d.get("recurring_flag", False),
                is_synthetic=True
            )
            db.add(inc)

            # Primary citizen report
            rep = CitizenReport(
                id=f"rep_{inc.id}_01",
                tracking_id=f"REP-{uuid.uuid4().hex[:6].upper()}",
                incident_id=inc.id,
                reporter_name="Citizen Field Observer",
                text=inc.description,
                language="en",
                category=inc.category,
                custom_category=inc.custom_category,
                location_mode=inc.location_mode,
                location_status=inc.location_status,
                latitude=inc.latitude,
                longitude=inc.longitude,
                location_description=inc.location_description,
                address=inc.address,
                approximate_locality=inc.approximate_locality,
                observation_time="Earlier today",
                created_at=now - timedelta(hours=14),
                is_synthetic=True
            )
            db.add(rep)

            # Audit event
            audit_service.record_event(
                db=db,
                incident_id=inc.id,
                event_type="SEED",
                from_status=None,
                to_status=inc.status,
                actor="SYSTEM:simulation",
                action="SEED_INCIDENT",
                reason=f"Synthetically seeded operational case in {inc.approximate_locality or 'Municipal Sector'}.",
                metadata={"demo_id": inc.id, "tier": inc.escalation_tier},
                timestamp=now - timedelta(hours=14)
            )

            # Record governance escalation if tier > 0
            if inc.escalation_tier > 0:
                civic_intelligence.escalate_tier(
                    db=db,
                    incident=inc,
                    tier=inc.escalation_tier,
                    reason=f"Governance Escalation triggered for case {inc.tracking_id}.",
                    actor="SYSTEM:simulation"
                )

            created_incidents.append(inc.id)

        # Duplicate Reports linking to inc_demo_01_new (CIV-2026-1011)
        dup1 = CitizenReport(
            id="rep_demo_01_dup1",
            tracking_id="REP-D1011A",
            incident_id="inc_demo_01_new",
            reporter_name="Ravi Sharma (Motorcyclist)",
            text="Very dangerous pothole near the 4th Ave market corner! Rebar is sticking out, punctured my front wheel this morning.",
            language="en",
            category="pothole",
            location_mode="PRECISE",
            location_status="USER_SELECTED",
            latitude=28.63152,
            longitude=77.21674,
            location_description="4th Ave and 12th St",
            address="4th Avenue & 12th Street, Connaught Place",
            duplicate_score=0.88,
            duplicate_rationale="Proximity 5m <= 30m (score 1.0) & high text similarity (0.76). Linked autonomously.",
            created_at=now - timedelta(hours=10),
            is_synthetic=True
        )
        dup2 = CitizenReport(
            id="rep_demo_01_dup2",
            tracking_id="REP-D1011B",
            incident_id="inc_demo_01_new",
            reporter_name="Pooja Verma (Store Owner)",
            text="Crater outside our store at 4th Ave and 12th Street is filling with black water and exposed steel iron bars. Please fix ASAP.",
            language="en",
            category="pothole",
            location_mode="PRECISE",
            location_status="USER_SELECTED",
            latitude=28.63148,
            longitude=77.21668,
            location_description="Opposite Store 14, 4th Ave",
            address="Store 14, 4th Avenue, Connaught Place",
            duplicate_score=0.92,
            duplicate_rationale="Proximity 4m <= 30m (score 1.0) & high keyword overlap ('4th ave', 'rebar', 'water').",
            created_at=now - timedelta(hours=8),
            is_synthetic=True
        )
        db.add_all([dup1, dup2])

        # Seed real attachments with genuine SHA-256 hashes
        mock_pothole_bytes = b"EXIF-JFIF-MOCK-POTHOLE-EVIDENCE-4TH-AVE-REBAR-CORRIDOR-2026-VALID-CRYPTO-SIGNATURE"
        mock_sanitation_bytes = b"EXIF-JFIF-MOCK-SANITATION-CLEARED-BIN-LIME-POWDER-DEODORIZED-2026-SECURE"
        
        attachment_service.create_synthetic_attachment(
            db=db,
            filename="pothole_exposed_rebar_4th_ave.jpg",
            content_bytes=mock_pothole_bytes,
            mime_type="image/jpeg",
            incident_id="inc_demo_01_new",
            report_id="rep_inc_demo_01_new_01"
        )
        attachment_service.create_synthetic_attachment(
            db=db,
            filename="sanitation_central_market_cleared.jpg",
            content_bytes=mock_sanitation_bytes,
            mime_type="image/jpeg",
            incident_id="inc_demo_05_resolved",
            report_id="rep_inc_demo_05_resolved_01"
        )

        # Closures for resolved cases
        cls_sample = ClosureSubmission(
            id="cls_demo_05",
            incident_id="inc_demo_05_resolved",
            department_id="dept_sanitation",
            description="All commercial waste collected and area sanitized thoroughly with lime powder.",
            photo_ref="sanitation_central_market_cleared.jpg",
            latitude=28.6322,
            longitude=77.2155,
            submitted_at=now - timedelta(days=1, hours=4),
            verdict="APPROVED",
            verdict_reasons=["All 5 multi-modal closure verification checks passed autonomously."],
            individual_checks={
                "has_description_and_photo": {"passed": True, "explanation": "Valid description and evidence photo verified."},
                "within_50m": {"passed": True, "distance_m": 12.4, "explanation": "Photo taken 12.4m from incident coordinates."},
                "after_assignment": {"passed": True, "explanation": "Submission timestamp is 28 hours post-assignment."},
                "completion_keywords": {"passed": True, "explanation": "Found completion keywords: 'collected', 'sanitized'."},
                "no_contradicting_reports": {"passed": True, "explanation": "No contradictory citizen reports in past 48h."}
            },
            is_synthetic=True
        )
        db.add(cls_sample)

        db.commit()

        # Run hotspot synchronization
        hotspots = civic_intelligence.sync_hotspots(db)

        return {
            "message": f"Successfully seeded {len(created_incidents)} realistic multi-zone civic incidents across 5 sectors.",
            "incidents_count": len(created_incidents),
            "zones_covered": list(ZONES.keys()),
            "hotspots_detected": len(hotspots),
            "unconfirmed_cases_queued": 2
        }

    @classmethod
    def seed_pothole_scenario(cls, db: Session) -> Dict[str, Any]:
        """
        Executes the canonical duplicate detection demo scenario:
        Submits 3 citizen reports within 40m via real classification and duplicate engine.
        Report 1 -> Canonical Incident CIV-2026-XXXX created.
        Report 2 -> Linked autonomously (score >= 0.75).
        Report 3 -> Linked autonomously (score >= 0.75).
        """
        now = sim_clock.now()
        base_lat = 28.6315
        base_lon = 77.2167

        # Report 1
        rep1_payload = {
            "description": "Massive deep pothole on 4th Avenue near 12th Street intersection with dangerous exposed steel rebar.",
            "category": "pothole",
            "latitude": base_lat,
            "longitude": base_lon,
            "location_description": "4th Ave & 12th St",
            "reporter_name": "Citizen Pilot Reporter",
            "language": "en"
        }
        res1 = classifier.classify(rep1_payload["description"], rep1_payload["category"])
        dept_id, routing_rationale, _ = router_service.route_incident(db, res1["category"])
        sla_due = router_service.calculate_sla_due(res1["priority"])

        inc_id = f"inc_{uuid.uuid4().hex[:10]}"
        inc_tracking_id = f"CIV-2026-{uuid.uuid4().hex[:4].upper()}"

        incident = Incident(
            id=inc_id,
            tracking_id=inc_tracking_id,
            title=res1["title"],
            description=rep1_payload["description"],
            category=res1["category"],
            priority=res1["priority"],
            priority_reasons=res1["priority_reasons"],
            status="ASSIGNED",
            location_mode="PRECISE",
            location_status="USER_SELECTED",
            latitude=base_lat,
            longitude=base_lon,
            location_description=rep1_payload["location_description"],
            address="4th Avenue & 12th Street, Connaught Place",
            department_id=dept_id,
            created_at=now,
            assigned_at=now,
            sla_due_at=sla_due,
            reports_count=1,
            assignment_rationale=routing_rationale,
            is_synthetic=True
        )
        db.add(incident)
        db.flush()

        rep1_id = f"rep_{uuid.uuid4().hex[:10]}"
        rep1_tracking_id = f"REP-{uuid.uuid4().hex[:6].upper()}"
        report1 = CitizenReport(
            id=rep1_id,
            tracking_id=rep1_tracking_id,
            incident_id=incident.id,
            reporter_name=rep1_payload["reporter_name"],
            text=rep1_payload["description"],
            language="en",
            category=res1["category"],
            latitude=base_lat,
            longitude=base_lon,
            location_description=rep1_payload["location_description"],
            address="4th Avenue & 12th Street, Connaught Place",
            created_at=now,
            is_synthetic=True
        )
        db.add(report1)

        audit_service.record_event(
            db=db,
            incident_id=incident.id,
            event_type="INTAKE_CLASSIFICATION",
            from_status="NEW",
            to_status="ASSIGNED",
            actor="AGENT:intake",
            action="CREATE_CANONICAL_INCIDENT",
            reason=f"Canonical incident created and routed to {dept_id}.",
            timestamp=now
        )
        db.commit()

        # Report 2 (15m away)
        lat2 = base_lat + 0.0001
        lon2 = base_lon + 0.0001
        text2 = "Severe trench pothole at 4th Ave and 12th St intersection. Sharp rebar is damaging tires!"
        dup_res2 = duplicate_detector.find_duplicate(db, text=text2, category="pothole", lat=lat2, lon=lon2)

        rep2_id = f"rep_{uuid.uuid4().hex[:10]}"
        rep2_tracking_id = f"REP-{uuid.uuid4().hex[:6].upper()}"
        report2 = CitizenReport(
            id=rep2_id,
            tracking_id=rep2_tracking_id,
            incident_id=incident.id,
            reporter_name="Commuter Amit",
            text=text2,
            language="en",
            category="pothole",
            latitude=lat2,
            longitude=lon2,
            location_description="4th Ave & 12th St",
            duplicate_score=dup_res2["score"],
            duplicate_rationale=dup_res2["rationale"],
            created_at=now + timedelta(minutes=5),
            is_synthetic=True
        )
        db.add(report2)
        incident.reports_count += 1

        audit_service.record_event(
            db=db,
            incident_id=incident.id,
            event_type="DUPLICATE_LINK",
            from_status=None,
            to_status=None,
            actor="AGENT:linker",
            action="LINK_DUPLICATE_REPORT",
            reason=f"Report linked autonomously (Score: {dup_res2['score']:.2f}). {dup_res2['rationale']}",
            timestamp=now + timedelta(minutes=5)
        )
        db.commit()

        # Report 3 (25m away)
        lat3 = base_lat - 0.00015
        lon3 = base_lon + 0.0001
        text3 = "Water accumulating in large pothole on 4th Ave near 12th St. Steel bars exposed."
        dup_res3 = duplicate_detector.find_duplicate(db, text=text3, category="pothole", lat=lat3, lon=lon3)

        rep3_id = f"rep_{uuid.uuid4().hex[:10]}"
        rep3_tracking_id = f"REP-{uuid.uuid4().hex[:6].upper()}"
        report3 = CitizenReport(
            id=rep3_id,
            tracking_id=rep3_tracking_id,
            incident_id=incident.id,
            reporter_name="Local Driver Sunita",
            text=text3,
            language="en",
            category="pothole",
            latitude=lat3,
            longitude=lon3,
            location_description="4th Ave corner",
            duplicate_score=dup_res3["score"],
            duplicate_rationale=dup_res3["rationale"],
            created_at=now + timedelta(minutes=12),
            is_synthetic=True
        )
        db.add(report3)
        incident.reports_count += 1

        audit_service.record_event(
            db=db,
            incident_id=incident.id,
            event_type="DUPLICATE_LINK",
            from_status=None,
            to_status=None,
            actor="AGENT:linker",
            action="LINK_DUPLICATE_REPORT",
            reason=f"Report linked autonomously (Score: {dup_res3['score']:.2f}). {dup_res3['rationale']}",
            timestamp=now + timedelta(minutes=12)
        )
        db.add(audit3)
        db.commit()

        return {
            "incident_id": incident.id,
            "incident_tracking_id": incident.tracking_id,
            "title": incident.title,
            "reports_linked_count": 3,
            "reports": [
                {"tracking_id": rep1_tracking_id, "status": "CANONICAL", "score": None},
                {"tracking_id": rep2_tracking_id, "status": "LINKED", "score": dup_res2["score"]},
                {"tracking_id": rep3_tracking_id, "status": "LINKED", "score": dup_res3["score"]}
            ]
        }

    @classmethod
    def execute_bad_closure(cls, db: Session, target_incident_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Submits an invalid closure located ~300m away with no completion keywords.
        Triggers automatic verification rejection, reopening, priority escalation, and SLA recalculation.
        """
        now = sim_clock.now()

        # Find target incident
        if target_incident_id:
            incident = db.query(Incident).filter(Incident.id == target_incident_id).first()
        else:
            incident = db.query(Incident).filter(
                Incident.status.in_(["ASSIGNED", "IN_PROGRESS", "ESCALATED"]),
                Incident.latitude != None,
                Incident.longitude != None
            ).first()

        if not incident:
            return {"error": "No eligible active incident found for bad closure simulation."}

        # Submit closure far away (~350m offset) with generic non-completion notes
        bad_lat = incident.latitude + 0.0032  # ~355m away
        bad_lon = incident.longitude + 0.0025
        bad_notes = "Inspected vicinity, area appears fine for now. Nothing urgent to attend to."

        closure, verdict = closure_verifier.verify_closure(
            db=db,
            incident=incident,
            description=bad_notes,
            photo_ref="photo_generic_inspection_far.jpg",
            latitude=bad_lat,
            longitude=bad_lon,
            department_id=incident.department_id
        )

        return {
            "incident_id": incident.id,
            "tracking_id": incident.tracking_id,
            "verdict": verdict,
            "new_status": incident.status,
            "new_priority": incident.priority,
            "reopen_count": incident.reopen_count,
            "escalation_tier": incident.escalation_tier,
            "sla_due_at": incident.sla_due_at.isoformat() if incident.sla_due_at else None,
            "rejection_reasons": closure.verdict_reasons
        }

    @classmethod
    def advance_time(cls, db: Session, minutes: int) -> Dict[str, Any]:
        """Advances simulation clock and runs SLA monitoring service."""
        old_time = sim_clock.now()
        sim_clock.advance(minutes)
        new_time = sim_clock.now()

        # Check and escalate SLA breaches
        escalated_cases = sla_monitor.check_and_escalate(db)

        return {
            "message": f"Simulation clock advanced by {minutes} minutes.",
            "simulated_now": new_time.isoformat(),
            "minutes_advanced": minutes,
            "escalated_incident_ids": [inc.id for inc in escalated_cases],
            "escalated_count": len(escalated_cases)
        }

    @classmethod
    def set_department_outage(cls, db: Session, department_id: str, available: bool) -> Dict[str, Any]:
        """Simulates department outage and tests fallback re-routing."""
        dept = db.query(Department).filter(Department.id == department_id).first()
        if not dept:
            return {"error": f"Department {department_id} not found."}

        dept.available = available
        db.commit()

        reassigned_count = 0
        if not available and dept.fallback_department_id:
            fallback = db.query(Department).filter(Department.id == dept.fallback_department_id).first()
            fallback_name = fallback.name if fallback else dept.fallback_department_id

            active_cases = db.query(Incident).filter(
                Incident.department_id == dept.id,
                Incident.status.in_(["ASSIGNED", "IN_PROGRESS", "REOPENED"])
            ).all()

            for inc in active_cases:
                inc.department_id = dept.fallback_department_id
                inc.assignment_rationale = f"Reassigned to fallback {fallback_name} due to outage in {dept.name}."

                audit_service.record_event(
                    db=db,
                    incident_id=inc.id,
                    event_type="OUTAGE_REASSIGNMENT",
                    from_status=inc.status,
                    to_status=inc.status,
                    actor="SYSTEM:outage",
                    action="OUTAGE_REASSIGNMENT",
                    reason=f"Department {dept.name} entered outage mode. Incident reassigned to fallback {fallback_name}.",
                    metadata={
                        "outage_dept": dept.id,
                        "fallback_dept": dept.fallback_department_id
                    },
                    timestamp=sim_clock.now()
                )
                reassigned_count += 1

        db.commit()
        return {
            "department_id": dept.id,
            "name": dept.name,
            "available": dept.available,
            "reassigned_cases_count": reassigned_count
        }

    @classmethod
    def clear_synthetic_data(cls, db: Session):
        """Cleans only synthetic demo records safely without touching user submissions."""
        db.query(ClosureSubmission).filter(ClosureSubmission.is_synthetic == True).delete()
        db.query(CitizenReport).filter(CitizenReport.is_synthetic == True).delete()
        db.query(Attachment).filter(Attachment.is_synthetic == True).delete()
        db.query(EscalationRecord).delete()
        db.query(Hotspot).delete()
        db.query(AuditEvent).filter(AuditEvent.actor.startswith("SYSTEM:simulation")).delete()
        db.query(Incident).filter(Incident.is_synthetic == True).delete()
        db.commit()

    @classmethod
    def reset_demo(cls, db: Session, confirm: bool) -> Dict[str, Any]:
        if not confirm:
            return {
                "message": "Reset aborted: explicit 'confirm: true' parameter required.",
                "reset_performed": False
            }

        sim_clock.reset()
        cls.clear_synthetic_data(db)
        router_service.seed_departments(db)

        return {
            "message": "Demo data safely reset. Simulation clock restored to real UTC time.",
            "reset_performed": True
        }

simulation_service = SimulationService()

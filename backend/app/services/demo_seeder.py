import random
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.models.report import CitizenReport
from app.models.department import Department
from app.models.audit import AuditEvent
from app.models.closure import ClosureSubmission

# 14 Canonical Civic Categories
CATEGORIES_METADATA = [
    {
        "category": "pothole",
        "name": "Potholes & Road Damage",
        "dept_id": "DEP-ROADS",
        "sla_hours": 36,
        "templates": [
            "Deep asphalt crater causing traffic hazard near {landmark}",
            "Multiple severe potholes expanding after rain on {landmark} lane",
            "Broken road surface exposing sharp ballast and stone near {landmark}",
            "Sunken utility trench pothole damaging two-wheeler suspensions near {landmark}"
        ]
    },
    {
        "category": "streetlight",
        "name": "Broken Streetlights & Electrical",
        "dept_id": "DEP-LIGHTS",
        "sla_hours": 48,
        "templates": [
            "Row of four consecutive LED streetlights dead, leaving dark stretch at {landmark}",
            "Flickering high-mast lamp pole causing visual hazard near {landmark}",
            "Streetlight junction box damaged with exposed wiring near {landmark}",
            "Bent street pole leaning dangerously over footpath at {landmark}"
        ]
    },
    {
        "category": "garbage",
        "name": "Garbage Accumulation & Sanitation",
        "dept_id": "DEP-SAN",
        "sla_hours": 24,
        "templates": [
            "Unattended municipal garbage dump overflowing onto main road at {landmark}",
            "Illegal construction debris and plastic waste dumped near {landmark}",
            "Rotting vegetable and organic waste emitting foul odor near {landmark}",
            "Community waste bins flipped over and uncollected for 4 days near {landmark}"
        ]
    },
    {
        "category": "water_leak",
        "name": "Water Leakage & Pipeline Burst",
        "dept_id": "DEP-WATER",
        "sla_hours": 18,
        "templates": [
            "High-pressure underground water supply line burst flooding street at {landmark}",
            "Continuous clean potable water gushing from broken municipal valve at {landmark}",
            "Subsurface pipe fissure eroding road foundation near {landmark}",
            "Water pipe joint leaking continuously into storm drain at {landmark}"
        ]
    },
    {
        "category": "drainage",
        "name": "Blocked Drainage & Sewers",
        "dept_id": "DEP-WATER",
        "sla_hours": 24,
        "templates": [
            "Choked underground sewer line backflowing onto public footpath at {landmark}",
            "Blocked storm runoff catch basin filled with silt and plastic at {landmark}",
            "Broken concrete slab over open drainage channel posing hazard at {landmark}",
            "Clogged culvert preventing rainwater egress near {landmark}"
        ]
    },
    {
        "category": "waterlogging",
        "name": "Waterlogging & Flooding",
        "dept_id": "DEP-WATER",
        "sla_hours": 12,
        "templates": [
            "Severe waterlogging under railway underpass reaching 2 feet depth at {landmark}",
            "Roadway completely submerged after moderate rain, blocking transit near {landmark}",
            "Stagnant pool of muddy runoff trapping vehicles at {landmark}",
            "Inundated intersection causing major traffic gridlock at {landmark}"
        ]
    },
    {
        "category": "footpath",
        "name": "Damaged Sidewalks & Footpaths",
        "dept_id": "DEP-ROADS",
        "sla_hours": 72,
        "templates": [
            "Broken and dislodged paver blocks on pedestrian walkway at {landmark}",
            "Missing footpath cover slab creating 4-foot deep fall hazard near {landmark}",
            "Uneven sidewalk displacement caused by tree root heaving at {landmark}",
            "Damaged tactile paving for visually impaired pedestrians at {landmark}"
        ]
    },
    {
        "category": "traffic_signal",
        "name": "Traffic Signal Faults",
        "dept_id": "DEP-ROADS",
        "sla_hours": 8,
        "templates": [
            "Traffic light stuck on blinking amber at busy four-way junction at {landmark}",
            "Complete power failure on pedestrian crossing signal at {landmark}",
            "Misaligned signal head rotated away from oncoming traffic at {landmark}",
            "Broken countdown timer display causing driver confusion at {landmark}"
        ]
    },
    {
        "category": "infrastructure",
        "name": "Damaged Public Infrastructure",
        "dept_id": "DEP-ROADS",
        "sla_hours": 48,
        "templates": [
            "Cracked concrete median barrier leaning onto express lane at {landmark}",
            "Damaged pedestrian foot-overbridge handrail with missing bolts at {landmark}",
            "Collapsed bus shelter roof section threatening commuters at {landmark}",
            "Bent guardrail section along elevated flyover ramp at {landmark}"
        ]
    },
    {
        "category": "sanitation",
        "name": "Public Sanitation & Toilets",
        "dept_id": "DEP-SAN",
        "sla_hours": 24,
        "templates": [
            "Municipal public convenience block locked during operational hours at {landmark}",
            "Non-functional tap fittings and overflowing basins at public toilet near {landmark}",
            "Severely unsanitary conditions with blocked drainage in public facility at {landmark}",
            "Broken exhaust ventilation and door locks in public washroom at {landmark}"
        ]
    },
    {
        "category": "park",
        "name": "Park & Public-Space Maintenance",
        "dept_id": "DEP-HORT",
        "sla_hours": 72,
        "templates": [
            "Broken children's swing and damaged climbing frame at neighborhood park near {landmark}",
            "Uprooted tree branches obstructing public walking trail at {landmark}",
            "Damaged boundary wall and gate of municipal children's park at {landmark}",
            "Overgrown wild weeds and broken park illumination near {landmark}"
        ]
    },
    {
        "category": "noise",
        "name": "Noise & Public Nuisance",
        "dept_id": "DEP-POLICE",
        "sla_hours": 4,
        "templates": [
            "Unauthorized high-decibel commercial generator operating post-midnight at {landmark}",
            "Illegal loudspeaker usage exceeding permissible environmental norms at {landmark}",
            "Continuous industrial pneumatic drilling noise during silent hours near {landmark}",
            "Late night unauthorized construction activity disturbing residential block at {landmark}"
        ]
    },
    {
        "category": "stray_animal",
        "name": "Stray-Animal Concerns",
        "dept_id": "DEP-VET",
        "sla_hours": 24,
        "templates": [
            "Pack of aggressive stray dogs exhibiting rabies symptoms near {landmark} school",
            "Injured stray bovine lying in median blocking vehicular traffic at {landmark}",
            "Stray cattle congregation creating severe road accident hazard at {landmark}",
            "Distressed abandoned stray animal requiring veterinary rescue at {landmark}"
        ]
    },
    {
        "category": "other",
        "name": "Other (Custom Municipal Vector)",
        "dept_id": "DEP-ROADS",
        "sla_hours": 48,
        "templates": [
            "Unauthorized commercial billboard blocking traffic visibility at {landmark}",
            "Hazardous overhead optical fiber cables dangling across road at {landmark}",
            "Illegal encroachment of public right-of-way by construction materials at {landmark}",
            "Damaged municipal boundary pillar and survey marker at {landmark}"
        ]
    }
]

# Configured Delhi NCR Bounding Geography & Key Landmark Hotspot Clusters
HOTSPOT_CLUSTERS = [
    {"name": "Connaught Place Inner Circle", "lat": 28.6315, "lon": 77.2167, "bias": 0.25},
    {"name": "Karol Bagh Commercial Zone", "lat": 28.6514, "lon": 77.1907, "bias": 0.20},
    {"name": "Nehru Place IT Hub", "lat": 28.5492, "lon": 77.2528, "bias": 0.18},
    {"name": "Dwarka Sector 10 Transit Sector", "lat": 28.5815, "lon": 77.0592, "bias": 0.15},
    {"name": "Rohini Sector 14 Infrastructure Corridor", "lat": 28.7150, "lon": 77.1325, "bias": 0.12},
    {"name": "Lajpat Nagar Central Market", "lat": 28.5677, "lon": 77.2433, "bias": 0.10}
]

LANDMARKS = [
    "Metro Station Gate 2", "Central Market Main Road", "District Court Complex",
    "Sector 4 Commercial Crossing", "Government Primary School Corner",
    "City Hospital Emergency Entrance", "Ring Road Flyover Underpass",
    "Municipal Water Booster Pump", "Community Center Main Gate",
    "Sub-Station Power Yard", "Public Library Bus Shelter", "Civic Park North Entrance"
]

def seed_synthetic_demo_records(db: Session, count: int = 450, seed: int = 42) -> Dict[str, Any]:
    """
    Generates exactly `count` deterministic, referentially-valid demo records
    scoped strictly to `is_demo=True` and `dataset='DEMO'`.
    Safe & idempotent: deletes previous demo records without touching real citizen records.
    """
    random.seed(seed)
    now = datetime.now(timezone.utc)

    # 1. Clean previous DEMO data safely
    prev_demo_incidents = db.query(Incident).filter(
        (Incident.is_demo == True) | (Incident.dataset == "DEMO") | (Incident.id.like("INC-DEMO-%"))
    ).all()
    prev_demo_ids = [inc.id for inc in prev_demo_incidents]
    if prev_demo_ids:
        db.query(CitizenReport).filter(
            (CitizenReport.incident_id.in_(prev_demo_ids)) | (CitizenReport.is_demo == True) | (CitizenReport.id.like("REP-DEMO-%")) | (CitizenReport.id.like("REP-DUP-%"))
        ).delete(synchronize_session=False)
        db.query(ClosureSubmission).filter(ClosureSubmission.incident_id.in_(prev_demo_ids)).delete(synchronize_session=False)
        db.query(AuditEvent).filter(AuditEvent.incident_id.in_(prev_demo_ids)).delete(synchronize_session=False)
        db.query(Incident).filter(Incident.id.in_(prev_demo_ids)).delete(synchronize_session=False)
        db.commit()

    # 2. Status Distribution targets for `count` incidents
    # NEW (~15%), ASSIGNED (~20%), IN_PROGRESS (~25%), RESOLVED (~20%), REOPENED (~8%), ESCALATED (~7%), UNCONFIRMED (~5%)
    statuses_pool = (
        ["NEW"] * int(count * 0.15) +
        ["ASSIGNED"] * int(count * 0.20) +
        ["IN_PROGRESS"] * int(count * 0.25) +
        ["RESOLVED"] * int(count * 0.20) +
        ["REOPENED"] * int(count * 0.08) +
        ["ESCALATED"] * int(count * 0.07)
    )
    # Fill remaining to reach count
    while len(statuses_pool) < count:
        statuses_pool.append("IN_PROGRESS")
    random.shuffle(statuses_pool)

    created_incidents = []
    created_reports = []
    audit_events = []
    closures = []

    # Keep track of running previous_hash for the audit chain
    current_audit_hash = "GENESIS_DEMO_CHAIN_000000000000000000000000000000000000000000000000"

    for i in range(count):
        cat_meta = random.choice(CATEGORIES_METADATA)
        status = statuses_pool[i]
        landmark = random.choice(LANDMARKS)

        # Cluster vs Isolated coordinates
        use_cluster = random.random() < 0.75
        if use_cluster:
            cluster = random.choices(HOTSPOT_CLUSTERS, weights=[c["bias"] for c in HOTSPOT_CLUSTERS])[0]
            lat = cluster["lat"] + random.gauss(0, 0.006)
            lon = cluster["lon"] + random.gauss(0, 0.006)
            cluster_name = cluster["name"]
        else:
            lat = 28.5200 + random.random() * (28.7400 - 28.5200)
            lon = 77.0600 + random.random() * (77.3400 - 77.0600)
            cluster_name = "Greater Delhi Municipal Perimeter"

        # 5% Unconfirmed Location Mode
        is_unconfirmed = (i % 20 == 0)
        loc_mode = "UNCONFIRMED" if is_unconfirmed else "PRECISE"
        loc_status = "LOCATION_UNCONFIRMED" if is_unconfirmed else "USER_SELECTED"
        if is_unconfirmed:
            lat = None
            lon = None

        inc_id = f"INC-DEMO-{i+1:04d}"
        trk_id = f"CIV-DEMO-{i+1:04d}"
        rep_trk_id = f"REP-DEMO-{i+1:04d}"
        rep_id = f"REP-DEMO-{i+1:04d}"

        title_tpl = random.choice(cat_meta["templates"])
        title = title_tpl.format(landmark=f"{landmark}, {cluster_name}")
        desc = (
            f"Citizen reported: {title}. Immediate municipal intervention requested to restore normal "
            f"public safety and pedestrian access. Visual evidence verified on-site."
        )

        priority = random.choice([2, 3, 3, 4, 4, 5])
        created_offset_hours = random.randint(2, 240)
        created_at = now - timedelta(hours=created_offset_hours)

        sla_due_at = created_at + timedelta(hours=cat_meta["sla_hours"])
        resolved_at = None
        reopen_count = 0
        escalation_tier = 0

        if status == "RESOLVED":
            resolved_at = created_at + timedelta(hours=min(created_offset_hours - 1, cat_meta["sla_hours"] // 2))
        elif status == "REOPENED":
            reopen_count = random.choice([1, 2])
            escalation_tier = 1
            priority = min(5, priority + 1)
        elif status == "ESCALATED":
            escalation_tier = random.choice([1, 2, 3])
            priority = min(5, priority + 2)

        incident = Incident(
            id=inc_id,
            tracking_id=trk_id,
            title=title[:200],
            description=desc,
            category=cat_meta["category"],
            custom_category=None,
            priority=priority,
            priority_reasons=[f"Municipal standard SLA threshold {cat_meta['sla_hours']}h", f"Public risk index {priority}/5"],
            status=status,
            location_mode=loc_mode,
            location_status=loc_status,
            latitude=lat,
            longitude=lon,
            address=f"{landmark}, {cluster_name}, New Delhi" if not is_unconfirmed else None,
            approximate_locality=cluster_name,
            location_description=f"Near {landmark}",
            photo_data=None,
            sha256_hash=f"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852{i:04x}"[:64],
            department_id=cat_meta["dept_id"],
            created_at=created_at,
            assigned_at=created_at + timedelta(minutes=15) if status != "NEW" else None,
            sla_due_at=sla_due_at,
            resolved_at=resolved_at,
            reopen_count=reopen_count,
            escalation_count=1 if status in ["ESCALATED", "REOPENED"] else 0,
            escalation_tier=escalation_tier,
            reports_count=1,
            canonical_incident_id=None,
            hotspot_id=None,
            is_synthetic=True,
            is_demo=True,
            dataset="DEMO"
        )
        created_incidents.append(incident)

        # Primary Citizen Report
        report = CitizenReport(
            id=rep_id,
            tracking_id=rep_trk_id,
            incident_id=inc_id,
            reporter_name=f"Resident Citizen {i+1}",
            text=desc,
            language="en",
            category=cat_meta["category"],
            location_mode=loc_mode,
            location_status=loc_status,
            latitude=lat,
            longitude=lon,
            address=f"{landmark}, {cluster_name}, New Delhi" if not is_unconfirmed else None,
            approximate_locality=cluster_name,
            observation_time="Daytime observation",
            sha256_hash=f"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852{i:04x}"[:64],
            created_at=created_at,
            is_synthetic=True,
            is_demo=True,
            dataset="DEMO"
        )
        created_reports.append(report)

        # Genesis Audit Event for Incident Creation
        time_str = created_at.isoformat()
        audit_payload = f"{current_audit_hash}:{inc_id}:INCIDENT_CREATED:SYSTEM_INTAKE:{time_str}"
        event_hash = hashlib.sha256(audit_payload.encode("utf-8")).hexdigest()[:16]
        audit = AuditEvent(
            id=f"AUD-DEMO-{i+1:04d}-01",
            incident_id=inc_id,
            event_type="INCIDENT_CREATED",
            actor="SYSTEM_INTAKE",
            action="INCIDENT_CREATED",
            from_status=None,
            to_status=status,
            reason=f"Initial intake classified as {cat_meta['name']}. SLA due in {cat_meta['sla_hours']}h.",
            timestamp=created_at,
            previous_hash=current_audit_hash,
            event_hash=event_hash
        )
        current_audit_hash = event_hash
        audit_events.append(audit)

        # Closure submissions for resolved / reopened cases
        if status in ["RESOLVED", "REOPENED"] and lat and lon:
            is_rejected = (status == "REOPENED")
            # If rejected, place closure coordinates outside 50m tolerance to demonstrate geofence breach
            closure_lat = lat + (0.0015 if is_rejected else 0.0001)
            closure_lon = lon + (0.0015 if is_rejected else 0.0001)
            
            checks = {
                "has_description_and_photo": {"status": "PASSED", "explanation": "Photo proof and resolution text attached."},
                "within_50m": {
                    "status": "FAILED" if is_rejected else "PASSED",
                    "explanation": "Contractor GPS 180m away from reported site (Geofence Breach)" if is_rejected else "Contractor within 12m of site."
                },
                "after_assignment": {"status": "PASSED", "explanation": "Completed after dispatch."},
                "completion_keywords": {"status": "PASSED", "explanation": "Contains completion verification verbs."},
                "no_contradicting_reports": {"status": "PASSED", "explanation": "No conflicting citizen reports."}
            }

            closure = ClosureSubmission(
                id=f"CLS-DEMO-{i+1:04d}",
                incident_id=inc_id,
                department_id=cat_meta["dept_id"],
                description="Field repair completed according to standard civic engineering specifications.",
                latitude=closure_lat,
                longitude=closure_lon,
                verdict="REJECTED" if is_rejected else "APPROVED",
                verdict_reasons=["GEOFENCE_BREACH_DETECTED"] if is_rejected else ["ALL_CHECKS_PASSED"],
                individual_checks=checks,
                reviewer_id="USR-REV-01" if is_rejected else None,
                reviewer_note="Auto-rejected by 5-Point Verification Engine due to location spoofing." if is_rejected else None,
                reviewed_at=created_at + timedelta(hours=min(created_offset_hours - 1, 12)),
                submitted_at=created_at + timedelta(hours=min(created_offset_hours - 1, 12)),
                is_synthetic=True
            )
            closures.append(closure)

    # 3. Add ~40 linked duplicate reports to demonstrate duplicate detection grouping
    duplicate_count = 40
    for d in range(duplicate_count):
        master_inc = created_incidents[d * 5] # Pick distributed master incidents
        dup_rep_id = f"REP-DUP-{d+1:03d}"
        dup_trk_id = f"TRK-DUP-{d+1:03d}"
        
        dup_report = CitizenReport(
            id=dup_rep_id,
            tracking_id=dup_trk_id,
            incident_id=master_inc.id,
            reporter_name=f"Corroborating Citizen {d+1}",
            text=f"Corroborating report: Observed severe {master_inc.category} issue still unresolved at {master_inc.address}. Traffic impacted.",
            language="en",
            category=master_inc.category,
            location_mode="PRECISE",
            location_status="CORROBORATED",
            latitude=master_inc.latitude + random.gauss(0, 0.0002) if master_inc.latitude else None,
            longitude=master_inc.longitude + random.gauss(0, 0.0002) if master_inc.longitude else None,
            address=master_inc.address,
            approximate_locality=master_inc.approximate_locality,
            observation_time="Afternoon follow-up",
            duplicate_score=0.88,
            duplicate_rationale="Corroborated existing master incident within 40m radius.",
            created_at=master_inc.created_at + timedelta(hours=random.randint(1, 12)),
            is_synthetic=True,
            is_demo=True,
            dataset="DEMO"
        )
        created_reports.append(dup_report)
        master_inc.reports_count += 1

    # 4. Batch insert into database
    db.bulk_save_objects(created_incidents)
    db.bulk_save_objects(created_reports)
    db.bulk_save_objects(audit_events)
    db.bulk_save_objects(closures)
    db.commit()

    return {
        "status": "success",
        "incidents_seeded": count,
        "reports_seeded": count + duplicate_count,
        "linked_duplicates": duplicate_count,
        "categories_covered": len(CATEGORIES_METADATA),
        "geography": "Delhi NCR (Lat 28.50 - 28.75, Lon 77.05 - 77.35)",
        "dataset_marker": "DEMO"
    }

def reset_demo_records(db: Session) -> Dict[str, Any]:
    """Deletes all demo records safely while preserving live citizen records."""
    demo_incidents = db.query(Incident).filter(Incident.is_demo == True).all()
    demo_ids = [inc.id for inc in demo_incidents]
    if demo_ids:
        db.query(CitizenReport).filter(CitizenReport.is_demo == True).delete(synchronize_session=False)
        db.query(ClosureSubmission).filter(ClosureSubmission.incident_id.in_(demo_ids)).delete(synchronize_session=False)
        db.query(AuditEvent).filter(AuditEvent.incident_id.in_(demo_ids)).delete(synchronize_session=False)
        db.query(Incident).filter(Incident.is_demo == True).delete(synchronize_session=False)
        db.commit()

    return {
        "status": "success",
        "deleted_incidents": len(demo_ids),
        "message": "All demo records successfully wiped. Live citizen records intact."
    }

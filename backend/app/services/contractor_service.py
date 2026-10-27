import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.contractor import Contractor, Contract, PerformanceAssessment
from app.models.incident import Incident
from app.models.department import Department

logger = logging.getLogger("civichelp.contractor")

SEED_CONTRACTORS = [
    {
        "id": "CON-DEL-PWD-01",
        "name": "Apex Road Infrastructure Ltd",
        "agency_type": "Empanelled Municipal Contractor",
        "contact_person": "Rajesh Singhania",
        "email": "rajesh@apexroads.in",
        "phone": "+91 98110 44210",
        "license_no": "DL-MCD-ROAD-2022-881",
        "trust_score": 92,
        "active_contracts_count": 2,
    },
    {
        "id": "CON-DEL-DJB-01",
        "name": "Jal Hydro Utilities & Pipelines",
        "agency_type": "Empanelled Municipal Contractor",
        "contact_person": "Sunita Verma",
        "email": "verma@jalhydro.co.in",
        "phone": "+91 98712 33411",
        "license_no": "DL-DJB-HYD-2021-409",
        "trust_score": 86,
        "active_contracts_count": 1,
    },
    {
        "id": "CON-DEL-MCD-01",
        "name": "CleanCity Waste Management Corp",
        "agency_type": "Public-Private Partnership",
        "contact_person": "Manish Tiwari",
        "email": "m.tiwari@cleancityindia.org",
        "phone": "+91 99100 88234",
        "license_no": "DL-MCD-SWM-2023-112",
        "trust_score": 95,
        "active_contracts_count": 2,
    },
    {
        "id": "CON-DEL-BRPL-01",
        "name": "BrightGrid Municipal Power Solutions",
        "agency_type": "Empanelled Contractor",
        "contact_person": "Harish Chopra",
        "email": "h.chopra@brightgrid.in",
        "phone": "+91 98102 77123",
        "license_no": "DL-DISCOM-STLT-2020-044",
        "trust_score": 89,
        "active_contracts_count": 1,
    }
]

SEED_CONTRACTS = [
    {
        "id": "CNT-PWD-2025-01",
        "contractor_id": "CON-DEL-PWD-01",
        "title": "Annual Road Surface & Pothole Rapid Restoration (Zone South)",
        "contract_number": "PWD/HQ/MAINT/2025/1108",
        "department_id": "DEP-PWD",
        "ward_id": "WARD-DEL-044",
        "contract_value": 4500000.0,
        "start_date": "2025-04-01",
        "end_date": "2026-03-31",
        "sla_target_hours": 24,
        "allowed_reopen_rate_pct": 4.0,
        "penalty_per_hour_breach": 500.0,
        "max_penalty_cap_pct": 15.0,
        "clauses_summary": "Clause 4.1: ₹500/hr breach penalty for unaddressed high-priority potholes beyond 24h. Clause 7.2: ₹10,000 deduction per reopened incident with defective compaction."
    },
    {
        "id": "CNT-DJB-2025-01",
        "contractor_id": "CON-DEL-DJB-01",
        "title": "Ward Drainage Desilting & Pipeline Emergency Response",
        "contract_number": "DJB/ZONE4/SEW/2025/082",
        "department_id": "DEP-DJB",
        "ward_id": "WARD-DEL-043",
        "contract_value": 3800000.0,
        "start_date": "2025-05-01",
        "end_date": "2026-04-30",
        "sla_target_hours": 18,
        "allowed_reopen_rate_pct": 5.0,
        "penalty_per_hour_breach": 750.0,
        "max_penalty_cap_pct": 15.0,
        "clauses_summary": "Clause 3.2: 18h maximum drain unblocking response time. Clause 8.3: Verification failure triggers mandatory contractor re-excavation without billing addition."
    },
    {
        "id": "CNT-MCD-2025-01",
        "contractor_id": "CON-DEL-MCD-01",
        "title": "Ward Level Solid Waste Clearance & Dhalao Transit",
        "contract_number": "MCD/SAN/SOUTH/2025/042",
        "department_id": "DEP-MCD",
        "ward_id": "WARD-DEL-042",
        "contract_value": 5200000.0,
        "start_date": "2025-04-01",
        "end_date": "2026-03-31",
        "sla_target_hours": 12,
        "allowed_reopen_rate_pct": 3.0,
        "penalty_per_hour_breach": 400.0,
        "max_penalty_cap_pct": 12.0,
        "clauses_summary": "Clause 2.1: Secondary waste pile-ups cleared within 12h. Clause 5.4: ₹25,000 monthly bonus if zero overflow incidents reported for 30 consecutive days."
    },
    {
        "id": "CNT-BRPL-2025-01",
        "contractor_id": "CON-DEL-BRPL-01",
        "title": "Smart LED Streetlight Network Maintenance & Feeder Monitoring",
        "contract_number": "BRPL/STLT/MAINT/2025/019",
        "department_id": "DEP-BRPL",
        "ward_id": "WARD-DEL-045",
        "contract_value": 2900000.0,
        "start_date": "2025-06-01",
        "end_date": "2026-05-31",
        "sla_target_hours": 24,
        "allowed_reopen_rate_pct": 3.5,
        "penalty_per_hour_breach": 350.0,
        "max_penalty_cap_pct": 10.0,
        "clauses_summary": "Clause 1.4: Bulk streetlight outage (3+ poles) restoration within 8h. Standard single pole SLA 24h."
    }
]

SEED_ASSESSMENTS = [
    {
        "id": "ASM-2026-001",
        "contractor_id": "CON-DEL-PWD-01",
        "contract_id": "CNT-PWD-2025-01",
        "assessment_type": "PENALTY_RECOMMENDATION",
        "clause_reference": "Clause 4.1 (SLA Hourly Breach)",
        "breach_duration_hours": 14.5,
        "recommended_amount": 7250.0,
        "final_amount": 7250.0,
        "status": "CONTRACTOR_NOTIFIED",
        "evidence_summary": "Pothole repair at Ring Road Flyover took 38.5h against SLA target of 24h. Clock difference: 14.5h delay recorded in audit ledger.",
        "contractor_response": "Adverse monsoon waterlogging hindered hot-mix bituminous application.",
        "official_decision_notes": "Contractor notified on 2026-10-20. Under official review by Executive Engineer."
    },
    {
        "id": "ASM-2026-002",
        "contractor_id": "CON-DEL-DJB-01",
        "contract_id": "CNT-DJB-2025-01",
        "assessment_type": "PENALTY_RECOMMENDATION",
        "clause_reference": "Clause 8.3 (Failed Closure Quality Penalty)",
        "breach_duration_hours": 20.0,
        "recommended_amount": 15000.0,
        "final_amount": 15000.0,
        "status": "OFFICIAL_APPROVAL",
        "evidence_summary": "Claimed drain desilting closure rejected by autonomous image verification: standing water and sludge accumulation persisted at site.",
        "contractor_response": "Silt traps were cleared, but municipal trunk sewer backpressure flooded the side trench.",
        "official_decision_notes": "Penalty approved by Zonal Superintending Engineer. Forwarded to Finance for billing adjustment."
    },
    {
        "id": "ASM-2026-003",
        "contractor_id": "CON-DEL-MCD-01",
        "contract_id": "CNT-MCD-2025-01",
        "assessment_type": "BONUS_RECOMMENDATION",
        "clause_reference": "Clause 5.4 (Zero Overflow Quality Incentive)",
        "breach_duration_hours": 0.0,
        "recommended_amount": 25000.0,
        "final_amount": 25000.0,
        "status": "RECONCILED",
        "evidence_summary": "Ward 42 sustained 30 consecutive calendar days with zero unresolved waste overflows and <2% SLA variance across 140 intake reports.",
        "contractor_response": "Deploying 2 additional electric mini-dumpers for night sanitation shifts.",
        "official_decision_notes": "Bonus reconciled in October 2026 billing cycle."
    },
    {
        "id": "ASM-2026-004",
        "contractor_id": "CON-DEL-BRPL-01",
        "contract_id": "CNT-BRPL-2025-01",
        "assessment_type": "BONUS_RECOMMENDATION",
        "clause_reference": "Clause 1.4 (Rapid Bulk Outage Restoration)",
        "breach_duration_hours": 0.0,
        "recommended_amount": 10000.0,
        "final_amount": 10000.0,
        "status": "ACCEPTED",
        "evidence_summary": "Bulk streetlight outage in Ward 45 restored in 2.2 hours against 8-hour target window.",
        "contractor_response": "Contractor accepted commendation and incentive credit.",
        "official_decision_notes": "Incentive approved by Assistant Engineer (Electrical)."
    }
]

VALID_ASSESSMENT_STATUSES = [
    "DETECTED",
    "EVIDENCE_REVIEW",
    "CALCULATED",
    "CONTRACTOR_NOTIFIED",
    "DISPUTED",
    "ACCEPTED",
    "OFFICIAL_APPROVAL",
    "BILLING_ADJUSTMENT_PENDING",
    "RECONCILED"
]


def seed_contractors(db: Session) -> None:
    for c_data in SEED_CONTRACTORS:
        existing = db.query(Contractor).filter(Contractor.id == c_data["id"]).first()
        if not existing:
            db.add(Contractor(**c_data))
    db.commit()

    for cnt_data in SEED_CONTRACTS:
        existing = db.query(Contract).filter(Contract.id == cnt_data["id"]).first()
        if not existing:
            db.add(Contract(**cnt_data))
    db.commit()

    for asm_data in SEED_ASSESSMENTS:
        existing = db.query(PerformanceAssessment).filter(PerformanceAssessment.id == asm_data["id"]).first()
        if not existing:
            db.add(PerformanceAssessment(**asm_data))
    db.commit()
    logger.info("Contractors, contracts, and performance assessments seeded successfully.")


def get_all_contractors(db: Session) -> List[Dict[str, Any]]:
    contractors = db.query(Contractor).all()
    results = []
    for c in contractors:
        # Calculate totals from assessments
        assessments = db.query(PerformanceAssessment).filter(PerformanceAssessment.contractor_id == c.id).all()
        penalties_total = sum(a.final_amount or a.recommended_amount for a in assessments if a.assessment_type == "PENALTY_RECOMMENDATION" and a.status in ["OFFICIAL_APPROVAL", "BILLING_ADJUSTMENT_PENDING", "RECONCILED"])
        bonuses_total = sum(a.final_amount or a.recommended_amount for a in assessments if a.assessment_type == "BONUS_RECOMMENDATION" and a.status in ["ACCEPTED", "OFFICIAL_APPROVAL", "RECONCILED"])

        results.append({
            "id": c.id,
            "name": c.name,
            "agency_type": c.agency_type,
            "contact_person": c.contact_person,
            "email": c.email,
            "phone": c.phone,
            "license_no": c.license_no,
            "trust_score": c.trust_score,
            "active_contracts_count": c.active_contracts_count,
            "is_active": c.is_active,
            "confirmed_penalties": penalties_total,
            "confirmed_bonuses": bonuses_total,
            "assessments_count": len(assessments),
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    return results


def get_contractor_detail(db: Session, contractor_id: str) -> Optional[Dict[str, Any]]:
    c = db.query(Contractor).filter(Contractor.id == contractor_id).first()
    if not c:
        return None

    contracts = db.query(Contract).filter(Contract.contractor_id == c.id).all()
    assessments = db.query(PerformanceAssessment).filter(PerformanceAssessment.contractor_id == c.id).order_by(desc(PerformanceAssessment.created_at)).all()

    return {
        "id": c.id,
        "name": c.name,
        "agency_type": c.agency_type,
        "contact_person": c.contact_person,
        "email": c.email,
        "phone": c.phone,
        "license_no": c.license_no,
        "trust_score": c.trust_score,
        "active_contracts_count": c.active_contracts_count,
        "is_active": c.is_active,
        "contracts": [
            {
                "id": cnt.id,
                "title": cnt.title,
                "contract_number": cnt.contract_number,
                "department_id": cnt.department_id,
                "ward_id": cnt.ward_id,
                "contract_value": cnt.contract_value,
                "start_date": cnt.start_date,
                "end_date": cnt.end_date,
                "sla_target_hours": cnt.sla_target_hours,
                "allowed_reopen_rate_pct": cnt.allowed_reopen_rate_pct,
                "penalty_per_hour_breach": cnt.penalty_per_hour_breach,
                "max_penalty_cap_pct": cnt.max_penalty_cap_pct,
                "clauses_summary": cnt.clauses_summary,
                "is_active": cnt.is_active
            }
            for cnt in contracts
        ],
        "assessments": [
            {
                "id": a.id,
                "contract_id": a.contract_id,
                "incident_id": a.incident_id,
                "project_id": a.project_id,
                "assessment_type": a.assessment_type,
                "clause_reference": a.clause_reference,
                "breach_duration_hours": a.breach_duration_hours,
                "recommended_amount": a.recommended_amount,
                "final_amount": a.final_amount,
                "status": a.status,
                "evidence_summary": a.evidence_summary,
                "contractor_response": a.contractor_response,
                "official_decision_notes": a.official_decision_notes,
                "approved_at": a.approved_at.isoformat() if a.approved_at else None,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in assessments
        ]
    }


def list_assessments(
    db: Session,
    contractor_id: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    query = db.query(PerformanceAssessment)
    if contractor_id:
        query = query.filter(PerformanceAssessment.contractor_id == contractor_id)
    if status:
        query = query.filter(PerformanceAssessment.status == status)

    assessments = query.order_by(desc(PerformanceAssessment.created_at)).all()
    results = []
    for a in assessments:
        contractor = db.query(Contractor).filter(Contractor.id == a.contractor_id).first()
        results.append({
            "id": a.id,
            "contractor_id": a.contractor_id,
            "contractor_name": contractor.name if contractor else "Unknown Contractor",
            "contract_id": a.contract_id,
            "incident_id": a.incident_id,
            "project_id": a.project_id,
            "assessment_type": a.assessment_type,
            "clause_reference": a.clause_reference,
            "breach_duration_hours": a.breach_duration_hours,
            "recommended_amount": a.recommended_amount,
            "final_amount": a.final_amount,
            "status": a.status,
            "evidence_summary": a.evidence_summary,
            "contractor_response": a.contractor_response,
            "official_decision_notes": a.official_decision_notes,
            "approved_at": a.approved_at.isoformat() if a.approved_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return results


def transition_assessment(
    db: Session,
    assessment_id: str,
    new_status: str,
    notes: Optional[str] = None,
    contractor_response: Optional[str] = None,
    final_amount: Optional[float] = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    assessment = db.query(PerformanceAssessment).filter(PerformanceAssessment.id == assessment_id).first()
    if not assessment:
        raise ValueError(f"Performance assessment '{assessment_id}' not found.")

    if new_status not in VALID_ASSESSMENT_STATUSES:
        raise ValueError(f"Invalid status '{new_status}'. Allowed statuses: {', '.join(VALID_ASSESSMENT_STATUSES)}")

    assessment.status = new_status
    if notes:
        assessment.official_decision_notes = notes
    if contractor_response:
        assessment.contractor_response = contractor_response
    if final_amount is not None:
        assessment.final_amount = final_amount
    if user_id:
        assessment.reviewed_by_user_id = user_id

    if new_status in ["OFFICIAL_APPROVAL", "BILLING_ADJUSTMENT_PENDING", "RECONCILED"]:
        assessment.approved_at = datetime.now(timezone.utc)
        # Update contractor trust score if penalty or bonus confirmed
        contractor = db.query(Contractor).filter(Contractor.id == assessment.contractor_id).first()
        if contractor:
            if assessment.assessment_type == "PENALTY_RECOMMENDATION":
                contractor.trust_score = max(30, contractor.trust_score - 4)
            elif assessment.assessment_type == "BONUS_RECOMMENDATION":
                contractor.trust_score = min(100, contractor.trust_score + 2)

    db.commit()
    db.refresh(assessment)
    return {
        "id": assessment.id,
        "status": assessment.status,
        "final_amount": assessment.final_amount,
        "official_decision_notes": assessment.official_decision_notes,
        "contractor_response": assessment.contractor_response,
        "approved_at": assessment.approved_at.isoformat() if assessment.approved_at else None
    }


def evaluate_incident_penalty(
    db: Session,
    incident_id: str,
    reason: str = "SLA_BREACH"
) -> Optional[PerformanceAssessment]:
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        return None

    # Map department to contractor
    dept_map = {
        "DEP-PWD": "CON-DEL-PWD-01",
        "DEP-DJB": "CON-DEL-DJB-01",
        "DEP-MCD": "CON-DEL-MCD-01",
        "DEP-BRPL": "CON-DEL-BRPL-01"
    }
    contractor_id = dept_map.get(incident.department_id)
    if not contractor_id:
        return None

    contract = db.query(Contract).filter(Contract.contractor_id == contractor_id).first()
    if not contract:
        return None

    # Calculate penalty
    breach_hours = 8.0
    recommended_penalty = 4000.0
    clause = "Clause 4.1 (Standard Breach)"
    summary = f"Incident {incident.id} flagged for review ({reason}). SLA target exceeded by {breach_hours}h."

    if reason == "REOPENED_AFTER_FAILURE":
        clause = "Clause 7.2 (Defective Resolution Penalty)"
        recommended_penalty = 10000.0
        summary = f"Incident {incident.id} closure rejected and reopened. Substandard resolution detected on site."

    new_assessment = PerformanceAssessment(
        id=f"ASM-{uuid.uuid4().hex[:8].upper()}",
        contractor_id=contractor_id,
        contract_id=contract.id,
        incident_id=incident.id,
        assessment_type="PENALTY_RECOMMENDATION",
        clause_reference=clause,
        breach_duration_hours=breach_hours,
        recommended_amount=recommended_penalty,
        final_amount=recommended_penalty,
        status="DETECTED",
        evidence_summary=summary,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    return new_assessment

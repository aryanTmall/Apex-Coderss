import json
import csv
import io
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.funds import Ward, MunicipalBudget, MunicipalProject
from app.models.department import Department

INITIAL_WARDS = [
    {
        "id": "WARD-42",
        "ward_number": 42,
        "name": "Connaught Place / Central Ward",
        "zone": "Central Zone",
        "city": "New Delhi",
        "population": 85000,
        "area_sq_km": 4.8,
        "councillor_name": "Smt. Sunita Sharma",
        "latitude": 28.6289,
        "longitude": 77.2183
    },
    {
        "id": "WARD-43",
        "ward_number": 43,
        "name": "Karol Bagh Commercial & Residential",
        "zone": "West Zone",
        "city": "New Delhi",
        "population": 125000,
        "area_sq_km": 6.2,
        "councillor_name": "Shri Rajesh Verma",
        "latitude": 28.6448,
        "longitude": 77.1906
    },
    {
        "id": "WARD-44",
        "ward_number": 44,
        "name": "Hauz Khas Heritage & Urban Ward",
        "zone": "South Zone",
        "city": "New Delhi",
        "population": 98000,
        "area_sq_km": 7.1,
        "councillor_name": "Dr. Meenakshi Lekhi",
        "latitude": 28.5494,
        "longitude": 77.2001
    },
    {
        "id": "WARD-45",
        "ward_number": 45,
        "name": "Civil Lines / University Enclave",
        "zone": "North Zone",
        "city": "New Delhi",
        "population": 110000,
        "area_sq_km": 8.5,
        "councillor_name": "Shri Amit Goel",
        "latitude": 28.6720,
        "longitude": 77.2210
    },
    {
        "id": "WARD-46",
        "ward_number": 46,
        "name": "Nehru Place Commercial Hub & Kalkaji",
        "zone": "South-East Zone",
        "city": "New Delhi",
        "population": 105000,
        "area_sq_km": 5.4,
        "councillor_name": "Smt. Priyanka Gupta",
        "latitude": 28.5490,
        "longitude": 77.2510
    }
]

INITIAL_BUDGETS = [
    {
        "id": "BDG-2025-W42",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-42",
        "department_id": "DEP-ROADS",
        "approved_budget": 12500000.0, # 1.25 Cr
        "allocated_amount": 12000000.0,
        "funds_released": 9500000.0,
        "expenditure_recorded": 8200000.0,
        "outstanding_commitments": 1300000.0,
        "data_source": "Delhi Municipal Corporation Budget Gazette Table 4A",
        "reporting_period": "Q3 FY 2025-26",
        "is_synthetic": True
    },
    {
        "id": "BDG-2025-W43",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-43",
        "department_id": "DEP-WATER",
        "approved_budget": 14000000.0,
        "allocated_amount": 13500000.0,
        "funds_released": 11000000.0,
        "expenditure_recorded": 9800000.0,
        "outstanding_commitments": 1200000.0,
        "data_source": "Delhi Municipal Corporation Budget Gazette Table 4B",
        "reporting_period": "Q3 FY 2025-26",
        "is_synthetic": True
    },
    {
        "id": "BDG-2025-W44",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-44",
        "department_id": "DEP-LIGHTS",
        "approved_budget": 9500000.0,
        "allocated_amount": 9000000.0,
        "funds_released": 7500000.0,
        "expenditure_recorded": 5800000.0,
        "outstanding_commitments": 1700000.0,
        "data_source": "Delhi Municipal Corporation Budget Gazette Table 4C",
        "reporting_period": "Q3 FY 2025-26",
        "is_synthetic": True
    },
    {
        "id": "BDG-2025-W45",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-45",
        "department_id": "DEP-SAN",
        "approved_budget": 11000000.0,
        "allocated_amount": 10500000.0,
        "funds_released": 8200000.0,
        "expenditure_recorded": 7400000.0,
        "outstanding_commitments": 800000.0,
        "data_source": "Delhi Municipal Corporation Budget Gazette Table 4D",
        "reporting_period": "Q3 FY 2025-26",
        "is_synthetic": True
    },
    {
        "id": "BDG-2025-W46",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-46",
        "department_id": "DEP-ROADS",
        "approved_budget": 16000000.0,
        "allocated_amount": 15000000.0,
        "funds_released": 13000000.0,
        "expenditure_recorded": 11500000.0,
        "outstanding_commitments": 1500000.0,
        "data_source": "Delhi Municipal Corporation Budget Gazette Table 4E",
        "reporting_period": "Q3 FY 2025-26",
        "is_synthetic": True
    }
]

INITIAL_PROJECTS = [
    {
        "id": "PRJ-DEL-2025-01",
        "title": "Arterial Road Resurfacing & Deep Pothole Rehabilitation",
        "description": "Mechanized micro-surfacing and bituminous road foundation renewal along Outer Circle and radial corridors.",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-42",
        "department_id": "DEP-ROADS",
        "sanctioned_amount": 4200000.0,
        "expenditure_recorded": 3850000.0,
        "contractor_name": "Apex Road Infrastructure Ltd",
        "contractor_id": "CON-DEL-01",
        "status": "IN_PROGRESS",
        "start_date": "2025-10-15",
        "expected_completion_date": "2026-03-31",
        "milestones_json": json.dumps([
            {"milestone": "Site milling & excavation", "completed": True, "date": "2025-11-10"},
            {"milestone": "Sub-base compaction & asphalt coat", "completed": True, "date": "2025-12-20"},
            {"milestone": "Thermoplastic road markings", "completed": False, "target": "2026-03-25"}
        ]),
        "completion_pct": 82,
        "latest_update": "Asphalt concrete compaction verified by third-party ultrasonic road test. Thermoplastic lining in progress.",
        "source_document_url": "https://mcdonline.nic.in/tenders/PRJ-DEL-2025-01.pdf",
        "related_incident_category": "pothole",
        "is_synthetic": True
    },
    {
        "id": "PRJ-DEL-2025-02",
        "title": "Pre-Monsoon Underground Storm Trunk Drain Desilting",
        "description": "High-velocity hydro-jetting and automated silt clearance across 8 km of primary drainage channels.",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-43",
        "department_id": "DEP-WATER",
        "sanctioned_amount": 3500000.0,
        "expenditure_recorded": 3500000.0,
        "contractor_name": "Jal Hydro Utilities Private Limited",
        "contractor_id": "CON-DEL-02",
        "status": "COMPLETED",
        "start_date": "2025-09-01",
        "expected_completion_date": "2025-12-15",
        "milestones_json": json.dumps([
            {"milestone": "Silt catchment survey", "completed": True, "date": "2025-09-15"},
            {"milestone": "Hydro-jet clearance", "completed": True, "date": "2025-11-05"},
            {"milestone": "Pre-monsoon flow test", "completed": True, "date": "2025-12-10"}
        ]),
        "completion_pct": 100,
        "latest_update": "Drainage trunk line cleared. Capacity enhanced to 45 mm/hr runoff ingress.",
        "source_document_url": "https://mcdonline.nic.in/tenders/PRJ-DEL-2025-02.pdf",
        "related_incident_category": "drainage",
        "is_synthetic": True
    },
    {
        "id": "PRJ-DEL-2025-03",
        "title": "Connected Smart LED Streetlight Conversion (Phase 3)",
        "description": "Conversion of 1,200 obsolete sodium street lamps to remote-monitored LED fittings with automated fault telemetry.",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-44",
        "department_id": "DEP-LIGHTS",
        "sanctioned_amount": 2800000.0,
        "expenditure_recorded": 1900000.0,
        "contractor_name": "BrightGrid Power Solutions",
        "contractor_id": "CON-DEL-03",
        "status": "IN_PROGRESS",
        "start_date": "2025-11-01",
        "expected_completion_date": "2026-04-15",
        "milestones_json": json.dumps([
            {"milestone": "Pole load & wiring audit", "completed": True, "date": "2025-11-20"},
            {"milestone": "Installation of 800 LED fixtures", "completed": True, "date": "2026-01-15"},
            {"milestone": "Telemetry gateway deployment", "completed": False, "target": "2026-04-01"}
        ]),
        "completion_pct": 68,
        "latest_update": "840 poles converted. Cellular IoT gateway integration underway.",
        "source_document_url": "https://mcdonline.nic.in/tenders/PRJ-DEL-2025-03.pdf",
        "related_incident_category": "streetlight",
        "is_synthetic": True
    },
    {
        "id": "PRJ-DEL-2025-04",
        "title": "Automated Compact Waste Transfer Station Construction",
        "description": "Erection of odor-controlled mechanical waste compressor and automated container loading platform.",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-45",
        "department_id": "DEP-SAN",
        "sanctioned_amount": 4900000.0,
        "expenditure_recorded": 2100000.0,
        "contractor_name": "CleanCity Waste Management Corp",
        "contractor_id": "CON-DEL-04",
        "status": "DELAYED",
        "start_date": "2025-08-01",
        "expected_completion_date": "2025-12-31",
        "milestones_json": json.dumps([
            {"milestone": "Foundation civil works", "completed": True, "date": "2025-09-30"},
            {"milestone": "Hydraulic compactor delivery", "completed": False, "target": "2025-11-30"},
            {"milestone": "Electrification & commissioning", "completed": False, "target": "2025-12-31"}
        ]),
        "completion_pct": 42,
        "latest_update": "Delayed due to manufacturer component backlog on hydraulic press. Penalty notice issued to contractor.",
        "source_document_url": "https://mcdonline.nic.in/tenders/PRJ-DEL-2025-04.pdf",
        "related_incident_category": "garbage",
        "is_synthetic": True
    },
    {
        "id": "PRJ-DEL-2025-05",
        "title": "Nehru Place Pedestrian Skywalk & Footpath Reconstruction",
        "description": "Reconstruction of 3.2 km of continuous tactile pedestrian pathways with accessibility ramps and LED bollards.",
        "financial_year": "FY 2025-26",
        "ward_id": "WARD-46",
        "department_id": "DEP-ROADS",
        "sanctioned_amount": 5400000.0,
        "expenditure_recorded": 5100000.0,
        "contractor_name": "Apex Road Infrastructure Ltd",
        "contractor_id": "CON-DEL-01",
        "status": "COMPLETED",
        "start_date": "2025-07-01",
        "expected_completion_date": "2025-12-10",
        "milestones_json": json.dumps([
            {"milestone": "Demolition of encroached curb", "completed": True, "date": "2025-07-25"},
            {"milestone": "Paver block laying & tactiles", "completed": True, "date": "2025-10-15"},
            {"milestone": "Safety inspection & sign-off", "completed": True, "date": "2025-12-05"}
        ]),
        "completion_pct": 100,
        "latest_update": "Pedestrian walkway opened to public commuters. Zero accessibility non-conformities reported.",
        "source_document_url": "https://mcdonline.nic.in/tenders/PRJ-DEL-2025-05.pdf",
        "related_incident_category": "footpath",
        "is_synthetic": True
    }
]

def seed_initial_funds_data(db: Session) -> None:
    """Populates initial wards, budgets, and municipal projects."""
    for w in INITIAL_WARDS:
        existing = db.query(Ward).filter(Ward.id == w["id"]).first()
        if not existing:
            ward = Ward(**w)
            db.add(ward)
    db.commit()

    for b in INITIAL_BUDGETS:
        existing = db.query(MunicipalBudget).filter(MunicipalBudget.id == b["id"]).first()
        if not existing:
            budget = MunicipalBudget(**b)
            db.add(budget)
    db.commit()

    for p in INITIAL_PROJECTS:
        existing = db.query(MunicipalProject).filter(MunicipalProject.id == p["id"]).first()
        if not existing:
            project = MunicipalProject(**p)
            db.add(project)
    db.commit()

seed_initial_funds = seed_initial_funds_data

def get_municipal_funds_summary(
    db: Session,
    financial_year: str = "FY 2025-26",
    city: str = "New Delhi"
) -> Dict[str, Any]:
    """Calculates ward-wise and aggregate municipal expenditure accountability figures."""
    budgets = (
        db.query(MunicipalBudget)
        .join(Ward, MunicipalBudget.ward_id == Ward.id)
        .filter(MunicipalBudget.financial_year == financial_year)
        .all()
    )

    projects = (
        db.query(MunicipalProject)
        .filter(MunicipalProject.financial_year == financial_year)
        .all()
    )

    total_approved = sum(b.approved_budget for b in budgets)
    total_allocated = sum(b.allocated_amount for b in budgets)
    total_released = sum(b.funds_released for b in budgets)
    total_expenditure = sum(b.expenditure_recorded for b in budgets)
    total_commitments = sum(b.outstanding_commitments for b in budgets)
    remaining_balance = total_approved - total_expenditure

    utilization_pct = round((total_expenditure / total_approved * 100.0), 1) if total_approved > 0 else 0.0

    completed_projects = sum(1 for p in projects if p.status == "COMPLETED")
    delayed_projects = sum(1 for p in projects if p.status == "DELAYED")
    in_progress_projects = sum(1 for p in projects if p.status == "IN_PROGRESS")

    return {
        "financial_year": financial_year,
        "city": city,
        "total_approved_budget": total_approved,
        "total_allocated_amount": total_allocated,
        "total_funds_released": total_released,
        "total_expenditure_recorded": total_expenditure,
        "total_outstanding_commitments": total_commitments,
        "remaining_approved_balance": remaining_balance,
        "overall_utilization_pct": utilization_pct,
        "total_projects": len(projects),
        "completed_projects": completed_projects,
        "delayed_projects": delayed_projects,
        "in_progress_projects": in_progress_projects,
        "data_source": "Official Municipal Gazette (Simulated Demonstration Model)",
        "reporting_period": "Q3 FY 2025-26",
        "last_verified_at": datetime.now(timezone.utc).isoformat(),
        "is_synthetic_notice": "DEMO DATA: Financial figures are illustrative and simulated for hackathon evaluation."
    }

def get_ward_budget_table(
    db: Session,
    financial_year: str = "FY 2025-26"
) -> List[Dict[str, Any]]:
    """Returns ward-by-ward financial allocation, spend, and project status."""
    wards = db.query(Ward).all()
    result = []

    for ward in wards:
        budgets = (
            db.query(MunicipalBudget)
            .filter(
                MunicipalBudget.ward_id == ward.id,
                MunicipalBudget.financial_year == financial_year
            )
            .all()
        )
        projects = (
            db.query(MunicipalProject)
            .filter(
                MunicipalProject.ward_id == ward.id,
                MunicipalProject.financial_year == financial_year
            )
            .all()
        )

        appr = sum(b.approved_budget for b in budgets)
        alloc = sum(b.allocated_amount for b in budgets)
        rel = sum(b.funds_released for b in budgets)
        exp = sum(b.expenditure_recorded for b in budgets)
        util = round((exp / appr * 100.0), 1) if appr > 0 else 0.0

        result.append({
            "ward_id": ward.id,
            "ward_number": ward.ward_number,
            "ward_name": ward.name,
            "zone": ward.zone,
            "city": ward.city,
            "councillor_name": ward.councillor_name,
            "population": ward.population,
            "approved_budget": appr,
            "allocated_amount": alloc,
            "funds_released": rel,
            "expenditure_recorded": exp,
            "remaining_balance": appr - exp,
            "utilization_pct": util,
            "projects_count": len(projects),
            "completed_projects": sum(1 for p in projects if p.status == "COMPLETED"),
            "delayed_projects": sum(1 for p in projects if p.status == "DELAYED"),
            "latitude": ward.latitude,
            "longitude": ward.longitude
        })

    return result

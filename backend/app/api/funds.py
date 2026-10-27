import json
import csv
import io
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_government_user
from app.models.funds import Ward, MunicipalBudget, MunicipalProject
from app.models.incident import Incident
from app.models.user import User
from app.services.funds_service import (
    get_municipal_funds_summary,
    get_ward_budget_table,
)

router = APIRouter(prefix="/funds", tags=["Municipal Fund Tracker & Public Expenditure"])


class MilestoneItem(BaseModel):
    milestone: str
    completed: bool
    date: Optional[str] = None
    target: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str
    financial_year: str
    ward_id: str
    ward_name: Optional[str] = None
    department_id: Optional[str] = None
    sanctioned_amount: float
    expenditure_recorded: float
    contractor_name: Optional[str] = None
    contractor_id: Optional[str] = None
    status: str
    start_date: Optional[str] = None
    expected_completion_date: Optional[str] = None
    milestones: List[Dict[str, Any]] = []
    completion_pct: int
    latest_update: Optional[str] = None
    source_document_url: Optional[str] = None
    related_incident_category: Optional[str] = None
    related_active_incidents_count: int = 0
    is_synthetic: bool

    model_config = ConfigDict(from_attributes=True)


class ProjectUpdateRequest(BaseModel):
    status: Optional[str] = None
    completion_pct: Optional[int] = None
    expenditure_recorded: Optional[float] = None
    latest_update: Optional[str] = None
    milestones: Optional[List[Dict[str, Any]]] = None


class ProjectCreateRequest(BaseModel):
    title: str
    description: str
    financial_year: str = "FY 2025-26"
    ward_id: str
    department_id: Optional[str] = None
    sanctioned_amount: float
    expenditure_recorded: float = 0.0
    contractor_name: Optional[str] = None
    contractor_id: Optional[str] = None
    status: str = "PLANNED"
    start_date: Optional[str] = None
    expected_completion_date: Optional[str] = None
    milestones: List[Dict[str, Any]] = []
    completion_pct: int = 0
    latest_update: Optional[str] = None
    source_document_url: Optional[str] = None
    related_incident_category: Optional[str] = None


@router.get("/summary")
def get_funds_summary(
    financial_year: str = Query("FY 2025-26"),
    city: str = Query("New Delhi"),
    db: Session = Depends(get_db)
):
    """
    Public Municipal Funds Summary.
    Calculates approved budget, allocation, release, expenditure, and utilization rate.
    Includes explicit data source, reporting period, and synthetic demo indicators.
    """
    return get_municipal_funds_summary(db, financial_year=financial_year, city=city)


@router.get("/wards")
def get_ward_comparison(
    financial_year: str = Query("FY 2025-26"),
    db: Session = Depends(get_db)
):
    """
    Returns ward-by-ward financial allocation, spend, remaining balance, and project count.
    Used by public dashboards and interactive ward map selections.
    """
    return get_ward_budget_table(db, financial_year=financial_year)


@router.get("/projects", response_model=List[ProjectResponse])
def list_municipal_projects(
    ward_id: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    financial_year: str = Query("FY 2025-26"),
    contractor: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Lists municipal projects with public milestones, contractor disclosure, and spending progress.
    """
    query = db.query(MunicipalProject).filter(MunicipalProject.financial_year == financial_year)

    if ward_id and ward_id != "ALL":
        query = query.filter(MunicipalProject.ward_id == ward_id)
    if department_id and department_id != "ALL":
        query = query.filter(MunicipalProject.department_id == department_id)
    if status and status != "ALL":
        query = query.filter(MunicipalProject.status == status.upper())
    if contractor:
        query = query.filter(MunicipalProject.contractor_name.ilike(f"%{contractor}%"))
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (MunicipalProject.title.ilike(s)) |
            (MunicipalProject.description.ilike(s)) |
            (MunicipalProject.contractor_name.ilike(s))
        )

    projects = query.order_by(MunicipalProject.sanctioned_amount.desc()).all()
    results = []

    for prj in projects:
        milestones = []
        if prj.milestones_json:
            try:
                milestones = json.loads(prj.milestones_json)
            except Exception:
                milestones = []

        # Count related active incidents if category is present
        inc_count = 0
        if prj.related_incident_category:
            inc_count = db.query(Incident).filter(
                Incident.category == prj.related_incident_category,
                Incident.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS", "NEEDS_REVIEW", "ESCALATED", "REOPENED"])
            ).count()

        ward_name = prj.ward.name if prj.ward else None

        results.append(
            ProjectResponse(
                id=prj.id,
                title=prj.title,
                description=prj.description,
                financial_year=prj.financial_year,
                ward_id=prj.ward_id,
                ward_name=ward_name,
                department_id=prj.department_id,
                sanctioned_amount=prj.sanctioned_amount,
                expenditure_recorded=prj.expenditure_recorded,
                contractor_name=prj.contractor_name,
                contractor_id=prj.contractor_id,
                status=prj.status,
                start_date=prj.start_date,
                expected_completion_date=prj.expected_completion_date,
                milestones=milestones,
                completion_pct=prj.completion_pct,
                latest_update=prj.latest_update,
                source_document_url=prj.source_document_url,
                related_incident_category=prj.related_incident_category,
                related_active_incidents_count=inc_count,
                is_synthetic=prj.is_synthetic
            )
        )

    return results


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project_detail(project_id: str, db: Session = Depends(get_db)):
    """
    Returns full project transparency view including milestones and verified spend.
    """
    prj = db.query(MunicipalProject).filter(MunicipalProject.id == project_id).first()
    if not prj:
        raise HTTPException(status_code=404, detail="Municipal project not found")

    milestones = []
    if prj.milestones_json:
        try:
            milestones = json.loads(prj.milestones_json)
        except Exception:
            milestones = []

    inc_count = 0
    if prj.related_incident_category:
        inc_count = db.query(Incident).filter(
            Incident.category == prj.related_incident_category,
            Incident.status.in_(["NEW", "ASSIGNED", "IN_PROGRESS", "NEEDS_REVIEW", "ESCALATED", "REOPENED"])
        ).count()

    ward_name = prj.ward.name if prj.ward else None

    return ProjectResponse(
        id=prj.id,
        title=prj.title,
        description=prj.description,
        financial_year=prj.financial_year,
        ward_id=prj.ward_id,
        ward_name=ward_name,
        department_id=prj.department_id,
        sanctioned_amount=prj.sanctioned_amount,
        expenditure_recorded=prj.expenditure_recorded,
        contractor_name=prj.contractor_name,
        contractor_id=prj.contractor_id,
        status=prj.status,
        start_date=prj.start_date,
        expected_completion_date=prj.expected_completion_date,
        milestones=milestones,
        completion_pct=prj.completion_pct,
        latest_update=prj.latest_update,
        source_document_url=prj.source_document_url,
        related_incident_category=prj.related_incident_category,
        related_active_incidents_count=inc_count,
        is_synthetic=prj.is_synthetic
    )


@router.post("/projects", response_model=ProjectResponse)
def create_project(
    payload: ProjectCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_government_user)
):
    """
    Creates an official municipal project record. Protected for authorized government personnel.
    """
    # Verify ward exists
    ward = db.query(Ward).filter(Ward.id == payload.ward_id).first()
    if not ward:
        raise HTTPException(status_code=400, detail=f"Ward '{payload.ward_id}' not found.")

    new_id = f"PRJ-DEL-{datetime.now().strftime('%Y')}-{db.query(MunicipalProject).count() + 1:02d}"
    prj = MunicipalProject(
        id=new_id,
        title=payload.title,
        description=payload.description,
        financial_year=payload.financial_year,
        ward_id=payload.ward_id,
        department_id=payload.department_id,
        sanctioned_amount=payload.sanctioned_amount,
        expenditure_recorded=payload.expenditure_recorded,
        contractor_name=payload.contractor_name,
        contractor_id=payload.contractor_id,
        status=payload.status,
        start_date=payload.start_date,
        expected_completion_date=payload.expected_completion_date,
        milestones_json=json.dumps(payload.milestones),
        completion_pct=payload.completion_pct,
        latest_update=payload.latest_update,
        source_document_url=payload.source_document_url,
        related_incident_category=payload.related_incident_category,
        is_synthetic=False
    )
    db.add(prj)
    db.commit()
    db.refresh(prj)

    return ProjectResponse(
        id=prj.id,
        title=prj.title,
        description=prj.description,
        financial_year=prj.financial_year,
        ward_id=prj.ward_id,
        ward_name=ward.name,
        department_id=prj.department_id,
        sanctioned_amount=prj.sanctioned_amount,
        expenditure_recorded=prj.expenditure_recorded,
        contractor_name=prj.contractor_name,
        contractor_id=prj.contractor_id,
        status=prj.status,
        start_date=prj.start_date,
        expected_completion_date=prj.expected_completion_date,
        milestones=payload.milestones,
        completion_pct=prj.completion_pct,
        latest_update=prj.latest_update,
        source_document_url=prj.source_document_url,
        related_incident_category=prj.related_incident_category,
        related_active_incidents_count=0,
        is_synthetic=False
    )


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_government_user)
):
    """
    Updates progress, milestones, and expenditure for an official municipal project.
    Protected for authorized government personnel.
    """
    prj = db.query(MunicipalProject).filter(MunicipalProject.id == project_id).first()
    if not prj:
        raise HTTPException(status_code=404, detail="Municipal project not found")

    if payload.status:
        prj.status = payload.status.upper()
    if payload.completion_pct is not None:
        prj.completion_pct = max(0, min(100, payload.completion_pct))
    if payload.expenditure_recorded is not None:
        prj.expenditure_recorded = payload.expenditure_recorded
    if payload.latest_update:
        prj.latest_update = payload.latest_update
    if payload.milestones is not None:
        prj.milestones_json = json.dumps(payload.milestones)

    db.commit()
    db.refresh(prj)

    milestones = []
    if prj.milestones_json:
        try:
            milestones = json.loads(prj.milestones_json)
        except Exception:
            milestones = []

    ward_name = prj.ward.name if prj.ward else None
    return ProjectResponse(
        id=prj.id,
        title=prj.title,
        description=prj.description,
        financial_year=prj.financial_year,
        ward_id=prj.ward_id,
        ward_name=ward_name,
        department_id=prj.department_id,
        sanctioned_amount=prj.sanctioned_amount,
        expenditure_recorded=prj.expenditure_recorded,
        contractor_name=prj.contractor_name,
        contractor_id=prj.contractor_id,
        status=prj.status,
        start_date=prj.start_date,
        expected_completion_date=prj.expected_completion_date,
        milestones=milestones,
        completion_pct=prj.completion_pct,
        latest_update=prj.latest_update,
        source_document_url=prj.source_document_url,
        related_incident_category=prj.related_incident_category,
        related_active_incidents_count=0,
        is_synthetic=prj.is_synthetic
    )


@router.post("/import-csv")
async def import_budget_csv(
    file: UploadFile = File(...),
    financial_year: str = Query("FY 2025-26"),
    db: Session = Depends(get_db),
    user: User = Depends(require_government_user)
):
    """
    Imports budget or project CSV data with validation and audit attribution.
    Protected for authorized government finance officers.
    """
    content = await file.read()
    decoded = content.decode("utf-8-sig", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))

    rows_imported = 0
    for row in reader:
        ward_id = row.get("ward_id") or row.get("Ward ID")
        if not ward_id:
            continue
        ward = db.query(Ward).filter(Ward.id == ward_id.strip()).first()
        if not ward:
            continue

        try:
            approved = float(row.get("approved_budget", 0) or row.get("Approved", 0))
            allocated = float(row.get("allocated_amount", 0) or row.get("Allocated", 0))
            expenditure = float(row.get("expenditure_recorded", 0) or row.get("Spent", 0))

            existing = db.query(MunicipalBudget).filter(
                MunicipalBudget.ward_id == ward.id,
                MunicipalBudget.financial_year == financial_year
            ).first()

            if existing:
                existing.approved_budget = approved
                existing.allocated_amount = allocated
                existing.expenditure_recorded = expenditure
                existing.last_verified_at = datetime.now(timezone.utc)
            else:
                b = MunicipalBudget(
                    id=f"BDG-{financial_year.replace(' ', '')}-{ward.id}",
                    financial_year=financial_year,
                    ward_id=ward.id,
                    approved_budget=approved,
                    allocated_amount=allocated,
                    funds_released=allocated,
                    expenditure_recorded=expenditure,
                    data_source=f"Imported from {file.filename} by {user.full_name}",
                    last_verified_at=datetime.now(timezone.utc)
                )
                db.add(b)
            rows_imported += 1
        except Exception:
            continue

    db.commit()
    return {
        "status": "SUCCESS",
        "rows_processed": rows_imported,
        "message": f"Successfully updated financial allocations for {rows_imported} wards from CSV."
    }

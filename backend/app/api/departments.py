from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.department import Department
from app.schemas.department import DepartmentResponse, DepartmentAvailabilityUpdate
from app.services.simulation import simulation_service
from app.services.routing import router_service

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    router_service.seed_departments(db)
    return db.query(Department).all()

@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(department_id: str, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    return dept

@router.patch("/{department_id}/availability", response_model=DepartmentResponse)
def toggle_availability(
    department_id: str,
    payload: DepartmentAvailabilityUpdate,
    db: Session = Depends(get_db)
):
    result = simulation_service.set_department_outage(db, department_id, payload.available)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])

    dept = db.query(Department).filter(Department.id == department_id).first()
    return dept

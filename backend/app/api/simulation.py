from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.simulation import (
    SeedPotholeResponse,
    BadClosureResponse,
    AdvanceTimeRequest,
    AdvanceTimeResponse,
    DepartmentOutageRequest,
    ResetRequest,
    ResetResponse,
)
from app.services.simulation import simulation_service

router = APIRouter(prefix="/simulation", tags=["Simulation"])
sim_alias_router = APIRouter(prefix="/sim", tags=["Simulation (Legacy Alias)"])

@router.post("/seed-demo-data")
@sim_alias_router.post("/seed-demo-data")
def seed_demo_data(db: Session = Depends(get_db)):
    """Seeds ~8 synthetic operational cases in diverse lifecycles."""
    return simulation_service.seed_demo_data(db)

@router.post("/seed-pothole", response_model=SeedPotholeResponse)
@sim_alias_router.post("/seed-pothole", response_model=SeedPotholeResponse)
def seed_pothole_scenario(db: Session = Depends(get_db)):
    """Submits 3 citizen reports within 40m through the real intake pipeline."""
    return simulation_service.seed_pothole_scenario(db)

@router.post("/bad-closure", response_model=BadClosureResponse)
@sim_alias_router.post("/bad-closure", response_model=BadClosureResponse)
def simulate_bad_closure(
    incident_id: str = Query(None, description="Optional target incident ID"),
    db: Session = Depends(get_db)
):
    """Submits an invalid closure located ~300m away. Triggers verification failure and reopening."""
    return simulation_service.execute_bad_closure(db, incident_id)

@router.post("/advance-time", response_model=AdvanceTimeResponse)
@sim_alias_router.post("/advance-time", response_model=AdvanceTimeResponse)
def advance_time(payload: AdvanceTimeRequest, db: Session = Depends(get_db)):
    """Advances the simulation clock by the specified minutes and triggers the SLA monitor."""
    return simulation_service.advance_time(db, payload.minutes)

@router.post("/department-outage")
@sim_alias_router.post("/department-outage")
def set_department_outage(payload: DepartmentOutageRequest, db: Session = Depends(get_db)):
    """Marks a department offline and exercises fallback routing for active cases."""
    return simulation_service.set_department_outage(db, payload.department_id, payload.available)

@router.post("/reset", response_model=ResetResponse)
@sim_alias_router.post("/reset", response_model=ResetResponse)
def reset_demo(payload: ResetRequest, db: Session = Depends(get_db)):
    """Safely clears synthetic demo records. Requires explicit confirm=true."""
    return simulation_service.reset_demo(db, payload.confirm)

@router.post("/seed-demo-450")
@sim_alias_router.post("/seed-demo-450")
def seed_demo_450(
    count: int = Query(450, ge=100, le=500, description="Configurable record count between 100 and 500"),
    seed: int = Query(42, description="Random seed for deterministic data"),
    db: Session = Depends(get_db)
):
    """Generates 450 synthetic demo reports across 14 categories and 6 geographic clusters."""
    from app.services.demo_seeder import seed_synthetic_demo_records
    return seed_synthetic_demo_records(db, count=count, seed=seed)

@router.post("/reset-demo-450")
@sim_alias_router.post("/reset-demo-450")
def reset_demo_450(db: Session = Depends(get_db)):
    """Safely deletes all synthetic demo records while keeping live citizen reports untouched."""
    from app.services.demo_seeder import reset_demo_records
    return reset_demo_records(db)

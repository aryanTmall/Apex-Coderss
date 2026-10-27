from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.metrics import MetricsResponse
from app.services.metrics import metrics_service

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("", response_model=MetricsResponse)
def get_metrics(db: Session = Depends(get_db)):
    """Computes real-time operational and accountability metrics directly from persisted database records."""
    data = metrics_service.calculate_metrics(db)
    return data

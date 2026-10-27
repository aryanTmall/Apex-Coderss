import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.contractor_service import (
    get_all_contractors,
    get_contractor_detail,
    list_assessments,
    transition_assessment,
    evaluate_incident_penalty
)
from app.api.deps import get_current_user_optional, require_gov_user
from app.models.user import User

logger = logging.getLogger("civichelp.api.contractors")

router = APIRouter(prefix="/contractors", tags=["Contractor Performance & Penalties"])


class AssessmentTransitionRequest(BaseModel):
    status: str
    official_decision_notes: Optional[str] = None
    contractor_response: Optional[str] = None
    final_amount: Optional[float] = None


class IncidentPenaltyEvaluationRequest(BaseModel):
    incident_id: str
    reason: Optional[str] = "SLA_BREACH"


@router.get("", response_model=List[Dict[str, Any]])
def list_contractors_endpoint(db: Session = Depends(get_db)):
    """
    List all municipal contractors with trust scores and contract totals.
    Publicly accessible for transparency.
    """
    return get_all_contractors(db)


@router.get("/assessments", response_model=List[Dict[str, Any]])
def list_assessments_endpoint(
    contractor_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    List performance assessments, penalties, and incentive bonuses.
    """
    return list_assessments(db, contractor_id=contractor_id, status=status)


@router.get("/{contractor_id}", response_model=Dict[str, Any])
def get_contractor_endpoint(contractor_id: str, db: Session = Depends(get_db)):
    """
    Get detailed contractor profile including active contracts and audit assessments.
    """
    contractor = get_contractor_detail(db, contractor_id)
    if not contractor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contractor '{contractor_id}' not found."
        )
    return contractor


@router.post("/assessments/{assessment_id}/transition")
def transition_assessment_endpoint(
    assessment_id: str,
    payload: AssessmentTransitionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Transition assessment lifecycle (DETECTED -> EVIDENCE_REVIEW -> CALCULATED ->
    CONTRACTOR_NOTIFIED -> DISPUTED/ACCEPTED -> OFFICIAL_APPROVAL -> BILLING_ADJUSTMENT_PENDING -> RECONCILED)
    """
    try:
        user_id = current_user.id if current_user else "SYS-OPERATOR"
        result = transition_assessment(
            db=db,
            assessment_id=assessment_id,
            new_status=payload.status,
            notes=payload.official_decision_notes,
            contractor_response=payload.contractor_response,
            final_amount=payload.final_amount,
            user_id=user_id
        )
        return {
            "success": True,
            "message": f"Assessment {assessment_id} updated to {payload.status}.",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error transitioning assessment {assessment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error processing transition.")


@router.post("/evaluate-incident")
def trigger_incident_evaluation_endpoint(
    payload: IncidentPenaltyEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Evaluate an incident for automated contractual breach assessment.
    """
    assessment = evaluate_incident_penalty(
        db=db,
        incident_id=payload.incident_id,
        reason=payload.reason or "SLA_BREACH"
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not generate penalty assessment. Ensure incident exists and is mapped to an active contractor."
        )

    return {
        "success": True,
        "message": f"Penalty assessment {assessment.id} generated for incident {payload.incident_id}.",
        "assessment_id": assessment.id,
        "status": assessment.status,
        "recommended_amount": assessment.recommended_amount
    }

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.whistleblower_service import (
    submit_case,
    track_case_by_token,
    list_auditor_cases,
    get_auditor_case_detail,
    update_case_status
)
from app.api.deps import require_whistleblower_auditor, get_current_user_optional
from app.models.user import User

logger = logging.getLogger("civichelp.api.whistleblower")

router = APIRouter(prefix="/whistleblower", tags=["Confidential Whistleblower Portal"])


class WhistleblowerSubmitRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    allegation_category: str = Field(..., description="BRIBERY_CORRUPTION, ILLEGAL_CONSTRUCTION, PROCUREMENT_FRAUD, SUBSTANDARD_WORKS, INSPECTION_TAMPERING, OTHER")
    narrative: str = Field(..., min_length=20)
    ward_id: Optional[str] = None
    suspect_organization: Optional[str] = None
    is_anonymous: bool = True
    contact_channel: Optional[str] = None


class WhistleblowerStatusUpdateRequest(BaseModel):
    status: str
    verification_label: Optional[str] = None
    investigation_outcome: Optional[str] = None


@router.post("/submit", response_model=Dict[str, Any])
def submit_whistleblower_endpoint(
    payload: WhistleblowerSubmitRequest,
    db: Session = Depends(get_db)
):
    """
    Submit a confidential whistleblower allegation with complete anonymity.
    Generates a cryptographic secret token for future case inquiries.
    """
    try:
        res = submit_case(
            db=db,
            title=payload.title,
            allegation_category=payload.allegation_category,
            narrative=payload.narrative,
            ward_id=payload.ward_id,
            suspect_organization=payload.suspect_organization,
            is_anonymous=payload.is_anonymous,
            contact_channel=payload.contact_channel
        )
        return {
            "success": True,
            "message": "Confidential report registered. Save your secret case token securely.",
            "data": res
        }
    except Exception as e:
        logger.error(f"Error submitting whistleblower case: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error submitting confidential report.")


@router.get("/track", response_model=Dict[str, Any])
def track_whistleblower_endpoint(
    token: str = Query(..., min_length=16, description="Cryptographic case token issued during submission"),
    db: Session = Depends(get_db)
):
    """
    Query case progress anonymously using the secret case token.
    """
    case_info = track_case_by_token(db, case_token=token.strip())
    if not case_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No confidential case matches this token. Verify the secret key."
        )
    return {
        "success": True,
        "data": case_info
    }


@router.get("/cases", response_model=List[Dict[str, Any]])
def list_cases_endpoint(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_whistleblower_auditor)
):
    """
    Confidential auditor dossier queue. Restricted to WHISTLEBLOWER_AUDITOR or SUPER_ADMIN.
    """
    return list_auditor_cases(
        db=db,
        category=category,
        status=status_filter,
        auditor_user_id=current_user.id
    )


@router.get("/cases/{case_id}", response_model=Dict[str, Any])
def get_case_detail_endpoint(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_whistleblower_auditor)
):
    """
    Full case file inspection including evidence attachments and tamper-evident audit trail.
    """
    case = get_auditor_case_detail(db, case_id=case_id, auditor_user_id=current_user.id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case '{case_id}' not found.")
    return case


@router.post("/cases/{case_id}/status")
def update_case_status_endpoint(
    case_id: str,
    payload: WhistleblowerStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_whistleblower_auditor)
):
    """
    Update investigation status and record formal auditor outcome notes.
    """
    try:
        res = update_case_status(
            db=db,
            case_id=case_id,
            status=payload.status,
            verification_label=payload.verification_label,
            investigation_outcome=payload.investigation_outcome,
            auditor_user_id=current_user.id
        )
        return {
            "success": True,
            "message": f"Case {case_id} status updated to {payload.status}.",
            "data": res
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

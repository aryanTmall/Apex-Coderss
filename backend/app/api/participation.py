import logging
import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.participation_service import (
    list_proposals,
    get_proposal_detail,
    cast_vote,
    record_official_decision
)
from app.models.participation import CommunityProposal, PollOption
from app.api.deps import get_current_user_optional, require_gov_user
from app.models.user import User

logger = logging.getLogger("civichelp.api.participation")

router = APIRouter(prefix="/participation", tags=["Community Polls & Participatory Budgeting"])


class OptionCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: Optional[str] = None


class ProposalCreateRequest(BaseModel):
    title: str = Field(..., min_length=5)
    description: str = Field(..., min_length=10)
    ward_id: str
    category: str
    estimated_cost: float
    financial_year: Optional[str] = "FY 2025-26"
    expected_public_benefit: str
    feasibility_notes: Optional[str] = None
    options: List[OptionCreate] = Field(..., min_length=2)


class VoteRequest(BaseModel):
    poll_option_id: str
    participant_identity: Optional[str] = None  # e.g. browser fingerprinted UUID or phone


class DecisionRequest(BaseModel):
    status: str
    rationale: str = Field(..., min_length=5)


@router.get("/proposals", response_model=List[Dict[str, Any]])
def list_proposals_endpoint(
    ward_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    List civic proposals open for voting or under consideration.
    """
    return list_proposals(db, ward_id=ward_id, status=status)


@router.get("/proposals/{proposal_id}", response_model=Dict[str, Any])
def get_proposal_endpoint(proposal_id: str, db: Session = Depends(get_db)):
    """
    Get detailed proposal info, option breakdowns, and vote counts.
    """
    proposal = get_proposal_detail(db, proposal_id)
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Proposal '{proposal_id}' not found."
        )
    return proposal


@router.post("/proposals", response_model=Dict[str, Any])
def create_proposal_endpoint(
    payload: ProposalCreateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Submit a citizen or municipal community participatory budgeting proposal.
    """
    sub_type = "MUNICIPAL_OFFICER" if current_user and current_user.role != "CITIZEN" else "CITIZEN"
    proposal_id = f"PROP-{uuid.uuid4().hex[:8].upper()}"

    proposal = CommunityProposal(
        id=proposal_id,
        title=payload.title,
        description=payload.description,
        ward_id=payload.ward_id,
        category=payload.category,
        estimated_cost=payload.estimated_cost,
        financial_year=payload.financial_year or "FY 2025-26",
        expected_public_benefit=payload.expected_public_benefit,
        feasibility_notes=payload.feasibility_notes,
        submitted_by_type=sub_type,
        submitted_by_id=current_user.id if current_user else None,
        status="VOTING",
        total_votes_count=0
    )
    db.add(proposal)
    db.flush()

    for i, opt in enumerate(payload.options):
        option = PollOption(
            id=f"OPT-{proposal_id}-{i+1}",
            proposal_id=proposal.id,
            title=opt.title,
            description=opt.description,
            votes_count=0
        )
        db.add(option)

    db.commit()
    db.refresh(proposal)

    return {
        "success": True,
        "message": f"Proposal '{proposal.title}' created and open for voting.",
        "proposal_id": proposal.id
    }


@router.post("/proposals/{proposal_id}/vote")
def cast_vote_endpoint(
    proposal_id: str,
    payload: VoteRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Cast a tamper-evident vote for a proposal option with duplicate ballot prevention.
    """
    # Build participant identity from user, payload, or client IP
    client_ip = request.client.host if request.client else "127.0.0.1"
    participant_identity = payload.participant_identity or (current_user.id if current_user else client_ip)

    try:
        user_id = current_user.id if current_user else None
        res = cast_vote(
            db=db,
            proposal_id=proposal_id,
            poll_option_id=payload.poll_option_id,
            participant_identity=participant_identity,
            user_id=user_id
        )
        return res
    except ValueError as e:
        err_msg = str(e)
        if "already cast" in err_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=err_msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)


@router.post("/proposals/{proposal_id}/decision")
def record_decision_endpoint(
    proposal_id: str,
    payload: DecisionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Record government official review decision (APPROVED, REJECTED, DEFERRED).
    """
    try:
        user_id = current_user.id if current_user else "GOV-OFFICER"
        res = record_official_decision(
            db=db,
            proposal_id=proposal_id,
            status=payload.status,
            rationale=payload.rationale,
            user_id=user_id
        )
        return {
            "success": True,
            "message": f"Official decision recorded for proposal {proposal_id}.",
            "data": res
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.rewards_service import (
    get_catalog,
    get_leaderboard,
    get_or_create_account,
    get_account_details,
    record_earn_transaction,
    redeem_voucher
)
from app.models.rewards import RewardRedemption, RewardAccount, RewardCatalogItem
from app.api.deps import get_current_user_optional, require_government_user
from app.models.user import User

logger = logging.getLogger("civichelp.api.rewards")

router = APIRouter(prefix="/rewards", tags=["Civic Rewards & Leaderboard"])


class EarnCreditsRequest(BaseModel):
    citizen_identifier: str
    activity_type: str
    reference_id: Optional[str] = None
    description: Optional[str] = None


class RedeemRequest(BaseModel):
    citizen_identifier: str
    catalog_item_id: str


@router.get("/catalog", response_model=List[Dict[str, Any]])
def list_catalog_endpoint(db: Session = Depends(get_db)):
    """
    List civic rewards redemption catalog items.
    """
    return get_catalog(db)


@router.get("/leaderboard", response_model=List[Dict[str, Any]])
def get_leaderboard_endpoint(
    ward_id: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get privacy-preserving civic participation leaderboard.
    """
    return get_leaderboard(db, ward_id=ward_id, limit=limit)


@router.get("/account", response_model=Dict[str, Any])
def get_account_endpoint(
    citizen_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Fetch reward account balance, points history, and issued vouchers.
    """
    c_id = citizen_id or (current_user.id if current_user else "CIT-HASH-992144A")
    account = get_or_create_account(db, citizen_identifier=c_id)
    details = get_account_details(db, account.id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")
    return details


@router.post("/earn", response_model=Dict[str, Any])
def earn_points_endpoint(
    payload: EarnCreditsRequest,
    db: Session = Depends(get_db)
):
    """
    Award points for verified civic participation actions.
    """
    account = get_or_create_account(db, citizen_identifier=payload.citizen_identifier)
    try:
        res = record_earn_transaction(
            db=db,
            account_id=account.id,
            activity_type=payload.activity_type,
            reference_id=payload.reference_id,
            description=payload.description
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/redeem", response_model=Dict[str, Any])
def redeem_voucher_endpoint(
    payload: RedeemRequest,
    db: Session = Depends(get_db)
):
    """
    Redeem credit balance for digital municipal benefit or transit discount voucher.
    """
    account = get_or_create_account(db, citizen_identifier=payload.citizen_identifier)
    try:
        res = redeem_voucher(
            db=db,
            account_id=account.id,
            catalog_item_id=payload.catalog_item_id
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/redemptions", response_model=List[Dict[str, Any]])
def list_redemptions_admin_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_government_user)
):
    """
    Lists recent voucher redemptions for government anti-fraud audit and partner reconciliation.
    """
    redemptions = db.query(RewardRedemption).order_by(RewardRedemption.issued_at.desc()).limit(100).all()
    results = []
    for r in redemptions:
        results.append({
            "id": r.id,
            "account_id": r.account_id,
            "display_name": r.account.display_name if r.account else "Citizen",
            "voucher_code": r.voucher_code,
            "catalog_item_id": r.catalog_item_id,
            "catalog_title": r.catalog_item.title if r.catalog_item else "Voucher",
            "credits_spent": r.credits_spent,
            "status": r.status,
            "expires_at": r.expires_at.isoformat() if r.expires_at else None,
            "issued_at": r.issued_at.isoformat() if r.issued_at else None
        })
    return results


@router.post("/redemptions/{redemption_id}/status")
def update_redemption_status_endpoint(
    redemption_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_government_user)
):
    """
    Updates redemption status (e.g. FULFILLED, CANCELLED, FRAUD_FLAGGED).
    """
    redemption = db.query(RewardRedemption).filter(RewardRedemption.id == redemption_id).first()
    if not redemption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redemption not found.")

    new_status = payload.get("status", "FULFILLED").upper()
    redemption.status = new_status
    db.commit()

    return {
        "success": True,
        "message": f"Redemption {redemption_id} status updated to {new_status}.",
        "redemption_id": redemption_id,
        "status": new_status
    }

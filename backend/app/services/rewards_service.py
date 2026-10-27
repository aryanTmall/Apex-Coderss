import logging
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.rewards import RewardAccount, RewardLedgerEntry, RewardCatalogItem, RewardRedemption
from app.models.funds import Ward

logger = logging.getLogger("civichelp.rewards")

ACTIVITY_CREDITS_RULE = {
    "VALID_REPORT_RESOLVED": 50,
    "ADDITIONAL_EVIDENCE_VERIFIED": 20,
    "RESOLUTION_CONFIRMED": 30,
    "CONSULTATION_VOTE": 10,
    "DUPLICATE_REPORT_IDENTIFIED": 15,
}

DAILY_EARN_CAP = 250  # Maximum points earned in a 24h rolling period to prevent abuse

SEED_CATALOG = [
    {
        "id": "CAT-TRN-01",
        "title": "Delhi Metro 20% Transit Fare Voucher (Single Journey)",
        "description": "Redeemable for a 20% fare reduction QR voucher on Delhi Metro airport & regular network routes.",
        "category": "TRANSIT_DISCOUNT",
        "credits_cost": 100,
        "is_active": True,
        "is_partner_verified": False,  # Sandbox Demo Voucher
        "partner_name": "Delhi Metro Rail Corporation (DMRC Sandbox)",
        "terms_summary": "Demonstration Sandbox Voucher. Valid for 30 days from issuance. One redemption per journey."
    },
    {
        "id": "CAT-PRK-01",
        "title": "Municipal Multi-Level Smart Parking 2-Hour Exemption",
        "description": "Zero-charge 2-hour parking token at NDMC/MCD multi-level automated parking facilities.",
        "category": "PARKING_VOUCHER",
        "credits_cost": 80,
        "is_active": True,
        "is_partner_verified": False,
        "partner_name": "MCD Automated Parking Division",
        "terms_summary": "Applicable for 4-wheelers and 2-wheelers. Subject to bay availability."
    },
    {
        "id": "CAT-PLT-01",
        "title": "Ward Community Nursery Sapling & Geo-Tagged Tree Adoption",
        "description": "Claim a native Delhi neem/peepal sapling from municipal nurseries with commemorative adoption certificate.",
        "category": "MUNICIPAL_BENEFIT",
        "credits_cost": 150,
        "is_active": True,
        "is_partner_verified": True,
        "partner_name": "Delhi Parks & Gardens Society",
        "terms_summary": "Can be picked up from Ward 42-46 municipal horticulture depots."
    },
    {
        "id": "CAT-LIB-01",
        "title": "Delhi Public Library Digital Archives 1-Month Membership",
        "description": "Free digital membership access to e-books, competitive exam archives, and municipal journals.",
        "category": "MUNICIPAL_BENEFIT",
        "credits_cost": 120,
        "is_active": True,
        "is_partner_verified": False,
        "partner_name": "Delhi Public Library Board",
        "terms_summary": "Sandbox demo access credential issued via SMS/email upon redemption."
    }
]

SEED_ACCOUNTS = [
    {
        "id": "ACC-RW-001",
        "citizen_identifier": "CIT-HASH-992144A",
        "display_name": "CivicHero_SouthDelhi",
        "ward_id": "WARD-DEL-044",
        "total_earned_credits": 620,
        "current_balance": 470,
        "is_public_on_leaderboard": True,
    },
    {
        "id": "ACC-RW-002",
        "citizen_identifier": "CIT-HASH-312988B",
        "display_name": "GreenPotholeFixer",
        "ward_id": "WARD-DEL-043",
        "total_earned_credits": 490,
        "current_balance": 390,
        "is_public_on_leaderboard": True,
    },
    {
        "id": "ACC-RW-003",
        "citizen_identifier": "CIT-HASH-774102C",
        "display_name": "CleanStreets_42",
        "ward_id": "WARD-DEL-042",
        "total_earned_credits": 380,
        "current_balance": 380,
        "is_public_on_leaderboard": True,
    },
    {
        "id": "ACC-RW-004",
        "citizen_identifier": "CIT-HASH-883011D",
        "display_name": "Ward45_Sentinel",
        "ward_id": "WARD-DEL-045",
        "total_earned_credits": 310,
        "current_balance": 210,
        "is_public_on_leaderboard": True,
    },
    {
        "id": "ACC-RW-005",
        "citizen_identifier": "CIT-HASH-609123E",
        "display_name": "EcoWarrior_Dwarka",
        "ward_id": "WARD-DEL-046",
        "total_earned_credits": 260,
        "current_balance": 160,
        "is_public_on_leaderboard": True,
    }
]


def seed_rewards(db: Session) -> None:
    for cat_data in SEED_CATALOG:
        existing = db.query(RewardCatalogItem).filter(RewardCatalogItem.id == cat_data["id"]).first()
        if not existing:
            db.add(RewardCatalogItem(**cat_data))
    db.commit()

    for acc_data in SEED_ACCOUNTS:
        existing = db.query(RewardAccount).filter(RewardAccount.id == acc_data["id"]).first()
        if not existing:
            acc = RewardAccount(**acc_data)
            db.add(acc)
            db.flush()

            # Seed a couple initial ledger entries
            db.add(RewardLedgerEntry(
                id=f"TX-{uuid.uuid4().hex[:8].upper()}",
                account_id=acc.id,
                transaction_type="EARN",
                credits=acc.total_earned_credits,
                activity_type="VALID_REPORT_RESOLVED",
                description="Verified civic resolutions and community actions",
                verification_status="VERIFIED"
            ))
            if acc.total_earned_credits > acc.current_balance:
                diff = acc.total_earned_credits - acc.current_balance
                db.add(RewardLedgerEntry(
                    id=f"TX-{uuid.uuid4().hex[:8].upper()}",
                    account_id=acc.id,
                    transaction_type="REDEEM",
                    credits=diff,
                    activity_type="CATALOG_REDEMPTION",
                    description="Voucher redemption",
                    verification_status="VERIFIED"
                ))
    db.commit()
    logger.info("Civic rewards catalog and demonstration accounts seeded successfully.")


def get_or_create_account(
    db: Session,
    citizen_identifier: str,
    ward_id: Optional[str] = None,
    preferred_display_name: Optional[str] = None
) -> RewardAccount:
    account = db.query(RewardAccount).filter(RewardAccount.citizen_identifier == citizen_identifier).first()
    if not account:
        display_name = preferred_display_name or f"CivicCitizen_{secrets.token_hex(2).upper()}"
        account = RewardAccount(
            id=f"ACC-RW-{uuid.uuid4().hex[:8].upper()}",
            citizen_identifier=citizen_identifier,
            display_name=display_name,
            ward_id=ward_id,
            total_earned_credits=0,
            current_balance=0,
            is_public_on_leaderboard=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(account)
        db.commit()
        db.refresh(account)
    return account


def get_account_details(db: Session, account_id: str) -> Optional[Dict[str, Any]]:
    account = db.query(RewardAccount).filter(RewardAccount.id == account_id).first()
    if not account:
        return None

    ledger = db.query(RewardLedgerEntry).filter(RewardLedgerEntry.account_id == account.id).order_by(desc(RewardLedgerEntry.timestamp)).limit(20).all()
    redemptions = db.query(RewardRedemption).filter(RewardRedemption.account_id == account.id).order_by(desc(RewardRedemption.issued_at)).all()

    return {
        "id": account.id,
        "citizen_identifier": account.citizen_identifier,
        "display_name": account.display_name,
        "ward_id": account.ward_id,
        "total_earned_credits": account.total_earned_credits,
        "current_balance": account.current_balance,
        "is_public_on_leaderboard": account.is_public_on_leaderboard,
        "ledger": [
            {
                "id": entry.id,
                "transaction_type": entry.transaction_type,
                "credits": entry.credits,
                "activity_type": entry.activity_type,
                "reference_id": entry.reference_id,
                "description": entry.description,
                "verification_status": entry.verification_status,
                "timestamp": entry.timestamp.isoformat() if entry.timestamp else None
            }
            for entry in ledger
        ],
        "redemptions": [
            {
                "id": r.id,
                "catalog_item_id": r.catalog_item_id,
                "voucher_code": r.voucher_code,
                "credits_spent": r.credits_spent,
                "status": r.status,
                "expires_at": r.expires_at.isoformat() if r.expires_at else None,
                "issued_at": r.issued_at.isoformat() if r.issued_at else None
            }
            for r in redemptions
        ]
    }


def record_earn_transaction(
    db: Session,
    account_id: str,
    activity_type: str,
    reference_id: Optional[str] = None,
    description: Optional[str] = None
) -> Dict[str, Any]:
    account = db.query(RewardAccount).filter(RewardAccount.id == account_id).first()
    if not account:
        raise ValueError(f"Reward account '{account_id}' not found.")

    credits = ACTIVITY_CREDITS_RULE.get(activity_type, 10)

    # Check 24-hour earn cap to prevent abuse
    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_earnings = db.query(func.sum(RewardLedgerEntry.credits)).filter(
        RewardLedgerEntry.account_id == account.id,
        RewardLedgerEntry.transaction_type == "EARN",
        RewardLedgerEntry.timestamp >= since_24h
    ).scalar() or 0

    if recent_earnings + credits > DAILY_EARN_CAP:
        raise ValueError(f"Daily points earning cap reached ({DAILY_EARN_CAP} pts/24h). Anti-abuse rule active.")

    entry = RewardLedgerEntry(
        id=f"TX-{uuid.uuid4().hex[:8].upper()}",
        account_id=account.id,
        transaction_type="EARN",
        credits=credits,
        activity_type=activity_type,
        reference_id=reference_id,
        description=description or f"Points earned for {activity_type}",
        verification_status="VERIFIED",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(entry)

    account.current_balance += credits
    account.total_earned_credits += credits

    db.commit()
    db.refresh(account)

    return {
        "success": True,
        "entry_id": entry.id,
        "credits_earned": credits,
        "new_balance": account.current_balance,
        "total_earned": account.total_earned_credits
    }


def redeem_voucher(
    db: Session,
    account_id: str,
    catalog_item_id: str
) -> Dict[str, Any]:
    account = db.query(RewardAccount).filter(RewardAccount.id == account_id).first()
    if not account:
        raise ValueError(f"Reward account '{account_id}' not found.")

    catalog_item = db.query(RewardCatalogItem).filter(RewardCatalogItem.id == catalog_item_id).first()
    if not catalog_item:
        raise ValueError(f"Catalog item '{catalog_item_id}' not found.")

    if not catalog_item.is_active:
        raise ValueError("This reward item is currently inactive or out of allocation.")

    if account.current_balance < catalog_item.credits_cost:
        raise ValueError(f"Insufficient credit balance ({account.current_balance} pts). Required: {catalog_item.credits_cost} pts.")

    # Deduct points in ledger
    entry = RewardLedgerEntry(
        id=f"TX-{uuid.uuid4().hex[:8].upper()}",
        account_id=account.id,
        transaction_type="REDEEM",
        credits=catalog_item.credits_cost,
        activity_type="CATALOG_REDEMPTION",
        reference_id=catalog_item.id,
        description=f"Redeemed: {catalog_item.title}",
        verification_status="VERIFIED",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(entry)

    account.current_balance -= catalog_item.credits_cost

    # Generate unique tamper-proof voucher code
    prefix = catalog_item.id.replace("CAT-", "")
    voucher_code = f"CIVIC-{prefix}-{secrets.token_hex(3).upper()}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    redemption = RewardRedemption(
        id=f"RDM-{uuid.uuid4().hex[:8].upper()}",
        account_id=account.id,
        catalog_item_id=catalog_item.id,
        voucher_code=voucher_code,
        credits_spent=catalog_item.credits_cost,
        status="ISSUED",
        expires_at=expires_at,
        issued_at=datetime.now(timezone.utc)
    )
    db.add(redemption)

    db.commit()
    db.refresh(account)

    return {
        "success": True,
        "message": f"Successfully redeemed '{catalog_item.title}'!",
        "voucher_code": voucher_code,
        "expires_at": expires_at.isoformat(),
        "credits_spent": catalog_item.credits_cost,
        "remaining_balance": account.current_balance,
        "is_partner_verified": catalog_item.is_partner_verified,
        "partner_name": catalog_item.partner_name
    }


def get_leaderboard(db: Session, ward_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
    query = db.query(RewardAccount).filter(RewardAccount.is_public_on_leaderboard == True)
    if ward_id:
        query = query.filter(RewardAccount.ward_id == ward_id)

    accounts = query.order_by(desc(RewardAccount.total_earned_credits)).limit(limit).all()
    results = []
    for rank, acc in enumerate(accounts, 1):
        ward = db.query(Ward).filter(Ward.id == acc.ward_id).first()
        results.append({
            "rank": rank,
            "display_name": acc.display_name,
            "ward_name": ward.name if ward else "Citywide",
            "ward_number": ward.ward_number if ward else "",
            "total_earned_credits": acc.total_earned_credits,
            "badge_tier": "Civic Platinum" if acc.total_earned_credits >= 500 else "Civic Gold" if acc.total_earned_credits >= 300 else "Civic Silver"
        })
    return results


def get_catalog(db: Session) -> List[Dict[str, Any]]:
    items = db.query(RewardCatalogItem).filter(RewardCatalogItem.is_active == True).all()
    return [
        {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "category": item.category,
            "credits_cost": item.credits_cost,
            "is_partner_verified": item.is_partner_verified,
            "partner_name": item.partner_name,
            "terms_summary": item.terms_summary
        }
        for item in items
    ]

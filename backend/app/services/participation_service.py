import logging
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.participation import CommunityProposal, PollOption, CommunityVote
from app.models.funds import Ward

logger = logging.getLogger("civichelp.participation")

SEED_PROPOSALS = [
    {
        "id": "PROP-2026-01",
        "title": "High-Efficiency Solar Streetlight Grid for Dark Corridors",
        "description": "Deploy smart solar LED lighting fixtures with battery storage along vulnerable transit stretches and unlit pedestrian pathways.",
        "ward_id": "WARD-DEL-044",
        "category": "SOLAR_LIGHTING",
        "estimated_cost": 1800000.0,
        "financial_year": "FY 2025-26",
        "expected_public_benefit": "Reduces night-time crime incidents and pedestrian accidents while saving 42,000 kWh of grid electricity annually.",
        "feasibility_notes": "Technical review completed by Discom. Structural integrity of existing poles verified.",
        "submitted_by_type": "CITIZEN",
        "status": "VOTING",
        "total_votes_count": 142,
        "options": [
            {
                "id": "OPT-PROP-01-A",
                "title": "Option A: 45 Solar Smart Poles along Ring Road connector and transit corridors",
                "description": "High-lumen commercial grade luminaires focused on major commuter artery.",
                "votes_count": 89
            },
            {
                "id": "OPT-PROP-01-B",
                "title": "Option B: 60 Moderate-intensity solar units for interior residential feeder lanes",
                "description": "Distributed neighborhood coverage prioritized near schools and parks.",
                "votes_count": 53
            }
        ]
    },
    {
        "id": "PROP-2026-02",
        "title": "Rainwater Harvesting & Ground Recharge Basin",
        "description": "Construct community-level water retention ponds with desilting chambers to harvest monsoon runoff and prevent seasonal road flooding.",
        "ward_id": "WARD-DEL-043",
        "category": "DRAINAGE",
        "estimated_cost": 3200000.0,
        "financial_year": "FY 2025-26",
        "expected_public_benefit": "Recharges groundwater table by 15 million liters/season and eliminates chronic monsoon waterlogging at Main Market junction.",
        "feasibility_notes": "Soil percolation test successful. Site cleared of non-biodegradable debris.",
        "submitted_by_type": "MUNICIPAL_OFFICER",
        "status": "VOTING",
        "total_votes_count": 218,
        "options": [
            {
                "id": "OPT-PROP-02-A",
                "title": "Option A: Centralized percolation lake in Community Park with sediment traps",
                "description": "Ecological park revitalization with deep percolation wells.",
                "votes_count": 154
            },
            {
                "id": "OPT-PROP-02-B",
                "title": "Option B: Decentralized modular soak pits across 12 high-flooding intersections",
                "description": "Rapid local absorption chambers installed under roadside stormwater drains.",
                "votes_count": 64
            }
        ]
    },
    {
        "id": "PROP-2026-03",
        "title": "Pedestrian Safety & Universal Accessibility Walkway",
        "description": "Redesign pedestrian sidewalks with tactile blister pavers, wheelchair ramps, bollards, and table-top road crossings near primary schools.",
        "ward_id": "WARD-DEL-042",
        "category": "PEDESTRIAN_CROSSING",
        "estimated_cost": 2100000.0,
        "financial_year": "FY 2025-26",
        "expected_public_benefit": "Zero-accident safe school zone for 3,400 daily students and elderly residents.",
        "feasibility_notes": "Traffic police NOC received for speed cushions and signal timing modifications.",
        "submitted_by_type": "CITIZEN",
        "status": "UNDER_CONSIDERATION",
        "total_votes_count": 312,
        "official_decision_rationale": "High citizen turnout (312 votes). Technical survey initiated by PWD division.",
        "decision_recorded_at": datetime.now(timezone.utc),
        "options": [
            {
                "id": "OPT-PROP-03-A",
                "title": "Option A: Continuous raised pedestrian walkways with tactile paving and bollards",
                "description": "Separates vehicular and pedestrian traffic physically along 1.8km stretch.",
                "votes_count": 224
            },
            {
                "id": "OPT-PROP-03-B",
                "title": "Option B: Automated pelican pedestrian traffic signals with speed cushions",
                "description": "Synchronized on-demand signal crossing with audible cues for visually impaired.",
                "votes_count": 88
            }
        ]
    },
    {
        "id": "PROP-2026-04",
        "title": "Decentralized Wet-Waste Composting & Bio-Methanation Unit",
        "description": "Install automated composting tumblers to convert residential organic waste into certified organic fertilizer at the ward level.",
        "ward_id": "WARD-DEL-045",
        "category": "WASTE_MANAGEMENT",
        "estimated_cost": 2500000.0,
        "financial_year": "FY 2025-26",
        "expected_public_benefit": "Diverts 2.5 tons of organic waste from Ghazipur landfill daily; supplies compost to RWA parks.",
        "feasibility_notes": "Approved by MCD Environmental Cell.",
        "submitted_by_type": "CITIZEN",
        "status": "APPROVED",
        "total_votes_count": 405,
        "official_decision_rationale": "Sanctioned under Municipal Ward Innovation Fund FY 2025-26. Work order being drafted.",
        "decision_recorded_at": datetime.now(timezone.utc),
        "options": [
            {
                "id": "OPT-PROP-04-A",
                "title": "Option A: 2-ton daily processing mechanical tumbler at Zonal Waste Sorting Center",
                "description": "Enclosed, odor-controlled drum processor with automated temperature regulation.",
                "votes_count": 298
            },
            {
                "id": "OPT-PROP-04-B",
                "title": "Option B: 8 Sub-ward localized compost pits in municipal public gardens",
                "description": "Decentralized aerobic pit composting operated in coordination with local gardeners.",
                "votes_count": 107
            }
        ]
    }
]


def seed_proposals(db: Session) -> None:
    for p_data in SEED_PROPOSALS:
        existing = db.query(CommunityProposal).filter(CommunityProposal.id == p_data["id"]).first()
        if not existing:
            proposal = CommunityProposal(
                id=p_data["id"],
                title=p_data["title"],
                description=p_data["description"],
                ward_id=p_data["ward_id"],
                category=p_data["category"],
                estimated_cost=p_data["estimated_cost"],
                financial_year=p_data["financial_year"],
                expected_public_benefit=p_data["expected_public_benefit"],
                feasibility_notes=p_data.get("feasibility_notes"),
                submitted_by_type=p_data["submitted_by_type"],
                status=p_data["status"],
                total_votes_count=p_data["total_votes_count"],
                official_decision_rationale=p_data.get("official_decision_rationale"),
                decision_recorded_at=p_data.get("decision_recorded_at"),
                created_at=datetime.now(timezone.utc)
            )
            db.add(proposal)
            db.flush()

            for opt_data in p_data["options"]:
                option = PollOption(
                    id=opt_data["id"],
                    proposal_id=proposal.id,
                    title=opt_data["title"],
                    description=opt_data.get("description"),
                    votes_count=opt_data["votes_count"]
                )
                db.add(option)
    db.commit()
    logger.info("Community participatory proposals seeded successfully.")


def list_proposals(
    db: Session,
    ward_id: Optional[str] = None,
    status: Optional[str] = None
) -> List[Dict[str, Any]]:
    query = db.query(CommunityProposal)
    if ward_id:
        query = query.filter(CommunityProposal.ward_id == ward_id)
    if status:
        query = query.filter(CommunityProposal.status == status)

    proposals = query.order_by(desc(CommunityProposal.created_at)).all()
    results = []
    for p in proposals:
        ward = db.query(Ward).filter(Ward.id == p.ward_id).first()
        options = db.query(PollOption).filter(PollOption.proposal_id == p.id).all()
        results.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "ward_id": p.ward_id,
            "ward_name": ward.name if ward else "Ward",
            "ward_number": ward.ward_number if ward else "",
            "category": p.category,
            "estimated_cost": p.estimated_cost,
            "financial_year": p.financial_year,
            "expected_public_benefit": p.expected_public_benefit,
            "feasibility_notes": p.feasibility_notes,
            "submitted_by_type": p.submitted_by_type,
            "status": p.status,
            "total_votes_count": p.total_votes_count,
            "official_decision_rationale": p.official_decision_rationale,
            "decision_recorded_at": p.decision_recorded_at.isoformat() if p.decision_recorded_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "options": [
                {
                    "id": o.id,
                    "title": o.title,
                    "description": o.description,
                    "votes_count": o.votes_count,
                    "vote_pct": round((o.votes_count / max(1, p.total_votes_count)) * 100, 1)
                }
                for o in options
            ]
        })
    return results


def get_proposal_detail(db: Session, proposal_id: str) -> Optional[Dict[str, Any]]:
    p = db.query(CommunityProposal).filter(CommunityProposal.id == proposal_id).first()
    if not p:
        return None

    ward = db.query(Ward).filter(Ward.id == p.ward_id).first()
    options = db.query(PollOption).filter(PollOption.proposal_id == p.id).all()

    return {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "ward_id": p.ward_id,
        "ward_name": ward.name if ward else "Ward",
        "ward_number": ward.ward_number if ward else "",
        "category": p.category,
        "estimated_cost": p.estimated_cost,
        "financial_year": p.financial_year,
        "expected_public_benefit": p.expected_public_benefit,
        "feasibility_notes": p.feasibility_notes,
        "submitted_by_type": p.submitted_by_type,
        "status": p.status,
        "total_votes_count": p.total_votes_count,
        "official_decision_rationale": p.official_decision_rationale,
        "decision_recorded_at": p.decision_recorded_at.isoformat() if p.decision_recorded_at else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "options": [
            {
                "id": o.id,
                "title": o.title,
                "description": o.description,
                "votes_count": o.votes_count,
                "vote_pct": round((o.votes_count / max(1, p.total_votes_count)) * 100, 1)
            }
            for o in options
        ]
    }


def cast_vote(
    db: Session,
    proposal_id: str,
    poll_option_id: str,
    participant_identity: str,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    proposal = db.query(CommunityProposal).filter(CommunityProposal.id == proposal_id).first()
    if not proposal:
        raise ValueError(f"Proposal '{proposal_id}' not found.")

    if proposal.status not in ["VOTING", "UNDER_CONSIDERATION"]:
        raise ValueError(f"Proposal is currently in '{proposal.status}' status. Voting is closed.")

    option = db.query(PollOption).filter(PollOption.id == poll_option_id, PollOption.proposal_id == proposal_id).first()
    if not option:
        raise ValueError("Selected voting option does not belong to this proposal.")

    # Cryptographic participant fingerprint (SHA-256)
    fingerprint_raw = f"{proposal_id}:{participant_identity}"
    fingerprint = hashlib.sha256(fingerprint_raw.encode("utf-8")).hexdigest()

    existing_vote = db.query(CommunityVote).filter(
        CommunityVote.proposal_id == proposal_id,
        CommunityVote.participant_fingerprint == fingerprint
    ).first()

    if existing_vote:
        raise ValueError("Participant has already cast a ballot for this community proposal. Duplicate votes are prevented.")

    vote = CommunityVote(
        id=f"VOTE-{uuid.uuid4().hex[:10].upper()}",
        proposal_id=proposal_id,
        poll_option_id=poll_option_id,
        participant_fingerprint=fingerprint,
        user_id=user_id,
        voted_at=datetime.now(timezone.utc)
    )
    db.add(vote)

    # Increment counts atomically
    option.votes_count += 1
    proposal.total_votes_count += 1

    db.commit()
    db.refresh(proposal)
    db.refresh(option)

    return {
        "success": True,
        "message": "Vote recorded securely with ballot cryptographic fingerprint.",
        "vote_id": vote.id,
        "proposal_id": proposal_id,
        "option_id": poll_option_id,
        "total_votes_count": proposal.total_votes_count,
        "option_votes_count": option.votes_count
    }


def record_official_decision(
    db: Session,
    proposal_id: str,
    status: str,
    rationale: str,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    proposal = db.query(CommunityProposal).filter(CommunityProposal.id == proposal_id).first()
    if not proposal:
        raise ValueError(f"Proposal '{proposal_id}' not found.")

    valid_statuses = ["UNDER_CONSIDERATION", "APPROVED", "REJECTED", "DEFERRED", "COMPLETED"]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status '{status}'. Valid options: {', '.join(valid_statuses)}")

    proposal.status = status
    proposal.official_decision_rationale = rationale
    proposal.decision_recorded_at = datetime.now(timezone.utc)
    if user_id:
        proposal.decision_by_user_id = user_id

    db.commit()
    db.refresh(proposal)

    return {
        "id": proposal.id,
        "status": proposal.status,
        "rationale": proposal.official_decision_rationale,
        "decision_recorded_at": proposal.decision_recorded_at.isoformat()
    }

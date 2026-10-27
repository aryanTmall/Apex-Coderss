from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class CommunityProposal(Base):
    __tablename__ = "community_proposals"

    id = Column(String(50), primary_key=True, index=True) # e.g. PROP-2026-01
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    ward_id = Column(String(50), ForeignKey("wards.id"), nullable=False, index=True)
    category = Column(String(50), nullable=False) # SOLAR_LIGHTING, PARK_DEVELOPMENT, DRAINAGE, ROAD_REPAIR, PEDESTRIAN_CROSSING, WASTE_MANAGEMENT
    estimated_cost = Column(Float, nullable=False)
    financial_year = Column(String(20), default="FY 2025-26", nullable=False)
    expected_public_benefit = Column(Text, nullable=False)
    feasibility_notes = Column(Text, nullable=True)
    submitted_by_type = Column(String(30), default="CITIZEN", nullable=False) # CITIZEN, MUNICIPAL_OFFICER
    submitted_by_id = Column(String(50), nullable=True)
    # Lifecycle: DRAFT -> REVIEW -> PUBLISHED -> VOTING -> RESULTS_PUBLISHED -> UNDER_CONSIDERATION -> APPROVED / REJECTED / DEFERRED -> COMPLETED
    status = Column(String(50), default="VOTING", nullable=False, index=True)
    voting_start_at = Column(UTCDateTime, nullable=True)
    voting_end_at = Column(UTCDateTime, nullable=True)
    total_votes_count = Column(Integer, default=0, nullable=False)
    official_decision_rationale = Column(Text, nullable=True)
    decision_recorded_at = Column(UTCDateTime, nullable=True)
    decision_by_user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    ward = relationship("Ward")
    poll_options = relationship("PollOption", back_populates="proposal", cascade="all, delete-orphan")
    votes = relationship("CommunityVote", back_populates="proposal", cascade="all, delete-orphan")


class PollOption(Base):
    __tablename__ = "poll_options"

    id = Column(String(50), primary_key=True, index=True)
    proposal_id = Column(String(50), ForeignKey("community_proposals.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    votes_count = Column(Integer, default=0, nullable=False)

    proposal = relationship("CommunityProposal", back_populates="poll_options")


class CommunityVote(Base):
    __tablename__ = "community_votes"

    id = Column(String(50), primary_key=True, index=True)
    proposal_id = Column(String(50), ForeignKey("community_proposals.id"), nullable=False, index=True)
    poll_option_id = Column(String(50), ForeignKey("poll_options.id"), nullable=False)
    participant_fingerprint = Column(String(64), nullable=False, index=True) # SHA-256 hash
    user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    voted_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    proposal = relationship("CommunityProposal", back_populates="votes")
    poll_option = relationship("PollOption")

    __table_args__ = (
        UniqueConstraint("proposal_id", "participant_fingerprint", name="uq_proposal_participant_vote"),
    )

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base, UTCDateTime

class RewardAccount(Base):
    __tablename__ = "reward_accounts"

    id = Column(String(50), primary_key=True, index=True) # e.g. ACC-RW-001
    citizen_identifier = Column(String(64), unique=True, index=True, nullable=False) # Pseudonymous ID / Hash
    display_name = Column(String(100), nullable=False) # Privacy-preserving e.g. "CivicHero_42"
    ward_id = Column(String(50), ForeignKey("wards.id"), nullable=True)
    total_earned_credits = Column(Integer, default=0, nullable=False)
    current_balance = Column(Integer, default=0, nullable=False)
    is_public_on_leaderboard = Column(Boolean, default=True, nullable=False)
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    ward = relationship("Ward")
    ledger_entries = relationship("RewardLedgerEntry", back_populates="account", cascade="all, delete-orphan")
    redemptions = relationship("RewardRedemption", back_populates="account")


class RewardLedgerEntry(Base):
    __tablename__ = "reward_ledger_entries"

    id = Column(String(50), primary_key=True, index=True) # e.g. TX-RW-001
    account_id = Column(String(50), ForeignKey("reward_accounts.id"), nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False) # EARN, REDEEM, REVERSAL, ADJUSTMENT
    credits = Column(Integer, nullable=False)
    activity_type = Column(String(50), nullable=False) # VALID_REPORT_RESOLVED, ADDITIONAL_EVIDENCE_VERIFIED, RESOLUTION_CONFIRMED, CONSULTATION_VOTE, DUPLICATE_REPORT_IDENTIFIED
    reference_id = Column(String(50), nullable=True, index=True) # e.g. incident_id or proposal_id
    description = Column(String(255), nullable=False)
    verification_status = Column(String(30), default="VERIFIED", nullable=False)
    created_by = Column(String(50), default="SYSTEM_RULES_ENGINE", nullable=False)
    timestamp = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    account = relationship("RewardAccount", back_populates="ledger_entries")


class RewardCatalogItem(Base):
    __tablename__ = "reward_catalog_items"

    id = Column(String(50), primary_key=True, index=True) # e.g. CAT-TRN-01
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False) # TRANSIT_DISCOUNT, PARKING_VOUCHER, MUNICIPAL_BENEFIT
    credits_cost = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_partner_verified = Column(Boolean, default=False, nullable=False) # False = Sandbox Demo Voucher
    partner_name = Column(String(150), default="Delhi Metro & Municipal Utilities", nullable=False)
    terms_summary = Column(String(500), nullable=False)


class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    id = Column(String(50), primary_key=True, index=True) # e.g. RDM-2026-001
    account_id = Column(String(50), ForeignKey("reward_accounts.id"), nullable=False, index=True)
    catalog_item_id = Column(String(50), ForeignKey("reward_catalog_items.id"), nullable=False)
    voucher_code = Column(String(50), unique=True, index=True, nullable=False)
    credits_spent = Column(Integer, nullable=False)
    status = Column(String(30), default="ISSUED", nullable=False) # ISSUED, REDEEMED, EXPIRED, CANCELLED
    expires_at = Column(UTCDateTime, nullable=False)
    issued_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    account = relationship("RewardAccount", back_populates="redemptions")
    catalog_item = relationship("RewardCatalogItem")

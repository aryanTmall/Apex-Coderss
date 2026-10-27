from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Text
from app.database import Base, UTCDateTime

class MessagingMessage(Base):
    __tablename__ = "messaging_messages"

    id = Column(String(50), primary_key=True, index=True) # e.g. MSG-IN-001
    provider = Column(String(30), nullable=False) # WHATSAPP, SMS, SANDBOX
    external_message_id = Column(String(100), unique=True, index=True, nullable=False)
    sender_phone = Column(String(50), nullable=False, index=True)
    recipient_phone = Column(String(50), nullable=False)
    direction = Column(String(10), default="INBOUND", nullable=False) # INBOUND, OUTBOUND
    body = Column(Text, nullable=False)
    media_url = Column(String(500), nullable=True)
    raw_payload_json = Column(Text, nullable=True)
    status = Column(String(30), default="PROCESSED", nullable=False) # RECEIVED, PROCESSED, FAILED
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    phone = Column(String(50), primary_key=True, index=True)
    opted_in = Column(Boolean, default=True, nullable=False)
    opted_out_at = Column(UTCDateTime, nullable=True)
    created_at = Column(UTCDateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

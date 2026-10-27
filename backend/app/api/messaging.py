import logging
import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Form, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.services.messaging_service import messaging_service
from app.models.messaging import MessagingMessage, NotificationPreference

logger = logging.getLogger("civichelp.api.messaging")

router = APIRouter(prefix="/messaging", tags=["WhatsApp & SMS Messaging Bot"])


class SandboxSimulateRequest(BaseModel):
    sender_phone: str = Field("+91 98100 12345", description="Simulated sender phone number")
    body: str = Field(..., min_length=1, description="Message text (e.g. 'Pothole on Main Road' or 'STATUS REP-1029')")
    provider: Optional[str] = Field("WHATSAPP", description="WHATSAPP or SMS")
    media_url: Optional[str] = None


@router.post("/sandbox/simulate", response_model=Dict[str, Any])
def simulate_messaging_endpoint(
    payload: SandboxSimulateRequest,
    db: Session = Depends(get_db)
):
    """
    Browser-based interactive simulator for testing WhatsApp and SMS bot intake.
    Allows complete testing without external webhook credentials.
    """
    external_id = f"SIM-{uuid.uuid4().hex[:12].upper()}"
    res = messaging_service.process_incoming_message(
        db=db,
        provider=payload.provider or "WHATSAPP",
        external_message_id=external_id,
        sender_phone=payload.sender_phone,
        recipient_phone="+91 11 2345 6789",  # CivicHelp Municipal Gateway
        body=payload.body,
        media_url=payload.media_url
    )
    return res


@router.post("/whatsapp/webhook")
async def whatsapp_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Inbound webhook for WhatsApp Business API / Twilio WhatsApp.
    Supports both JSON and form-urlencoded payloads.
    """
    content_type = request.headers.get("content-type", "")
    external_id = f"WA-{uuid.uuid4().hex[:12]}"
    sender = "+91 99999 00000"
    body = ""
    media_url = None

    if "application/json" in content_type:
        data = await request.json()
        external_id = data.get("id", data.get("MessageSid", external_id))
        sender = data.get("from", data.get("From", sender))
        body = data.get("text", {}).get("body", data.get("Body", ""))
    else:
        form = await request.form()
        external_id = form.get("MessageSid", external_id)
        sender = form.get("From", sender)
        body = form.get("Body", "")
        media_url = form.get("MediaUrl0")

    result = messaging_service.process_incoming_message(
        db=db,
        provider="WHATSAPP",
        external_message_id=external_id,
        sender_phone=sender,
        recipient_phone="+91 11 2345 6789",
        body=body,
        media_url=media_url
    )
    return result


@router.post("/sms/webhook")
async def sms_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Inbound webhook for SMS gateways.
    """
    content_type = request.headers.get("content-type", "")
    external_id = f"SMS-{uuid.uuid4().hex[:12]}"
    sender = "+91 99999 00000"
    body = ""

    if "application/json" in content_type:
        data = await request.json()
        external_id = data.get("id", data.get("MessageSid", external_id))
        sender = data.get("from", data.get("From", sender))
        body = data.get("body", data.get("Body", ""))
    else:
        form = await request.form()
        external_id = form.get("MessageSid", external_id)
        sender = form.get("From", sender)
        body = form.get("Body", "")

    result = messaging_service.process_incoming_message(
        db=db,
        provider="SMS",
        external_message_id=external_id,
        sender_phone=sender,
        recipient_phone="+91 11 2345 6789",
        body=body
    )
    return result


@router.get("/history", response_model=List[Dict[str, Any]])
def get_messaging_history(
    phone: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve message history for simulator or inspection.
    """
    query = db.query(MessagingMessage)
    if phone:
        query = query.filter(
            (MessagingMessage.sender_phone == phone) | (MessagingMessage.recipient_phone == phone)
        )
    messages = query.order_by(desc(MessagingMessage.created_at)).limit(limit).all()

    return [
        {
            "id": m.id,
            "provider": m.provider,
            "direction": m.direction,
            "sender_phone": m.sender_phone,
            "recipient_phone": m.recipient_phone,
            "body": m.body,
            "media_url": m.media_url,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in reversed(messages)
    ]

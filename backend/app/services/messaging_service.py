import re
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.messaging import MessagingMessage, NotificationPreference
from app.models.report import CitizenReport
from app.models.incident import Incident
from app.models.department import Department
from app.services.routing import router_service

logger = logging.getLogger("civichelp.messaging")


class MessagingService:
    def process_incoming_message(
        self,
        db: Session,
        provider: str,
        external_message_id: str,
        sender_phone: str,
        recipient_phone: str,
        body: str,
        media_url: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Idempotency check
        existing = db.query(MessagingMessage).filter(
            MessagingMessage.external_message_id == external_message_id
        ).first()
        if existing:
            logger.info(f"Duplicate incoming message {external_message_id} ignored.")
            return {
                "idempotent": True,
                "message_id": existing.id,
                "reply": "Message already received and acknowledged."
            }

        # 2. Record incoming message
        inbound = MessagingMessage(
            id=f"MSG-IN-{uuid.uuid4().hex[:8].upper()}",
            provider=provider.upper(),
            external_message_id=external_message_id,
            sender_phone=sender_phone,
            recipient_phone=recipient_phone,
            direction="INBOUND",
            body=body,
            media_url=media_url,
            status="PROCESSED",
            created_at=datetime.now(timezone.utc)
        )
        db.add(inbound)

        # 3. Notification preference check
        pref = db.query(NotificationPreference).filter(
            NotificationPreference.phone == sender_phone
        ).first()
        if not pref:
            pref = NotificationPreference(
                phone=sender_phone,
                opted_in=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(pref)

        # 4. State machine & command interpretation
        cleaned_body = body.strip()
        upper_body = cleaned_body.upper()
        reply_text = ""

        if upper_body in ["STOP", "OPTOUT", "OPT-OUT", "UNSUBSCRIBE"]:
            pref.opted_in = False
            pref.opted_out_at = datetime.now(timezone.utc)
            reply_text = "CivicHelp: You have unsubscribed from automated civic alerts. Reply START anytime to re-enable notifications."

        elif upper_body in ["START", "OPTIN", "OPT-IN", "RESUME"]:
            pref.opted_in = True
            pref.opted_out_at = None
            reply_text = "CivicHelp: Welcome back! You are now subscribed to automated civic updates and status notifications."

        elif upper_body in ["HELP", "?", "MENU"]:
            reply_text = (
                "CivicHelp 24x7 Civic Assistant:\n"
                "• Send report description + landmark to report an issue (e.g. 'Pothole near Saket Metro')\n"
                "• STATUS <tracking_id> — Check status of your reported issue\n"
                "• STOP — Opt-out of SMS alerts\n"
                "• EMERGENCY — Call 112 for police/fire/ambulance"
            )

        elif upper_body.startswith("STATUS"):
            # Format: STATUS REP-xxxx or STATUS INC-xxxx
            tokens = cleaned_body.split()
            if len(tokens) >= 2:
                track_id = tokens[1].strip().upper()
                reply_text = self._lookup_status(db, track_id)
            else:
                reply_text = "Please provide your tracking ID. Example: STATUS REP-10294"

        else:
            # Freeform Civic Report Intake
            reply_text = self._handle_report_intake(db, sender_phone, cleaned_body, media_url)

        # Record outbound response
        outbound = MessagingMessage(
            id=f"MSG-OUT-{uuid.uuid4().hex[:8].upper()}",
            provider=provider.upper(),
            external_message_id=f"OUT-{uuid.uuid4().hex[:12].upper()}",
            sender_phone=recipient_phone,
            recipient_phone=sender_phone,
            direction="OUTBOUND",
            body=reply_text,
            status="PROCESSED",
            created_at=datetime.now(timezone.utc)
        )
        db.add(outbound)
        db.commit()

        return {
            "success": True,
            "inbound_id": inbound.id,
            "outbound_id": outbound.id,
            "reply": reply_text
        }

    def _lookup_status(self, db: Session, track_id: str) -> str:
        # Check citizen_reports first
        report = db.query(CitizenReport).filter(
            (CitizenReport.tracking_id == track_id) | (CitizenReport.id == track_id)
        ).first()

        if report:
            incident = None
            if report.incident_id:
                incident = db.query(Incident).filter(Incident.id == report.incident_id).first()

            status_str = incident.status if incident else "TRIAGE"
            dept = db.query(Department).filter(Department.id == incident.department_id).first() if incident else None
            dept_name = dept.name if dept else "Municipal Triage Cell"

            return (
                f"CivicHelp Update for [{report.tracking_id}]:\n"
                f"Status: {status_str}\n"
                f"Department: {dept_name}\n"
                f"Category: {report.category.replace('_', ' ').title()}\n"
                f"Track live: http://localhost:5173/track?id={report.tracking_id}"
            )

        # Check incidents directly
        incident = db.query(Incident).filter(Incident.id == track_id).first()
        if incident:
            dept = db.query(Department).filter(Department.id == incident.department_id).first()
            dept_name = dept.name if dept else "Municipal Triage Cell"
            return (
                f"CivicHelp Incident [{incident.id}]:\n"
                f"Status: {incident.status}\n"
                f"Department: {dept_name}\n"
                f"Priority: {incident.priority}\n"
                f"Category: {incident.category.replace('_', ' ').title()}\n"
                f"Track live: http://localhost:5173/track?id={incident.tracking_id}"
            )

        return f"CivicHelp: No record found for ID '{track_id}'. Please check the tracking number and try again."

    def _handle_report_intake(self, db: Session, sender_phone: str, text: str, media_url: Optional[str]) -> str:
        tracking_id = f"REP-{uuid.uuid4().hex[:8].upper()}"

        # Heuristic category matching
        lower = text.lower()
        cat = "OTHER"
        if any(w in lower for w in ["pothole", "gaddha", "sadak", "road"]):
            cat = "POTHOLE"
        elif any(w in lower for w in ["light", "batti", "pole", "andhera"]):
            cat = "STREETLIGHT"
        elif any(w in lower for w in ["water", "paani", "leak", "pipeline"]):
            cat = "WATER_LEAKAGE"
        elif any(w in lower for w in ["garbage", "kachra", "kuda", "waste", "safai"]):
            cat = "GARBAGE"
        elif any(w in lower for w in ["drain", "naali", "sewer", "waterlogging"]):
            cat = "DRAINAGE"

        # Create intake report
        report = CitizenReport(
            id=f"CR-{uuid.uuid4().hex[:8].upper()}",
            tracking_id=tracking_id,
            category=cat,
            text=text,
            address="Reported via WhatsApp/SMS Channel",
            approximate_locality="Delhi Municipal Area",
            latitude=28.6139,
            longitude=77.2090,
            location_mode="APPROXIMATE",
            location_status="CITY_FALLBACK",
            photo_data=media_url,
            is_demo=False,
            dataset="LIVE",
            created_at=datetime.now(timezone.utc)
        )
        db.add(report)
        db.flush()

        # Route report into incident management
        try:
            incident, is_new = router_service.route_report(db, report)
            dept_name = "Assigned Department"
            if incident and incident.department_id:
                dept = db.query(Department).filter(Department.id == incident.department_id).first()
                if dept:
                    dept_name = dept.name
        except Exception as e:
            logger.warning(f"Auto-routing for messaging report failed: {e}")
            dept_name = "Municipal Triage Cell"

        return (
            f"CivicHelp Acknowledgment:\n"
            f"Your report has been logged successfully!\n"
            f"Tracking ID: {tracking_id}\n"
            f"Assigned To: {dept_name}\n"
            f"Category: {cat.replace('_', ' ').title()}\n"
            f"Track real-time resolution: http://localhost:5173/track?id={tracking_id}"
        )


messaging_service = MessagingService()

import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
import urllib.request
import urllib.parse
from sqlalchemy.orm import Session
from app.config import settings
from app.models.incident import Incident
from app.models.report import CitizenReport
from app.models.closure import ClosureSubmission
from app.models.audit import AuditEvent
from app.models.hotspot import Hotspot
from app.models.department import Department
from app.models.emergency import EmergencyResource
from app.models.user import User
from app.services.sim_clock import sim_clock
from app.services.metrics import metrics_service
from app.services.intelligence import civic_intelligence

logger = logging.getLogger("civichelp.chat")

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

class ChatbotService:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY.strip()
        self.gemini_model = settings.GEMINI_MODEL
        self.genai_client = None
        self._init_client()

    def _init_client(self):
        key = (settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")).strip()
        self.gemini_api_key = key
        self.gemini_model = settings.GEMINI_MODEL or os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        if genai and key and not key.startswith("AQ.dummy"):
            try:
                self.genai_client = genai.Client(api_key=key)
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI client: {e}")
                self.genai_client = None
        else:
            self.genai_client = None

    def get_status(self) -> Dict[str, Any]:
        self._init_client()
        has_gemini = bool(self.genai_client is not None)
        active_provider = "gemini" if has_gemini else "deterministic_fallback"

        return {
            "status": "ready",
            "active_provider": active_provider,
            "gemini_configured": has_gemini,
            "gemini_model": self.gemini_model,
            "openrouter_configured": False,
            "fallback_available": True,
            "supported_intents": [
                "TRACK_INCIDENT",
                "OPERATIONAL_METRICS",
                "HOTSPOT_QUERY",
                "EXPLAIN_CLOSURE_FAILURE",
                "EMERGENCY_RESOURCES",
                "CIVIC_FAQ",
                "REPORTING_ASSISTANCE"
            ]
        }

    # --- Tool: Emergency Resource Lookup ---
    def tool_lookup_emergency(self, db: Session, query_text: str) -> List[Dict[str, Any]]:
        resources = db.query(EmergencyResource).filter(EmergencyResource.is_active == True).order_by(EmergencyResource.display_order.asc()).all()
        results = []
        for r in resources:
            results.append({
                "name": r.name,
                "phone": r.phone_number,
                "category": r.category,
                "jurisdiction": r.jurisdiction,
                "hours": r.available_hours,
                "source": r.source_url
            })
        return results

    # --- Tool 1: Lookup Incident ---
    def tool_lookup_incident(self, db: Session, tracking_id: str, is_gov_user: bool = False) -> Optional[Dict[str, Any]]:
        clean_id = tracking_id.strip().upper()
        incident = db.query(Incident).filter(
            (Incident.tracking_id == clean_id) |
            (Incident.id == clean_id.lower())
        ).first()

        if not incident:
            rep = db.query(CitizenReport).filter(CitizenReport.tracking_id == clean_id).first()
            if rep and rep.incident_id:
                incident = db.query(Incident).filter(Incident.id == rep.incident_id).first()

        if not incident:
            return None

        now = sim_clock.now()
        sla_str = "No SLA recorded"
        if incident.sla_due_at:
            sla_dt = incident.sla_due_at
            if sla_dt.tzinfo is None:
                from datetime import timezone
                sla_dt = sla_dt.replace(tzinfo=timezone.utc)
            if sla_dt > now:
                diff = sla_dt - now
                hours = int(diff.total_seconds() // 3600)
                mins = int((diff.total_seconds() % 3600) // 60)
                sla_str = f"{hours}h {mins}m remaining (Deadline: {sla_dt.strftime('%H:%M UTC')})"
            else:
                diff = now - sla_dt
                hours = int(diff.total_seconds() // 3600)
                sla_str = f"BREACHED by {hours}h (Expired {sla_dt.strftime('%b %d, %H:%M UTC')})"

        audits = db.query(AuditEvent).filter(AuditEvent.incident_id == incident.id).order_by(AuditEvent.timestamp.desc()).limit(3).all()
        recent_activity = [f"[{a.timestamp.strftime('%H:%M')}] {a.action}: {a.reason}" for a in audits]

        res = {
            "id": incident.id,
            "tracking_id": incident.tracking_id,
            "title": incident.title,
            "category": incident.category,
            "priority": incident.priority,
            "status": incident.status,
            "location_mode": incident.location_mode,
            "location_status": incident.location_status,
            "address": incident.address or incident.approximate_locality or "Urban Grid",
            "department": incident.department_id,
            "sla_status": sla_str,
            "reopen_count": incident.reopen_count,
            "escalation_tier": f"Level {incident.escalation_tier}",
            "recent_activity": recent_activity
        }

        # Confidential fields only for authorized government operators
        if is_gov_user:
            res["root_cause_hypothesis"] = incident.root_cause_hypothesis
            res["ai_classification_metadata"] = incident.ai_classification_metadata

        return res

    # --- Tool 2: Operational Metrics ---
    def tool_operational_metrics(self, db: Session) -> Dict[str, Any]:
        return metrics_service.get_dashboard_metrics(db)

    # --- Tool 3: Query Hotspots ---
    def tool_query_hotspots(self, db: Session) -> List[Dict[str, Any]]:
        hotspots = db.query(Hotspot).all()
        return [
            {
                "id": h.id,
                "name": h.name,
                "category": getattr(h, "category", getattr(h, "primary_category", "GENERAL")),
                "incident_count": h.incident_count,
                "severity": h.severity_level,
                "zone_name": getattr(h, "zone_name", "Delhi Zone")
            }
            for h in hotspots
        ]

    # --- Tool 4: Explain Verification Rejection ---
    def tool_explain_verification_failure(self, db: Session, incident_id: str) -> Optional[Dict[str, Any]]:
        closure = db.query(ClosureSubmission).filter(
            ClosureSubmission.incident_id == incident_id,
            ClosureSubmission.verification_status == "REJECTED"
        ).order_by(ClosureSubmission.submitted_at.desc()).first()

        if not closure:
            return None

        failed_checks = []
        if closure.individual_checks:
            for check_name, check_data in closure.individual_checks.items():
                if check_data.get("status") == "FAILED":
                    failed_checks.append({
                        "check": check_name,
                        "explanation": check_data.get("explanation")
                    })

        return {
            "incident_id": incident_id,
            "contractor_notes": closure.description,
            "failed_checks": failed_checks,
            "contractor_gps": f"{closure.actual_lat}, {closure.actual_lon}" if closure.actual_lat else "Missing",
            "spoofing_flags": closure.spoofing_flags_detected
        }

    # --- Deterministic Local Fallback Engine ---
    def _deterministic_reply(
        self,
        db: Session,
        message: str,
        incident_context_id: Optional[str] = None,
        is_gov_user: bool = False
    ) -> Dict[str, Any]:
        msg_lower = message.lower().strip()
        citations = []
        suggested_actions = []

        # Intent: Emergency resources
        if any(w in msg_lower for w in ["emergency", "ambulance", "police", "fire", "hospital", "helpline", "women safety", "disaster", "112", "100"]):
            resources = self.tool_lookup_emergency(db, msg_lower)
            reply = "### 🚨 Verified Official Emergency Hotlines\n\n"
            reply += "**Important Notice:** CivicHelp is a municipal civic issue management platform, **not an emergency dispatch agency**. For imminent danger or life-threatening emergencies, call official services directly:\n\n"
            for r in resources[:5]:
                reply += f"- **{r['name']}**: 📞 **`{r['phone']}`** ({r['category']}) — *{r['hours']}*\n"
            reply += "\n*All emergency contacts are verified with official government sources.*"
            citations.append({
                "title": "National Emergency Response System (ERSS)",
                "type": "emergency",
                "link_id": "112",
                "snippet": "Unified national 112 emergency hotline"
            })
            suggested_actions = ["Call 112", "View Emergency Services Tab", "Report non-emergency civic issue"]
            return {
                "reply": reply,
                "answer": reply,
                "provider": "deterministic_fallback",
                "provider_status": "LOCAL_DETERMINISTIC_FALLBACK",
                "citations": citations,
                "source_references": citations,
                "suggested_actions": suggested_actions,
                "requires_human_review": False
            }

        # Intent: Track specific Incident / Report
        found_id = None
        id_patterns = [
            r"\b(CIV-\d{4}-\d{4,6})\b",
            r"\b(TRK-[A-Za-z0-9]+)\b",
            r"\b(REP-[A-Za-z0-9]+)\b",
            r"\b(INC-\d+)\b"
        ]
        for pat in id_patterns:
            m = re.search(pat, message, re.IGNORECASE)
            if m:
                found_id = m.group(1).upper()
                break

        if not found_id and incident_context_id:
            found_id = incident_context_id

        track_keywords = ["status", "track", "what happened to my", "update on", "kya hua", "kaisa hai", "stithi", "progress", "kab hoga", "theek hua", "स्थिति", "चेक"]
        if found_id or any(w in msg_lower for w in track_keywords):
            if found_id:
                data = self.tool_lookup_incident(db, found_id, is_gov_user=is_gov_user)
                if data:
                    reply = (
                        f"### 📋 Incident Record: **{data['tracking_id']}**\n\n"
                        f"- **Title:** {data['title']}\n"
                        f"- **Current Status:** `{data['status']}`\n"
                        f"- **Priority:** `P{data['priority']}` | **Escalation Tier:** `{data['escalation_tier']}`\n"
                        f"- **Assigned Department:** `{data['department'] or 'Under Dispatch'}`\n"
                        f"- **Location:** {data['address']} (`{data['location_mode']}` mode)\n"
                        f"- **SLA Performance:** {data['sla_status']}\n"
                    )
                    if data['recent_activity']:
                        reply += "\n**Recent Operations Activity:**\n"
                        for act in data['recent_activity']:
                            reply += f"- {act}\n"

                    citations.append({
                        "title": f"Incident {data['tracking_id']}",
                        "type": "incident",
                        "link_id": data['id'],
                        "snippet": f"Status: {data['status']}, Department: {data['department']}"
                    })
                    suggested_actions = [f"View Incident {data['tracking_id']}", "Track another issue"]
                    return {
                        "reply": reply,
                        "answer": reply,
                        "provider": "deterministic_fallback",
                        "provider_status": "LOCAL_DETERMINISTIC_FALLBACK",
                        "citations": citations,
                        "source_references": citations,
                        "suggested_actions": suggested_actions,
                        "requires_human_review": False
                    }
                else:
                    reply = f"I searched the municipal database but could not find an incident matching ID `{found_id}`. Please verify your tracking ID or report reference.\n\n*नगर निगम डेटाबेस में इस आईडी से संबंधित कोई शिकायत नहीं मिली। कृपया अपनी ट्रैकिंग आईडी की जांच करें।*"
                    return {
                        "reply": reply,
                        "answer": reply,
                        "provider": "deterministic_fallback",
                        "provider_status": "LOCAL_DETERMINISTIC_FALLBACK",
                        "citations": [],
                        "source_references": [],
                        "suggested_actions": ["Track via public portal", "Report new issue"],
                        "requires_human_review": False
                    }
            else:
                reply = "To check the status of your report, please provide your **Tracking ID** (e.g., `CIV-2026-9841` or `REP-A1B2C3`).\n\n*अपनी शिकायत की स्थिति जांचने के लिए कृपया अपना ट्रैकिंग आईडी प्रदान करें (उदा. `CIV-2026-9841`)।*"
                return {
                    "reply": reply,
                    "answer": reply,
                    "provider": "deterministic_fallback",
                    "provider_status": "LOCAL_DETERMINISTIC_FALLBACK",
                    "citations": [],
                    "source_references": [],
                    "suggested_actions": ["Track a Report", "How to report an issue"],
                    "requires_human_review": False
                }

        # Intent: Operational Metrics
        if any(w in msg_lower for w in ["metric", "dashboard", "how many", "statistics", "performance", "open cases", "resolution rate"]):
            m = self.tool_operational_metrics(db)
            total = m.get('canonical_incidents', m.get('total_incidents', 0))
            active = m.get('open_cases', m.get('active_incidents', 0))
            resolved = m.get('resolved_cases', m.get('resolved_incidents', 0))
            overdue = m.get('overdue_cases', m.get('overdue_incidents', 0))
            rejection_rate = m.get('closure_rejection_rate_pct', 0.0)
            
            reply = (
                "### 📊 CivicHelp Live Operational Intelligence\n\n"
                f"- **Total Incidents:** {total:,}\n"
                f"- **Active Cases:** {active:,}\n"
                f"- **Resolved Cases:** {resolved:,}\n"
                f"- **Overdue / SLA Breached:** {overdue:,}\n"
                f"- **Autonomous Reopening / Rejection Rate:** {rejection_rate:.1f}%\n"
                f"- **SLA Compliance:** {m.get('sla_compliance_pct', 100.0):.1f}%\n\n"
                "*All metrics are computed in real time from database records.*"
            )
            citations.append({
                "title": "Municipal Operations Console Metrics",
                "type": "metric",
                "link_id": "dashboard",
                "snippet": f"Active: {active}, Overdue: {overdue}"
            })
            suggested_actions = ["Show city hotspots", "Check overdue cases"]
            return {
                "reply": reply,
                "answer": reply,
                "provider": "deterministic_fallback",
                "provider_status": "LOCAL_DETERMINISTIC_FALLBACK",
                "citations": citations,
                "source_references": citations,
                "suggested_actions": suggested_actions,
                "requires_human_review": False
            }

        # Default Helpful Overview
        reply = (
            "Hello! I am **CivicHelp AI**, your autonomous civic intelligence assistant.\n\n"
            "I can help you with:\n"
            "- **Tracking submitted reports** using your Tracking ID\n"
            "- **Reporting procedures & issue categories** (potholes, streetlights, drainage, etc.)\n"
            "- **Emergency services** and direct dispatch hotlines (112, 100, 101, 108)\n"
            "- **Public municipal metrics & city hotspots**\n\n"
            "How can I assist your civic inquiry today?"
        )
        suggested_actions = ["How do I report an issue?", "Emergency hotlines", "Check operational metrics", "Track a report"]
        return {
            "reply": reply,
            "answer": reply,
            "provider": "deterministic_fallback",
            "provider_status": "LOCAL_DETERMINISTIC_FALLBACK",
            "citations": citations,
            "source_references": citations,
            "suggested_actions": suggested_actions,
            "requires_human_review": False
        }

    # --- Live External LLM Handler (Official Google GenAI SDK) ---
    def process_chat(
        self,
        db: Session,
        message: str,
        conversation_history: List[Dict[str, str]],
        incident_context_id: Optional[str] = None,
        tracking_id: Optional[str] = None,
        current_user: Optional[User] = None
    ) -> Dict[str, Any]:
        is_gov_user = bool(current_user and current_user.role in {"ADMIN", "REVIEWER", "DEPARTMENT_OPERATOR", "FIELD_OFFICER"})
        
        # Check if user mentioned an incident or provided a tracking ID
        target_id = tracking_id or incident_context_id
        if not target_id:
            for pat in [r"\b(CIV-\d{4}-\d{4,6})\b", r"\b(TRK-[A-Za-z0-9]+)\b", r"\b(REP-[A-Za-z0-9]+)\b", r"\b(INC-\d+)\b"]:
                m = re.search(pat, message, re.IGNORECASE)
                if m:
                    target_id = m.group(1).upper()
                    break

        target_incident = None
        if target_id:
            target_incident = self.tool_lookup_incident(db, target_id, is_gov_user=is_gov_user)

        # Attempt Google GenAI Client
        self._init_client()
        if self.genai_client:
            try:
                metrics = self.tool_operational_metrics(db)
                hotspots = self.tool_query_hotspots(db)
                emergency_sample = self.tool_lookup_emergency(db, "")[:4]

                grounded_context = (
                    f"Operational Metrics: Total Reports={metrics.get('total_incidents')}, "
                    f"Active Cases={metrics.get('active_incidents')}, Overdue={metrics.get('overdue_incidents')}. "
                    f"Active Hotspots: {len(hotspots)}. "
                    f"Key Emergency Contacts: 112 (National Unified), 100 (Police), 108 (Ambulance), 101 (Fire). "
                    + (f"Referenced Incident: {json.dumps(target_incident)} " if target_incident else "")
                )

                system_prompt = (
                    "You are CivicHelp AI, the official assistant for the CivicHelp Smart Cities platform. "
                    "Follow these non-negotiable rules:\n"
                    "1. Ground all answers strictly in the provided Operational Context and verified facts.\n"
                    "2. If asked about an incident status, use the Referenced Incident facts. If no incident was found, explicitly ask for a valid Tracking ID.\n"
                    "3. For life-threatening emergencies, immediately state that CivicHelp is NOT an emergency dispatch agency and provide 112 / 100 / 108 directly.\n"
                    "4. NEVER reveal private citizen phone numbers, private internal contractor trust penalties, or confidential reviewer notes to unauthenticated citizens.\n"
                    "5. Never declare an incident resolved independently of the backend state machine.\n"
                    "6. Be concise, polite, professional, and format responses in clean Markdown.\n"
                    "7. MULTILINGUAL RESPONSES: Always detect the language used by the citizen and respond fluently in the EXACT SAME LANGUAGE (e.g. Hindi हिन्दी, Hinglish, Bengali বাংলা, Tamil தமிழ், Telugu తెలుగు, Marathi मराठी, Gujarati ગુજરાતી, Kannada ಕನ್ನಡ, Malayalam മലയാളം, Punjabi ਪੰਜਾਬੀ, Urdu, Spanish, French, or English). Never force an Indian or international citizen to read English if they asked in their mother tongue."
                )

                full_prompt = f"{system_prompt}\n\nContext:\n{grounded_context}\n\nUser Question:\n{message}"

                models_to_try = [self.gemini_model, "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash"]
                seen = set()
                candidate_models = [m for m in models_to_try if m and not (m in seen or seen.add(m))]
                response = None
                for model_name in candidate_models:
                    try:
                        response = self.genai_client.models.generate_content(
                            model=model_name,
                            contents=full_prompt,
                            config=types.GenerateContentConfig(
                                temperature=0.2,
                                max_output_tokens=settings.GEMINI_MAX_OUTPUT_TOKENS
                            )
                        )
                        if response and response.text:
                            break
                    except Exception as model_err:
                        logger.warning(f"Gemini model {model_name} call failed: {model_err}")

                reply_text = response.text if response and response.text else ""
                if reply_text:
                    citations = []
                    if target_incident:
                        citations.append({
                            "title": f"Incident {target_incident['tracking_id']}",
                            "type": "incident",
                            "link_id": target_incident['id'],
                            "snippet": f"Status: {target_incident['status']}"
                        })

                    return {
                        "reply": reply_text,
                        "answer": reply_text,
                        "provider": "gemini",
                        "provider_status": "GEMINI_LIVE",
                        "citations": citations,
                        "source_references": citations,
                        "suggested_actions": ["Track another issue", "View emergency contacts", "Operational metrics"],
                        "requires_human_review": False
                    }
            except Exception as e:
                logger.warning(f"Gemini API invocation encountered error: {e}. Falling back to deterministic RAG engine.")

        # Fallback to local deterministic intelligence engine
        return self._deterministic_reply(db, message, incident_context_id=target_id, is_gov_user=is_gov_user)

chatbot_service = ChatbotService()

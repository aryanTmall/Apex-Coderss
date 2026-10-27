import os
import re
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("civichelp.voice")

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

CATEGORY_KEYWORDS = {
    "POTHOLE": ["pothole", "gaddha", "gadde", "sadak", "road crack", "caved in", "broken road", "crater"],
    "STREETLIGHT": ["streetlight", "street light", "batti", "andhera", "dark", "pole", "light kharab", "bulb"],
    "WATER_LEAKAGE": ["water leak", "water pipe", "jal", "paani beh raha", "pipe burst", "drinking water", "supply line"],
    "GARBAGE": ["garbage", "kachra", "kuda", "waste", "dustbin", "trash", "overflow", "safai", "smell", "rotting"],
    "DRAINAGE": ["drain", "naali", "sewer", "manhole", "waterlogging", "gutter", "clogged drain", "drainage"],
    "TRAFFIC_OBSTRUCTION": ["traffic", "jam", "fallen tree", "ped gir gaya", "blocked road", "broken divider", "obstruction"],
    "PUBLIC_INFRASTRUCTURE": ["footpath", "sidewalk", "bench", "bus stop", "railing", "park", "pole leaning"]
}


class VoiceService:
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
                logger.warning(f"Could not initialize Google GenAI for voice: {e}")
                self.genai_client = None
        else:
            self.genai_client = None

    def detect_script_language(self, text: str) -> str:
        # Check for Devanagari Unicode
        if re.search(r"[\u0900-\u097F]", text):
            return "hi-IN"
        # Check for Hinglish markers
        hinglish_words = ["hai", "ho", "gaya", "paani", "sadak", "kachra", "batti", "bahut", "kharab", "karo"]
        lower = text.lower()
        if any(w in lower for w in hinglish_words):
            return "hi-Latn (Hinglish)"
        return "en-IN"

    def parse_transcript_deterministic(self, transcript: str) -> Dict[str, Any]:
        lower = transcript.lower()
        detected_lang = self.detect_script_language(transcript)

        # Detect category
        matched_category = "OTHER"
        for cat, kw_list in CATEGORY_KEYWORDS.items():
            if any(kw in lower for kw in kw_list):
                matched_category = cat
                break

        # Detect urgency
        urgency = "NORMAL"
        urgent_markers = ["urgent", "danger", "accident", "emergency", "turant", "khatarnak", "hazard", "severe", "critical"]
        if any(m in lower for m in urgent_markers):
            urgency = "HIGH"

        # Extract location hint if mentioned
        location_hint = ""
        loc_patterns = [
            r"(?:near|at|around|opposite|behind|outside)\s+([^,\.\n]+)",
            r"([^,\.\n]+)\s+(?:ke paas|ke samne|chowk|road|market|station)"
        ]
        for pattern in loc_patterns:
            m = re.search(pattern, transcript, re.IGNORECASE)
            if m:
                location_hint = m.group(1).strip()
                break

        # Generate a clean title
        words = transcript.split()
        title_words = words[:8]
        category_title = matched_category.replace("_", " ").title()
        title = f"{category_title} Issue: {' '.join(title_words)}..." if len(words) > 8 else f"{category_title}: {transcript}"

        return {
            "category": matched_category,
            "title": title[:100],
            "description": transcript,
            "location_hint": location_hint,
            "detected_language": detected_lang,
            "urgency": urgency,
            "extraction_method": "deterministic_nlp_fallback",
            "confidence_score": 0.88
        }

    def parse_speech_transcript(self, transcript: str, user_language: Optional[str] = None) -> Dict[str, Any]:
        cleaned_text = transcript.strip()
        if not cleaned_text:
            return {
                "category": "OTHER",
                "title": "Voice Report",
                "description": "",
                "location_hint": "",
                "detected_language": user_language or "en-IN",
                "urgency": "NORMAL",
                "extraction_method": "none",
                "confidence_score": 0.0
            }

        # Try Gemini LLM extraction if client exists
        self._init_client()
        if self.genai_client:
            try:
                system_instruction = (
                    "You are CivicHelp's multilingual voice intake engine for Indian municipal civic issues. "
                    "You receive citizen spoken transcripts in Hindi, English, Hinglish, or regional languages. "
                    "Extract structured civic report fields and return ONLY a valid JSON object with keys: "
                    "'category' (one of POTHOLE, STREETLIGHT, WATER_LEAKAGE, GARBAGE, DRAINAGE, TRAFFIC_OBSTRUCTION, PUBLIC_INFRASTRUCTURE, OTHER), "
                    "'title' (succinct formal title in English, 5-10 words), "
                    "'description' (clarified description of the complaint preserving citizen nuances), "
                    "'location_hint' (extracted landmark/street/area or empty string), "
                    "'detected_language' (e.g. Hindi, Hinglish, English), "
                    "'urgency' (NORMAL, HIGH, CRITICAL)."
                )

                prompt = f"Spoken Citizen Transcript: \"{cleaned_text}\"\nUser hint language: {user_language or 'auto'}"

                models_to_try = [self.gemini_model, "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash"]
                seen = set()
                candidate_models = [m for m in models_to_try if m and not (m in seen or seen.add(m))]
                response = None
                for model_name in candidate_models:
                    try:
                        response = self.genai_client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                system_instruction=system_instruction,
                                temperature=0.1,
                                response_mime_type="application/json"
                            )
                        )
                        if response and response.text:
                            break
                    except Exception as model_err:
                        logger.warning(f"Voice Gemini model {model_name} failed: {model_err}")

                if response and response.text:
                    parsed_json = json.loads(response.text)
                    parsed_json["extraction_method"] = "gemini_ai"
                    parsed_json["confidence_score"] = 0.96
                    return parsed_json
            except Exception as e:
                logger.warning(f"Gemini voice parse failed, falling back to deterministic: {e}")

        return self.parse_transcript_deterministic(cleaned_text)


voice_service = VoiceService()

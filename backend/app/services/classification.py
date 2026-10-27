import re
import json
import logging
from typing import Dict, Any, List, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

CATEGORY_MAP = {
    "pothole": "pothole",
    "road": "pothole",
    "road_damage": "pothole",
    "crater": "pothole",
    "asphalt": "pothole",
    "street_light": "streetlight",
    "streetlight": "streetlight",
    "lamp": "streetlight",
    "lighting": "streetlight",
    "dark": "streetlight",
    "garbage": "garbage",
    "trash": "garbage",
    "waste": "garbage",
    "dump": "garbage",
    "sanitation": "garbage",
    "water": "water_leak",
    "water_leak": "water_leak",
    "pipe": "water_leak",
    "burst": "water_leak",
    "leak": "water_leak",
    "drain": "drainage",
    "drainage": "drainage",
    "sewer": "drainage",
    "gutter": "drainage",
    "clog": "drainage",
    "sewage": "drainage"
}

KEYWORDS = {
    "pothole": ["pothole", "crater", "road", "asphalt", "tarmac", "pavement", "rebar", "puncture", "cavity", "trench"],
    "streetlight": ["streetlight", "street light", "lamp", "pole", "darkness", "bulb", "dark street", "lighting", "blackout"],
    "garbage": ["garbage", "trash", "waste", "dump", "bin", "refuse", "litter", "rubbish", "stench", "sanitation", "debris"],
    "water_leak": ["leak", "pipe", "burst", "water supply", "gushing", "main break", "drinking water", "valve", "spraying"],
    "drainage": ["drain", "drainage", "sewer", "manhole", "clogged", "overflowing drain", "stormwater", "gutter", "waterlogging"]
}

SEVERITY_KEYWORDS_P5 = ["life-threatening", "fatal", "rebar", "massive crater", "highway puncture", "live wire", "sparking", "submerged road", "main burst flooding"]
SEVERITY_KEYWORDS_P4 = ["hazard", "danger", "burst", "deep trench", "exposed", "flood", "puncture", "accident risk", "traffic blocked"]
SEVERITY_KEYWORDS_P3 = ["overflowing", "broken", "uncollected", "leaking", "large", "blocked", "stagnant"]

class ClassificationService:

    @classmethod
    def classify(cls, text: str, user_category: str = None) -> Dict[str, Any]:
        """
        Classifies incident description using structured LLM if configured,
        or deterministic fallback heuristics.
        """
        text_lower = text.lower()

        # Check if external LLM configured and try
        if settings.OPENAI_API_KEY:
            try:
                result = cls._classify_openai(text, user_category)
                if result:
                    return result
            except Exception as e:
                logger.warning(f"OpenAI classification failed, using fallback: {e}")

        # Deterministic Fallback Classification
        return cls._classify_fallback(text, user_category)

    @classmethod
    def _classify_fallback(cls, text: str, user_category: str = None) -> Dict[str, Any]:
        text_lower = text.lower()
        matched_category = None

        # 1. Respect valid user category if passed
        if user_category and user_category.lower() in CATEGORY_MAP:
            matched_category = CATEGORY_MAP[user_category.lower()]
        
        # 2. Keyword detection
        if not matched_category:
            scores = {}
            for cat, words in KEYWORDS.items():
                score = sum(1 for w in words if re.search(r'\b' + re.escape(w) + r'\b', text_lower))
                scores[cat] = score
            
            best_cat = max(scores, key=scores.get)
            if scores[best_cat] > 0:
                matched_category = best_cat
            else:
                matched_category = "other"

        # 3. Priority estimation
        priority = 3
        reasons = []

        if any(w in text_lower for w in SEVERITY_KEYWORDS_P5):
            priority = 5
            reasons.append("Critical public safety hazard: severe physical obstruction or emergency condition detected")
        elif any(w in text_lower for w in SEVERITY_KEYWORDS_P4):
            priority = 4
            reasons.append("Elevated risk: potential vehicle damage, pedestrian hazard, or active infrastructure disruption")
        elif any(w in text_lower for w in SEVERITY_KEYWORDS_P3):
            priority = 3
            reasons.append("Standard municipal service requirement with active impact on local area")
        else:
            priority = 2
            reasons.append("Low immediate risk: preventative or minor maintenance requirement")

        # Title generator
        first_sentence = text.strip().split('.')[0]
        if len(first_sentence) > 60:
            first_sentence = first_sentence[:57] + "..."
        title = f"{matched_category.replace('_', ' ').title()}: {first_sentence}"

        dept_map = {
            "pothole": "dept_roads",
            "streetlight": "dept_streetlights",
            "garbage": "dept_sanitation",
            "water_leak": "dept_water",
            "drainage": "dept_drainage",
            "other": "dept_sanitation"
        }

        return {
            "category": matched_category,
            "title": title,
            "priority": priority,
            "priority_reasons": reasons,
            "suggested_department_id": dept_map.get(matched_category, "dept_sanitation"),
            "confidence": 0.88 if matched_category != "other" else 0.50,
            "source": "FALLBACK",
            "summary": first_sentence
        }

    @classmethod
    def _classify_openai(cls, text: str, user_category: str = None) -> Dict[str, Any]:
        # Minimal clean OpenAI call if API key is injected
        import httpx
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        prompt = f"""
You are a civic triage AI. Analyze this report text: "{text}".
User specified category: "{user_category}".
Return ONLY a valid JSON object with:
category: one of ["pothole", "streetlight", "garbage", "water_leak", "drainage", "other"],
title: concise title under 60 chars,
priority: integer 1-5,
priority_reasons: array of string reasons,
suggested_department_id: one of ["dept_roads", "dept_streetlights", "dept_sanitation", "dept_water", "dept_drainage"],
confidence: float 0.0-1.0
"""
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = json.loads(data["choices"][0]["message"]["content"])
                content["source"] = "LLM"
                return content
        return None

classifier = ClassificationService()

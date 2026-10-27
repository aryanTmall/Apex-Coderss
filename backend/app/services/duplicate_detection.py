import math
import re
from collections import Counter
from datetime import timedelta
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.services.sim_clock import sim_clock

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as",
    "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could",
    "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had",
    "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how",
    "i", "if", "in", "into", "is", "it", "its", "itself", "me", "more", "most", "my", "myself", "no",
    "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves",
    "out", "over", "own", "same", "she", "should", "so", "some", "such", "than", "that", "the", "their",
    "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while",
    "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves", "near", "nearer"
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates Haversine distance in meters between two coordinates."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def tokenize(text: str) -> List[str]:
    words = re.findall(r'[a-zA-Z0-9]+', text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 1]

def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculates cosine similarity between two text strings using term frequencies."""
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    if not tokens1 or not tokens2:
        return 0.0

    vec1 = Counter(tokens1)
    vec2 = Counter(tokens2)
    common_words = set(vec1.keys()).intersection(set(vec2.keys()))

    dot_product = sum(vec1[w] * vec2[w] for w in common_words)
    mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
    mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

    if mag1 == 0 or mag2 == 0:
        return 0.0
    return min(1.0, dot_product / (mag1 * mag2))

class DuplicateDetectionService:

    @classmethod
    def calculate_geographic_score(
        cls,
        lat1: Optional[float],
        lon1: Optional[float],
        lat2: Optional[float],
        lon2: Optional[float]
    ) -> Tuple[float, Optional[float]]:
        """
        Calculates geographic proximity score:
        - 1.0 within 30 metres
        - Linear drop from 1.0 to 0.0 between 30 and 150 metres
        - 0.0 beyond 150 metres
        - 0.0 if missing coordinates
        Returns (geo_score, distance_meters)
        """
        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            return 0.0, None

        dist = haversine_distance(lat1, lon1, lat2, lon2)
        if dist <= 30.0:
            return 1.0, dist
        elif dist <= 150.0:
            # Linear reduction: at 30m -> 1.0, at 150m -> 0.0
            score = 1.0 - ((dist - 30.0) / 120.0)
            return max(0.0, min(1.0, score)), dist
        else:
            return 0.0, dist

    @classmethod
    def score_match(
        cls,
        report_text: str,
        report_category: str,
        report_lat: Optional[float],
        report_lon: Optional[float],
        incident: Incident
    ) -> Dict[str, Any]:
        """Calculates multi-factor match score against a candidate incident."""
        text_sim = calculate_text_similarity(report_text, incident.description)
        geo_score, distance_m = cls.calculate_geographic_score(
            report_lat, report_lon, incident.latitude, incident.longitude
        )
        cat_match = 1.0 if report_category.lower() == incident.category.lower() else 0.0

        # Weights: 0.50 * text + 0.35 * geo + 0.15 * cat
        total_score = (0.50 * text_sim) + (0.35 * geo_score) + (0.15 * cat_match)

        return {
            "total_score": round(total_score, 4),
            "text_similarity": round(text_sim, 4),
            "geographic_score": round(geo_score, 4),
            "category_match": round(cat_match, 4),
            "distance_meters": round(distance_m, 1) if distance_m is not None else None,
            "candidate_id": incident.id,
            "candidate_status": incident.status,
            "candidate_title": incident.title
        }

    @classmethod
    def find_duplicate(
        cls,
        db: Session,
        text: str,
        category: str,
        lat: Optional[float],
        lon: Optional[float]
    ) -> Dict[str, Any]:
        """
        Finds the best matching candidate incident from open incidents
        or resolved incidents within the previous 14 days.
        """
        now = sim_clock.now()
        fourteen_days_ago = now - timedelta(days=14)

        # Candidates: open OR resolved within 14 days
        candidates = db.query(Incident).filter(
            (Incident.status != "RESOLVED") |
            ((Incident.status == "RESOLVED") & (Incident.resolved_at >= fourteen_days_ago))
        ).all()

        if not candidates:
            return {
                "action": "ACTION_NEW",
                "best_match": None,
                "score": 0.0,
                "rationale": "No open or recent candidate incidents found."
            }

        scored = []
        for cand in candidates:
            breakdown = cls.score_match(text, category, lat, lon, cand)
            scored.append((breakdown["total_score"], cand, breakdown))

        scored.sort(key=lambda x: x[0], reverse=True)
        best_score, best_cand, best_breakdown = scored[0]

        if best_score >= 0.75:
            action = "ACTION_LINK"
            rationale = (
                f"High-confidence match ({best_score:.2f} >= 0.75): "
                f"Text similarity: {best_breakdown['text_similarity']:.2f}, "
                f"Geographic score: {best_breakdown['geographic_score']:.2f} "
                f"({best_breakdown['distance_meters']}m), Category match: {best_breakdown['category_match']}."
            )
        elif best_score >= 0.50:
            action = "ACTION_REVIEW"
            rationale = (
                f"Borderline match ({best_score:.2f} in [0.50, 0.75]): "
                f"Requires operational triage. Distance: {best_breakdown['distance_meters']}m, "
                f"Text sim: {best_breakdown['text_similarity']:.2f}."
            )
        else:
            action = "ACTION_NEW"
            rationale = (
                f"Distinct incident (score {best_score:.2f} < 0.50). "
                f"Insufficient proximity or similarity to existing cases."
            )

        return {
            "action": action,
            "best_match": best_cand,
            "score": best_score,
            "breakdown": best_breakdown,
            "rationale": rationale
        }

duplicate_detector = DuplicateDetectionService()

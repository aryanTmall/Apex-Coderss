import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.voice_service import voice_service

logger = logging.getLogger("civichelp.api.voice")

router = APIRouter(prefix="/voice", tags=["Multilingual AI Voice Assistant"])


class VoiceParseRequest(BaseModel):
    transcript: str = Field(..., min_length=2, description="Transcribed citizen speech text")
    language: Optional[str] = Field("auto", description="Spoken language hint (e.g. hi-IN, en-IN, auto)")


class VoiceParseResponse(BaseModel):
    category: str
    title: str
    description: str
    location_hint: str
    detected_language: str
    urgency: str
    extraction_method: str
    confidence_score: float


@router.post("/parse", response_model=VoiceParseResponse)
def parse_voice_transcript_endpoint(payload: VoiceParseRequest):
    """
    Parse citizen spoken voice transcript in Hindi, English, Hinglish, or regional languages.
    Extracts category, formal title, clarified description, landmark location, and urgency.
    """
    try:
        result = voice_service.parse_speech_transcript(
            transcript=payload.transcript,
            user_language=payload.language
        )
        return result
    except Exception as e:
        logger.error(f"Error parsing voice transcript: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing voice transcript entity extraction."
        )

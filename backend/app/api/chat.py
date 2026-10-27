from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse, ChatStatusResponse
from app.services.chat_service import chatbot_service
from app.api.deps import get_current_user_optional
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["AI Operations Assistant"])

@router.post("", response_model=ChatResponse)
def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Submits a message to the CivicHelp AI Operations Assistant.
    Seamlessly queries real incidents, operational metrics, closure evaluations,
    and emergency hotlines using official Google Gemini GenAI SDK with
    deterministic RAG fallback when offline or without external credentials.
    """
    history = [{"role": m.role, "content": m.content} for m in request.conversation_history]
    result = chatbot_service.process_chat(
        db=db,
        message=request.message,
        conversation_history=history,
        incident_context_id=request.incident_context_id,
        tracking_id=request.tracking_id,
        current_user=current_user
    )
    result["conversation_id"] = request.conversation_id or "conv-default"
    return ChatResponse(**result)

@router.get("/status", response_model=ChatStatusResponse)
def get_chat_status():
    """
    Returns AI service health, active provider (Gemini or Deterministic Fallback),
    and supported tool capabilities without exposing any secret keys.
    """
    status = chatbot_service.get_status()
    return ChatStatusResponse(**status)

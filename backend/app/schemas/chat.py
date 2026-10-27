from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1500)
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    incident_context_id: Optional[str] = None
    tracking_id: Optional[str] = None
    conversation_id: Optional[str] = None

class ChatCitation(BaseModel):
    title: str
    type: str  # 'incident', 'metric', 'hotspot', 'verification', 'emergency', 'help'
    link_id: Optional[str] = None
    snippet: str

class ChatResponse(BaseModel):
    reply: str
    answer: Optional[str] = None
    provider: str
    provider_status: str = "LOCAL_DETERMINISTIC_FALLBACK"
    citations: List[ChatCitation] = Field(default_factory=list)
    source_references: List[ChatCitation] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    conversation_id: Optional[str] = None
    requires_human_review: bool = False

    def __init__(self, **data):
        if "answer" not in data and "reply" in data:
            data["answer"] = data["reply"]
        if "reply" not in data and "answer" in data:
            data["reply"] = data["answer"]
        if "source_references" not in data and "citations" in data:
            data["source_references"] = data["citations"]
        if "citations" not in data and "source_references" in data:
            data["citations"] = data["source_references"]
        super().__init__(**data)

class ChatStatusResponse(BaseModel):
    status: str
    active_provider: str
    gemini_configured: bool
    gemini_model: str = "gemini-2.5-flash"
    openrouter_configured: bool
    fallback_available: bool
    supported_intents: List[str]

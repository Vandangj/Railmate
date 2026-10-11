import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from backend.app.schemas.route import RouteItinerary

class ExtractedEntities(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    travel_date: Optional[str] = None
    departure_time_preference: Optional[str] = None
    passenger_count: Optional[int] = 1
    max_transfers: Optional[int] = 2
    min_transfers: Optional[int] = 0
    preference: Optional[str] = "fastest"  # fastest, cheapest, fewest
    is_complete: bool = False
    missing_fields: List[str] = []

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1200)
    conversation_id: Optional[int] = None
    context: Optional[Dict[str, Any]] = None

class ChatMessageResponse(BaseModel):
    reply: str
    conversation_id: int
    extracted: ExtractedEntities
    suggested_routes: Optional[List[RouteItinerary]] = None
    agent: str = "Orchestrator"
    provider: str = "GEMINI"
    ai_enabled: bool = True
    notice: Optional[str] = None

class ConversationMessageItem(BaseModel):
    id: int
    role: str
    content: str
    metadata_json: Dict[str, Any] = {}
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    messages: List[ConversationMessageItem] = []

    class Config:
        from_attributes = True

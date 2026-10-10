from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.agents.orchestrator import Orchestrator
from backend.app.models.conversation import Conversation
from backend.app.models.user import User
from backend.app.schemas.chat import (
    ChatMessageRequest, ChatMessageResponse, ConversationResponse
)
from backend.app.utils.security import get_optional_current_user, get_current_user

router = APIRouter(prefix="/api/chat", tags=["Travel Assistant & Chat"])
orchestrator = Orchestrator()

@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    body: ChatMessageRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    response = await orchestrator.handle_message(
        user_message=body.message,
        conversation_id=body.conversation_id,
        user_id=user_id,
        db=db
    )
    return response

@router.get("/conversations", response_model=List[ConversationResponse])
def get_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).limit(20).all()
    return [ConversationResponse.model_validate(c) for c in convs]

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation_detail(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return ConversationResponse.model_validate(conv)

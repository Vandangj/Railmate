from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.audit import SupportTicket
from backend.app.utils.security import get_optional_current_user, get_current_user

router = APIRouter(prefix="/api/support", tags=["Support & Help Desk"])

class SupportTicketCreate(BaseModel):
    booking_ref: Optional[str] = None
    subject: str
    description: str

class SupportTicketResponse(BaseModel):
    id: int
    booking_ref: Optional[str] = None
    subject: str
    description: str
    status: str

    class Config:
        from_attributes = True

@router.post("/tickets", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
def create_support_ticket(
    body: SupportTicketCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    ticket = SupportTicket(
        user_id=current_user.id if current_user else None,
        booking_ref=body.booking_ref,
        subject=body.subject,
        description=body.description,
        status="OPEN"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/tickets", response_model=List[SupportTicketResponse])
def get_user_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tickets = db.query(SupportTicket).filter(SupportTicket.user_id == current_user.id).order_by(SupportTicket.created_at.desc()).all()
    return tickets

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.agents.notification_agent import NotificationAgent
from backend.app.models.user import User
from backend.app.schemas.notification import NotificationResponse
from backend.app.utils.security import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
notification_agent = NotificationAgent()

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = notification_agent.get_user_notifications(user_id=current_user.id, db=db)
    return [NotificationResponse.model_validate(n) for n in notifs]

@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = notification_agent.mark_as_read(
        notification_id=notification_id,
        user_id=current_user.id,
        db=db
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"status": "success", "id": notification_id, "is_read": True}

@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = notification_agent.mark_all_as_read(user_id=current_user.id, db=db)
    return {"status": "success", "updated_count": count}

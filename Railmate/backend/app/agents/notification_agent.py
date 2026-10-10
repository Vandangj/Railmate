import time
import datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.models.notification import Notification
from backend.app.models.audit import AgentExecutionLog
from backend.app.config import settings

class NotificationAgent:
    """Agent responsible for creating in-app notifications and managing user delivery alerts."""
    name = "Notification Agent"

    def create_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        kind: str = "info",
        link: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Optional[Notification]:
        start_time = time.time()
        notification = None

        if db:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                kind=kind,
                is_read=False,
                link=link
            )
            db.add(notification)
            db.commit()
            db.refresh(notification)

            elapsed_ms = int((time.time() - start_time) * 1000)
            agent_log = AgentExecutionLog(
                agent_name=self.name,
                action="create_notification",
                status="success",
                execution_time_ms=elapsed_ms,
                detail={"user_id": user_id, "title": title, "kind": kind}
            )
            db.add(agent_log)
            db.commit()

        # If external email service was configured, deliver mock or live email
        if settings.EMAIL_PROVIDER_API_KEY:
            # Here real SMTP or SendGrid/Postmark call would occur
            pass

        return notification

    def get_user_notifications(self, user_id: int, db: Session, limit: int = 50) -> List[Notification]:
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).limit(limit).all()

    def mark_as_read(self, notification_id: int, user_id: int, db: Session) -> bool:
        notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
        if notif:
            notif.is_read = True
            db.commit()
            return True
        return False

    def mark_all_as_read(self, user_id: int, db: Session) -> int:
        count = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update({"is_read": True})
        db.commit()
        return count

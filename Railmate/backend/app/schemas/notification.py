import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    kind: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class NotificationPreferencesUpdate(BaseModel):
    email_alerts: bool = True
    journey_reminders: bool = True
    promotional_updates: bool = False

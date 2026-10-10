import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_ref = Column(String(100), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    origin = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    travel_date = Column(Date, nullable=False)
    train_name = Column(String(255), nullable=False)
    train_number = Column(String(100), nullable=False)
    departure_time = Column(String(10), nullable=False)
    arrival_time = Column(String(10), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    transfers = Column(Integer, default=0, nullable=False)
    fare_inr = Column(Float, nullable=False)
    status = Column(String(50), default="CONFIRMED", nullable=False)  # PENDING_CONFIRMATION, CONFIRMED, CANCELLED
    provider_mode = Column(String(50), default="DEMO", nullable=False)  # DEMO or LIVE
    passengers = Column(JSON, default=list, nullable=False)  # [{"name": "...", "age": 28, "gender": "M", "berth": "LOWER"}]
    status_history = Column(JSON, default=list, nullable=False)  # [{"status": "...", "timestamp": "...", "note": "..."}]
    idempotency_key = Column(String(255), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="bookings")

    __table_args__ = (
        Index("idx_user_travel_date", "user_id", "travel_date"),
    )

import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    train_number = Column(String(50), unique=True, index=True, nullable=False)
    train_name = Column(String(255), nullable=False)
    train_type = Column(String(50), default="Express", nullable=False)  # Express, Superfast, Vande Bharat, Rajdhani
    provider_mode = Column(String(50), default="DEMO", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    schedules = relationship("TrainSchedule", back_populates="train", cascade="all, delete-orphan")

class TrainSchedule(Base):
    __tablename__ = "train_schedules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    train_id = Column(Integer, ForeignKey("trains.id", ondelete="CASCADE"), nullable=False)
    from_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    to_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    departure_time = Column(String(10), nullable=False)  # "HH:MM"
    arrival_time = Column(String(10), nullable=False)    # "HH:MM"
    duration_minutes = Column(Integer, nullable=False)
    days = Column(String(50), default="Daily", nullable=False)
    fare_inr = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    train = relationship("Train", back_populates="schedules")
    from_station = relationship("Station", foreign_keys=[from_station_id], back_populates="departing_schedules")
    to_station = relationship("Station", foreign_keys=[to_station_id], back_populates="arriving_schedules")

    __table_args__ = (
        Index("idx_schedule_stations", "from_station_id", "to_station_id"),
    )

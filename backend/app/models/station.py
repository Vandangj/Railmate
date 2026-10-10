import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    city = Column(String(100), index=True, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    departing_schedules = relationship("TrainSchedule", foreign_keys="TrainSchedule.from_station_id", back_populates="from_station")
    arriving_schedules = relationship("TrainSchedule", foreign_keys="TrainSchedule.to_station_id", back_populates="to_station")

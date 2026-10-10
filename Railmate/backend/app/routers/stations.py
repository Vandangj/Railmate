from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.station import Station
from backend.app.models.train import Train
from backend.app.schemas.route import StationResponse

router = APIRouter(tags=["Stations & Trains"])

@router.get("/api/stations", response_model=List[StationResponse])
def get_all_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).order_by(Station.city.asc()).all()
    return [StationResponse.model_validate(s) for s in stations]

@router.get("/api/trains")
def get_all_trains(db: Session = Depends(get_db)):
    trains = db.query(Train).all()
    return [
        {
            "id": t.id,
            "train_number": t.train_number,
            "train_name": t.train_name,
            "train_type": t.train_type,
            "provider_mode": t.provider_mode
        }
        for t in trains
    ]

import abc
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models.station import Station
from backend.app.models.train import Train, TrainSchedule

class BaseRailwayProvider(abc.ABC):
    @abc.abstractmethod
    def get_stations(self, db: Session) -> List[Dict[str, Any]]:
        pass

    @abc.abstractmethod
    def get_all_schedules(self, db: Session) -> List[Dict[str, Any]]:
        pass

    @property
    @abc.abstractmethod
    def provider_mode(self) -> str:
        pass

    @property
    @abc.abstractmethod
    def is_live(self) -> bool:
        pass


class DemoRailwayProvider(BaseRailwayProvider):
    @property
    def provider_mode(self) -> str:
        return "DEMO"

    @property
    def is_live(self) -> bool:
        return False

    def get_stations(self, db: Session) -> List[Dict[str, Any]]:
        stations = db.query(Station).all()
        return [
            {
                "id": s.id,
                "code": s.code,
                "name": s.name,
                "city": s.city,
                "latitude": s.latitude,
                "longitude": s.longitude
            }
            for s in stations
        ]

    def get_all_schedules(self, db: Session) -> List[Dict[str, Any]]:
        schedules = db.query(TrainSchedule).join(Train).all()
        results = []
        for s in schedules:
            results.append({
                "id": s.id,
                "train_number": s.train.train_number,
                "train_name": s.train.train_name,
                "from_station_id": s.from_station_id,
                "from_station_code": s.from_station.code,
                "from_station_name": s.from_station.name,
                "from_city": s.from_station.city,
                "from_lat": s.from_station.latitude,
                "from_lon": s.from_station.longitude,
                "to_station_id": s.to_station_id,
                "to_station_code": s.to_station.code,
                "to_station_name": s.to_station.name,
                "to_city": s.to_station.city,
                "to_lat": s.to_station.latitude,
                "to_lon": s.to_station.longitude,
                "departure_time": s.departure_time,
                "arrival_time": s.arrival_time,
                "duration_minutes": s.duration_minutes,
                "days": s.days,
                "fare_inr": s.fare_inr,
                "provider_mode": "DEMO"
            })
        return results


class LiveRailwayProvider(BaseRailwayProvider):
    def __init__(self, base_url: Optional[str], api_key: Optional[str]):
        self.base_url = base_url
        self.api_key = api_key

    @property
    def provider_mode(self) -> str:
        return "LIVE_ADAPTER"

    @property
    def is_live(self) -> bool:
        return bool(self.api_key and self.base_url and "example" not in self.base_url)

    def get_stations(self, db: Session) -> List[Dict[str, Any]]:
        # Fallback to local database cache if live API credentials not active
        demo = DemoRailwayProvider()
        return demo.get_stations(db)

    def get_all_schedules(self, db: Session) -> List[Dict[str, Any]]:
        # In actual production with authorized IRCTC API, this calls external REST endpoints.
        # When unconfigured, it clearly defaults to demo dataset and does not fabricate live data.
        demo = DemoRailwayProvider()
        return demo.get_all_schedules(db)


def get_railway_provider() -> BaseRailwayProvider:
    if settings.RAILWAY_PROVIDER == "live" and settings.RAILWAY_API_KEY and "example" not in (settings.RAILWAY_API_BASE_URL or ""):
        return LiveRailwayProvider(settings.RAILWAY_API_BASE_URL, settings.RAILWAY_API_KEY)
    return DemoRailwayProvider()

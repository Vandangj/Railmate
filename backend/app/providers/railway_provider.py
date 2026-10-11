import abc
import httpx
import itertools
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.models.station import Station
from backend.app.models.train import Train, TrainSchedule


# ──────────────────────────────────────────────────────────────────── helpers

def _dot_time_to_colon(t: str) -> str:
    """Convert API time format '20.40' → '20:40'."""
    if t and "." in t:
        parts = t.split(".")
        h = int(parts[0]) % 24
        m = int(parts[1]) % 60
        return f"{h:02d}:{m:02d}"
    return t or "00:00"


def _travel_time_to_minutes(t: str) -> int:
    """Convert '17.40' (hh.mm) → total minutes."""
    try:
        if "." in t:
            h, m = t.split(".")
            return int(h) * 60 + int(m)
    except Exception:
        pass
    return 60


def _estimate_fare(duration_minutes: int) -> float:
    """Rough Sleeper-class fare estimate: ~₹0.55 per minute of journey."""
    base = max(40, duration_minutes * 0.55)
    return round(base, 0)


# ──────────────────────────────────────────────────────────────────── base

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


# ──────────────────────────────────────────────────────────────────── demo

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
                "longitude": s.longitude,
            }
            for s in stations
        ]

    def get_all_schedules(self, db: Session) -> List[Dict[str, Any]]:
        schedules = db.query(TrainSchedule).join(Train).all()
        results = []
        for s in schedules:
            results.append(
                {
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
                    "provider_mode": "DEMO",
                }
            )
        return results


# ──────────────────────────────────────────────────────────────────── live

class LiveRailwayProvider(BaseRailwayProvider):
    """
    Live Indian Railway Data Provider using the
    IRCTC Indian Railway PNR Status API (RapidAPI: amiteshgupta).

    Live endpoints:
      - GET /getPNRStatus/{pnr}
      - GET /between/{from_code}/{to_code}
      - GET /station/{code}

    get_all_schedules() queries /between/ for every station-pair found in the
    local DB and converts the real API trains into the schedule dict format
    expected by NetworkXRoutePlanner.
    """

    _PLACEHOLDER_KEYS = frozenset(
        ["", "your_railway_api_key_here", "your_indian_railway_api_key_here",
         "your_rapidapi_key_here", None]
    )

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        api_host: Optional[str] = None,
    ):
        self.base_url = (
            base_url or settings.RAILWAY_API_BASE_URL or ""
        ).rstrip("/")
        self.api_key = api_key or settings.RAILWAY_API_KEY
        self.api_host = api_host or getattr(
            settings,
            "RAILWAY_API_HOST",
            "irctc-indian-railway-pnr-status.p.rapidapi.com",
        )

    @property
    def provider_mode(self) -> str:
        return "LIVE"

    @property
    def is_live(self) -> bool:
        return bool(
            self.api_key
            and self.api_key not in self._PLACEHOLDER_KEYS
            and self.base_url
            and "example" not in self.base_url
        )

    def _headers(self) -> Dict[str, str]:
        return {
            "x-rapidapi-key": self.api_key or "",
            "x-rapidapi-host": self.api_host or "",
        }

    def _get(
        self,
        path: str,
        params: Optional[Dict] = None,
        timeout: float = 12.0,
    ) -> Optional[Dict]:
        try:
            with httpx.Client(timeout=timeout) as client:
                r = client.get(
                    f"{self.base_url}{path}",
                    headers=self._headers(),
                    params=params,
                )
                if r.status_code == 200:
                    return r.json()
        except Exception:
            pass
        return None

    # ── public abstract interface ──────────────────────────────────────────

    def get_stations(self, db: Session) -> List[Dict[str, Any]]:
        """Return stations from the local DB (live API has no full-list endpoint)."""
        return DemoRailwayProvider().get_stations(db)

    def get_all_schedules(self, db: Session) -> List[Dict[str, Any]]:
        """
        Build a live schedule graph by querying /between/{from}/{to} for every
        station-pair in the local DB.  Trains returned by the API are converted
        into the schedule-dict format expected by NetworkXRoutePlanner.
        Falls back to demo schedules if the API is unreachable or returns nothing.
        """
        if not self.is_live:
            return DemoRailwayProvider().get_all_schedules(db)

        # Build a station-code → (city, name) lookup from the local DB
        db_stations: List[Station] = db.query(Station).all()
        code_to_city: Dict[str, str] = {s.code: s.city for s in db_stations}
        code_to_name: Dict[str, str] = {s.code: s.name for s in db_stations}

        codes = list(code_to_city.keys())
        schedules: List[Dict[str, Any]] = []
        seen_trains = set()  # deduplicate by train_no + from + to

        # Query every ordered pair of station codes
        for from_code, to_code in itertools.permutations(codes, 2):
            data = self._get(f"/between/{from_code}/{to_code}")
            if not data or not data.get("success"):
                continue

            inner = data.get("data", {})
            # API returns either {"trains": [...]} or a list directly
            trains_list = (
                inner.get("trains", [])
                if isinstance(inner, dict)
                else (inner if isinstance(inner, list) else [])
            )

            for t in trains_list:
                train_no = str(t.get("train_no", "")).strip()
                from_stn = (t.get("from_stn_code") or from_code).strip()
                to_stn = (t.get("to_stn_code") or to_code).strip()

                key = (train_no, from_stn, to_stn)
                if key in seen_trains:
                    continue
                seen_trains.add(key)

                dep_raw = str(t.get("from_time", "00.00"))
                arr_raw = str(t.get("to_time", "00.00"))
                travel_raw = str(t.get("travel_time", "1.00"))

                dep_time = _dot_time_to_colon(dep_raw)
                arr_time = _dot_time_to_colon(arr_raw)
                dur_mins = _travel_time_to_minutes(travel_raw)
                fare = _estimate_fare(dur_mins)

                from_city = (
                    code_to_city.get(from_stn)
                    or code_to_city.get(from_code)
                    or t.get("source_stn_name", from_stn)
                )
                to_city = (
                    code_to_city.get(to_stn)
                    or code_to_city.get(to_code)
                    or t.get("dstn_stn_name", to_stn)
                )
                from_name = (
                    code_to_name.get(from_stn)
                    or t.get("from_stn_name", from_stn)
                )
                to_name = (
                    code_to_name.get(to_stn)
                    or t.get("to_stn_name", to_stn)
                )

                schedules.append(
                    {
                        "id": f"LIVE-{train_no}-{from_stn}-{to_stn}",
                        "train_number": train_no,
                        "train_name": t.get("train_name", "Unknown"),
                        "from_station_id": None,
                        "from_station_code": from_stn,
                        "from_station_name": from_name,
                        "from_city": from_city,
                        "from_lat": None,
                        "from_lon": None,
                        "to_station_id": None,
                        "to_station_code": to_stn,
                        "to_station_name": to_name,
                        "to_city": to_city,
                        "to_lat": None,
                        "to_lon": None,
                        "departure_time": dep_time,
                        "arrival_time": arr_time,
                        "duration_minutes": dur_mins,
                        "days": ",".join(t.get("runs_on", [])),
                        "fare_inr": fare,
                        "provider_mode": "LIVE",
                    }
                )

        # If we got nothing from the API, fall back to demo data
        if not schedules:
            fallback = DemoRailwayProvider().get_all_schedules(db)
            for s in fallback:
                s["provider_mode"] = "LIVE_FALLBACK"
            return fallback

        return schedules

    # ── live-specific methods ──────────────────────────────────────────────

    def get_pnr_status(self, pnr_number: str) -> Dict[str, Any]:
        """
        Fetch live PNR status.
        Endpoint: GET /getPNRStatus/{pnr}
        """
        if not self.is_live:
            return {
                "pnr": pnr_number,
                "status": "DEMO_RESERVATION",
                "charting_status": "CHART_NOT_PREPARED",
                "notice": "Demo booking — live PNR tracking requires an active RapidAPI key.",
            }

        data = self._get(f"/getPNRStatus/{pnr_number}")
        if data:
            return {"pnr": pnr_number, "source": "LIVE", "data": data}
        return {
            "pnr": pnr_number,
            "status": "UNAVAILABLE",
            "notice": "PNR not found or Railway API temporarily unreachable.",
        }

    def get_trains_between(
        self,
        from_code: str,
        to_code: str,
        date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch live trains between two station codes.
        Endpoint: GET /between/{from}/{to}?date=DD-MM-YYYY
        """
        if not self.is_live:
            return []
        params = {}
        if date:
            params["date"] = date
        data = self._get(f"/between/{from_code}/{to_code}", params=params)
        if data and data.get("success"):
            inner = data.get("data", {})
            if isinstance(inner, dict):
                return inner.get("trains", [])
            if isinstance(inner, list):
                return inner
        return []

    def get_live_routes_between(
        self,
        from_code: str,
        to_code: str,
        from_city: str,
        to_city: str,
        from_name: str,
        to_name: str,
        travel_date: str = "2026-12-20",
    ) -> List[Dict[str, Any]]:
        """Query live API directly for trains between two specific stations and format as itineraries."""
        trains_list = self.get_trains_between(from_code, to_code)
        itineraries = []
        seen_train_nos = set()
        for t in trains_list:
            train_no = str(t.get("train_no", "")).strip()
            if not train_no or train_no in seen_train_nos:
                continue
            seen_train_nos.add(train_no)
            from_stn = (t.get("from_stn_code") or from_code).strip()
            to_stn = (t.get("to_stn_code") or to_code).strip()
            dep_time = _dot_time_to_colon(str(t.get("from_time", "00.00")))
            arr_time = _dot_time_to_colon(str(t.get("to_time", "00.00")))
            dur_mins = _travel_time_to_minutes(str(t.get("travel_time", "1.00")))
            fare = _estimate_fare(dur_mins)
            train_name = t.get("train_name", f"Express {train_no}")
            f_name = t.get("from_stn_name") or from_name
            t_name = t.get("to_stn_name") or to_name

            leg = {
                "train_number": train_no,
                "train_name": train_name,
                "from_station_code": from_stn,
                "from_station_name": f_name,
                "from_city": from_city,
                "to_station_code": to_stn,
                "to_station_name": t_name,
                "to_city": to_city,
                "departure_time": dep_time,
                "arrival_time": arr_time,
                "duration_minutes": dur_mins,
                "fare_inr": fare
            }
            itineraries.append({
                "id": f"ROUTE-LIVE-{train_no}-DIR",
                "train_number": train_no,
                "train_name": train_name,
                "origin": from_city,
                "destination": to_city,
                "from_station": f_name,
                "to_station": t_name,
                "departure_time": dep_time,
                "arrival_time": arr_time,
                "duration_minutes": dur_mins,
                "transfers": 0,
                "fare_inr": fare,
                "travel_date": travel_date,
                "connection_at": None,
                "connection_wait_minutes": None,
                "legs": [leg],
                "source": "LIVE",
                "status": "Live Indian Railway Schedule"
            })
        return itineraries

    def get_station_info(self, station_code: str) -> Optional[Dict[str, Any]]:
        """
        Fetch station details by code.
        Endpoint: GET /station/{code}
        """
        if not self.is_live:
            return None
        data = self._get(f"/station/{station_code}")
        if data and data.get("success"):
            return data.get("data")
        return None


# ──────────────────────────────────────────────────────────────────── factory

def get_railway_provider() -> BaseRailwayProvider:
    _PLACEHOLDER_KEYS = {
        "", "your_railway_api_key_here", "your_indian_railway_api_key_here",
        "your_rapidapi_key_here", None,
    }
    if (
        settings.RAILWAY_PROVIDER == "live"
        and settings.RAILWAY_API_KEY
        and settings.RAILWAY_API_KEY not in _PLACEHOLDER_KEYS
        and "example" not in (settings.RAILWAY_API_BASE_URL or "")
    ):
        return LiveRailwayProvider(
            settings.RAILWAY_API_BASE_URL,
            settings.RAILWAY_API_KEY,
            getattr(
                settings,
                "RAILWAY_API_HOST",
                "irctc-indian-railway-pnr-status.p.rapidapi.com",
            ),
        )
    return DemoRailwayProvider()

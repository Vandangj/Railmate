from pydantic import BaseModel, Field
from typing import List, Optional

class StationResponse(BaseModel):
    id: int
    code: str
    name: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

class RouteSearchRequest(BaseModel):
    origin: str = Field(..., description="Origin city or station code")
    destination: str = Field(..., description="Destination city or station code")
    travel_date: str = Field(..., description="Date of travel (YYYY-MM-DD)")
    preference: Optional[str] = Field("fastest", description="Ranking preference: fastest, cheapest, fewest")
    max_transfers: Optional[int] = Field(2, ge=0, le=3, description="Maximum transfers allowed (0 to 3)")
    min_transfers: Optional[int] = Field(0, ge=0, le=3, description="Minimum transfers required (e.g. 1 for connecting trains)")
    passenger_count: Optional[int] = Field(1, ge=1, le=6)

class RouteLeg(BaseModel):
    train_number: str
    train_name: str
    from_station_code: str
    from_station_name: str
    from_city: str
    to_station_code: str
    to_station_name: str
    to_city: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    fare_inr: float

class RouteItinerary(BaseModel):
    id: str
    train_number: str
    train_name: str
    origin: str
    destination: str
    from_station: str
    to_station: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    transfers: int
    fare_inr: float
    travel_date: str
    connection_at: Optional[str] = None
    connection_wait_minutes: Optional[int] = None
    legs: List[RouteLeg] = []
    source: str = "CURATED_DEMO_DATA"
    status: str = "Illustrative schedule — not live availability"

class RouteSearchResponse(BaseModel):
    routes: List[RouteItinerary]
    count: int
    source: str
    live_data: bool
    message: str

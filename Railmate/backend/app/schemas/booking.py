import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class PassengerSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., pattern="^(Male|Female|Other|M|F|O)$")
    berth_preference: Optional[str] = Field("No Preference", description="Lower, Middle, Upper, Side Lower, Side Upper, Window")

class BookingPreviewRequest(BaseModel):
    route_id: str
    origin: str
    destination: str
    travel_date: str
    train_number: str
    train_name: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    transfers: int = 0
    base_fare_inr: float
    passengers: List[PassengerSchema]

class BookingPreviewResponse(BaseModel):
    origin: str
    destination: str
    travel_date: str
    train_number: str
    train_name: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    transfers: int
    passenger_count: int
    base_fare_per_passenger: float
    gst_inr: float
    service_charge_inr: float
    total_fare_inr: float
    provider_mode: str = "DEMO"
    passengers: List[PassengerSchema]
    notice: str = "This is a demo booking preview. No actual ticket or PNR will be issued by IRCTC."

class BookingCreateRequest(BaseModel):
    route_id: str
    origin: str
    destination: str
    travel_date: str
    train_number: str
    train_name: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    transfers: int = 0
    total_fare_inr: float
    passengers: List[PassengerSchema]
    idempotency_key: Optional[str] = None
    confirmed: bool = Field(..., description="Explicit user confirmation required")

class BookingResponse(BaseModel):
    id: int
    booking_ref: str
    origin: str
    destination: str
    travel_date: str
    train_name: str
    train_number: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    transfers: int
    fare_inr: float
    status: str
    provider_mode: str
    passengers: List[Dict[str, Any]]
    status_history: List[Dict[str, Any]]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class BookingCancelRequest(BaseModel):
    reason: Optional[str] = "Customer requested cancellation"
    confirmed: bool = Field(..., description="Explicit cancellation confirmation")

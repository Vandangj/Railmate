import time
import uuid
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.booking import Booking
from backend.app.models.audit import AgentExecutionLog, AuditLog
from backend.app.schemas.booking import PassengerSchema, BookingCreateRequest, BookingPreviewResponse
from backend.app.providers.railway_provider import get_railway_provider

class BookingAgent:
    """Agent responsible for passenger validation, fare calculation preview, and confirmed bookings."""
    name = "Booking Agent"

    def __init__(self):
        self.railway_provider = get_railway_provider()

    def generate_preview(
        self,
        base_fare_inr: float,
        passengers: List[PassengerSchema],
        route_data: Dict[str, Any]
    ) -> BookingPreviewResponse:
        pax_count = len(passengers)
        total_base = base_fare_inr * pax_count
        gst = round(total_base * 0.05, 2)  # 5% standard railway GST
        service_charge = 25.0 * pax_count  # Service convenience charge
        total_fare = total_base + gst + service_charge

        return BookingPreviewResponse(
            origin=route_data["origin"],
            destination=route_data["destination"],
            travel_date=route_data["travel_date"],
            train_number=route_data["train_number"],
            train_name=route_data["train_name"],
            departure_time=route_data["departure_time"],
            arrival_time=route_data["arrival_time"],
            duration_minutes=route_data["duration_minutes"],
            transfers=route_data.get("transfers", 0),
            passenger_count=pax_count,
            base_fare_per_passenger=base_fare_inr,
            gst_inr=gst,
            service_charge_inr=service_charge,
            total_fare_inr=round(total_fare, 2),
            provider_mode=self.railway_provider.provider_mode,
            passengers=passengers,
            notice="DEMO MODE: This preview is illustrative. No genuine PNR or financial charge occurs."
        )

    def create_booking(
        self,
        user_id: int,
        booking_data: BookingCreateRequest,
        db: Session
    ) -> Booking:
        start_time = time.time()

        if not booking_data.confirmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Explicit user confirmation is required to proceed with booking."
            )

        if not booking_data.passengers or len(booking_data.passengers) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one passenger is required."
            )

        # Idempotency check
        if booking_data.idempotency_key:
            existing = db.query(Booking).filter(
                Booking.user_id == user_id,
                Booking.idempotency_key == booking_data.idempotency_key
            ).first()
            if existing:
                return existing

        # Generate separate, distinct Demo reference
        ref_suffix = uuid.uuid4().hex[:8].upper()
        booking_ref = f"DEMO-RM-{ref_suffix}"

        now_str = datetime.datetime.utcnow().isoformat()
        initial_history = [
            {
                "status": "CONFIRMED",
                "timestamp": now_str,
                "note": "Demo reservation confirmed in RailMate system (Illustrative demo data, not IRCTC)."
            }
        ]

        passenger_dicts = [p.model_dump() for p in booking_data.passengers]

        try:
            travel_dt = datetime.datetime.strptime(booking_data.travel_date, "%Y-%m-%d").date()
        except Exception:
            travel_dt = datetime.date.today()

        new_booking = Booking(
            booking_ref=booking_ref,
            user_id=user_id,
            origin=booking_data.origin,
            destination=booking_data.destination,
            travel_date=travel_dt,
            train_name=booking_data.train_name,
            train_number=booking_data.train_number,
            departure_time=booking_data.departure_time,
            arrival_time=booking_data.arrival_time,
            duration_minutes=booking_data.duration_minutes,
            transfers=booking_data.transfers,
            fare_inr=booking_data.total_fare_inr,
            status="CONFIRMED",
            provider_mode=self.railway_provider.provider_mode,
            passengers=passenger_dicts,
            status_history=initial_history,
            idempotency_key=booking_data.idempotency_key
        )

        db.add(new_booking)
        db.flush()

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Audit log
        audit = AuditLog(
            user_id=user_id,
            action="CREATE_BOOKING",
            entity_type="booking",
            entity_id=booking_ref,
            detail={"total_fare": booking_data.total_fare_inr, "passengers": len(passenger_dicts)}
        )
        db.add(audit)

        # Agent log
        agent_log = AgentExecutionLog(
            agent_name=self.name,
            action="create_booking",
            status="success",
            execution_time_ms=elapsed_ms,
            detail={"booking_ref": booking_ref, "user_id": user_id}
        )
        db.add(agent_log)
        db.commit()
        db.refresh(new_booking)

        return new_booking

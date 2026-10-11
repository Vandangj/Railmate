from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.agents.booking_agent import BookingAgent
from backend.app.agents.reservation_agent import ReservationAgent
from backend.app.agents.notification_agent import NotificationAgent
from backend.app.models.user import User
from backend.app.providers.railway_provider import get_railway_provider
from backend.app.schemas.booking import (
    BookingPreviewRequest, BookingPreviewResponse,
    BookingCreateRequest, BookingResponse, BookingCancelRequest
)
from backend.app.utils.security import get_current_user

router = APIRouter(prefix="/api/bookings", tags=["Bookings & Trip Management"])
booking_agent = BookingAgent()
reservation_agent = ReservationAgent()
notification_agent = NotificationAgent()
railway_provider = get_railway_provider()


@router.get("/pnr/{pnr_number}")
def get_pnr_status(
    pnr_number: str,
    current_user: User = Depends(get_current_user),
):
    """
    Fetch live PNR status from Indian Railway API (RapidAPI: irctc-indian-railway-pnr-status).
    Returns booking status, passenger chart, and train info.
    """
    result = railway_provider.get_pnr_status(pnr_number)
    return result


@router.get("/live-trains/{from_code}/{to_code}")
def get_live_trains(
    from_code: str,
    to_code: str,
    date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Fetch live trains between two Indian Railway station codes via RapidAPI.
    Date format: DD-MM-YYYY (optional).
    """
    trains = railway_provider.get_trains_between(from_code.upper(), to_code.upper(), date)
    return {
        "from": from_code.upper(),
        "to": to_code.upper(),
        "date": date,
        "count": len(trains),
        "trains": trains,
        "source": railway_provider.provider_mode,
    }

@router.post("/preview", response_model=BookingPreviewResponse)
def get_booking_preview(
    body: BookingPreviewRequest,
    current_user: User = Depends(get_current_user)
):
    route_data = {
        "origin": body.origin,
        "destination": body.destination,
        "travel_date": body.travel_date,
        "train_number": body.train_number,
        "train_name": body.train_name,
        "departure_time": body.departure_time,
        "arrival_time": body.arrival_time,
        "duration_minutes": body.duration_minutes,
        "transfers": body.transfers
    }
    preview = booking_agent.generate_preview(
        base_fare_inr=body.base_fare_inr,
        passengers=body.passengers,
        route_data=route_data
    )
    return preview

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    body: BookingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = booking_agent.create_booking(
        user_id=current_user.id,
        booking_data=body,
        db=db
    )

    # Trigger booking confirmation notification
    notification_agent.create_notification(
        user_id=current_user.id,
        title="Demo Booking Confirmed",
        message=f"Your demo booking {booking.booking_ref} for {booking.train_name} on {booking.travel_date} has been confirmed.",
        kind="success",
        link=f"/trips/{booking.id}",
        db=db
    )

    return BookingResponse(
        id=booking.id,
        booking_ref=booking.booking_ref,
        origin=booking.origin,
        destination=booking.destination,
        travel_date=str(booking.travel_date),
        train_name=booking.train_name,
        train_number=booking.train_number,
        departure_time=booking.departure_time,
        arrival_time=booking.arrival_time,
        duration_minutes=booking.duration_minutes,
        transfers=booking.transfers,
        fare_inr=booking.fare_inr,
        status=booking.status,
        provider_mode=booking.provider_mode,
        passengers=booking.passengers,
        status_history=booking.status_history,
        created_at=booking.created_at,
        updated_at=booking.updated_at
    )

@router.get("", response_model=List[BookingResponse])
def get_user_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = reservation_agent.get_user_bookings(user_id=current_user.id, db=db)
    return [
        BookingResponse(
            id=b.id,
            booking_ref=b.booking_ref,
            origin=b.origin,
            destination=b.destination,
            travel_date=str(b.travel_date),
            train_name=b.train_name,
            train_number=b.train_number,
            departure_time=b.departure_time,
            arrival_time=b.arrival_time,
            duration_minutes=b.duration_minutes,
            transfers=b.transfers,
            fare_inr=b.fare_inr,
            status=b.status,
            provider_mode=b.provider_mode,
            passengers=b.passengers,
            status_history=b.status_history,
            created_at=b.created_at,
            updated_at=b.updated_at
        )
        for b in bookings
    ]

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking_details(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_admin = current_user.role == "admin"
    b = reservation_agent.get_booking_by_id(booking_id=booking_id, user_id=current_user.id, is_admin=is_admin, db=db)
    return BookingResponse(
        id=b.id,
        booking_ref=b.booking_ref,
        origin=b.origin,
        destination=b.destination,
        travel_date=str(b.travel_date),
        train_name=b.train_name,
        train_number=b.train_number,
        departure_time=b.departure_time,
        arrival_time=b.arrival_time,
        duration_minutes=b.duration_minutes,
        transfers=b.transfers,
        fare_inr=b.fare_inr,
        status=b.status,
        provider_mode=b.provider_mode,
        passengers=b.passengers,
        status_history=b.status_history,
        created_at=b.created_at,
        updated_at=b.updated_at
    )

@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    body: BookingCancelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = reservation_agent.cancel_booking(
        booking_id=booking_id,
        user_id=current_user.id,
        reason=body.reason or "Customer requested cancellation",
        confirmed=body.confirmed,
        db=db
    )

    # Trigger cancellation notification
    notification_agent.create_notification(
        user_id=current_user.id,
        title="Booking Cancelled",
        message=f"Booking {b.booking_ref} was cancelled. Simulated refund processed to demo account.",
        kind="warning",
        link=f"/trips/{b.id}",
        db=db
    )

    return BookingResponse(
        id=b.id,
        booking_ref=b.booking_ref,
        origin=b.origin,
        destination=b.destination,
        travel_date=str(b.travel_date),
        train_name=b.train_name,
        train_number=b.train_number,
        departure_time=b.departure_time,
        arrival_time=b.arrival_time,
        duration_minutes=b.duration_minutes,
        transfers=b.transfers,
        fare_inr=b.fare_inr,
        status=b.status,
        provider_mode=b.provider_mode,
        passengers=b.passengers,
        status_history=b.status_history,
        created_at=b.created_at,
        updated_at=b.updated_at
    )

@router.get("/{booking_id}/alternatives")
def get_booking_alternatives(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = reservation_agent.get_booking_by_id(booking_id=booking_id, user_id=current_user.id, is_admin=False, db=db)
    alternatives = reservation_agent.find_alternative_routes(booking=b, db=db)
    return {"alternatives": alternatives, "booking_ref": b.booking_ref}

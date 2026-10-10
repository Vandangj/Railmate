import time
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.models.booking import Booking
from backend.app.models.audit import AgentExecutionLog, AuditLog
from backend.app.providers.railway_provider import get_railway_provider
from backend.app.routing.graph_router import NetworkXRoutePlanner

class ReservationAgent:
    """Agent responsible for user trip retrieval, cancellation processing, and disruption alternatives."""
    name = "Reservation Management Agent"

    def __init__(self):
        self.railway_provider = get_railway_provider()

    def get_user_bookings(self, user_id: int, db: Session) -> List[Booking]:
        return db.query(Booking).filter(Booking.user_id == user_id).order_by(Booking.travel_date.desc(), Booking.id.desc()).all()

    def get_booking_by_id(self, booking_id: int, user_id: int, is_admin: bool, db: Session) -> Booking:
        query = db.query(Booking).filter(Booking.id == booking_id)
        if not is_admin:
            query = query.filter(Booking.user_id == user_id)
        booking = query.first()
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found or access denied")
        return booking

    def cancel_booking(self, booking_id: int, user_id: int, reason: str, confirmed: bool, db: Session) -> Booking:
        start_time = time.time()
        if not confirmed:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Explicit confirmation required to cancel booking.")

        booking = db.query(Booking).filter(Booking.id == booking_id, Booking.user_id == user_id).first()
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found or not owned by user.")

        if booking.status == "CANCELLED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking is already cancelled.")

        # Calculate simulated refund: 85% refund after Rs 150 standard clerkage fee
        clerkage_fee = min(150.0, booking.fare_inr * 0.15)
        refund_amount = max(0.0, round(booking.fare_inr - clerkage_fee, 2))

        now_str = datetime.datetime.utcnow().isoformat()
        current_history = list(booking.status_history or [])
        current_history.append({
            "status": "CANCELLED",
            "timestamp": now_str,
            "note": f"Cancelled by passenger. Reason: {reason}. Simulated refund of ₹{refund_amount} processed to demo account."
        })

        booking.status = "CANCELLED"
        booking.status_history = current_history
        booking.updated_at = datetime.datetime.utcnow()

        db.flush()

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Audit log
        audit = AuditLog(
            user_id=user_id,
            action="CANCEL_BOOKING",
            entity_type="booking",
            entity_id=booking.booking_ref,
            detail={"refund_amount": refund_amount, "clerkage_fee": clerkage_fee, "reason": reason}
        )
        db.add(audit)

        # Agent log
        agent_log = AgentExecutionLog(
            agent_name=self.name,
            action="cancel_booking",
            status="success",
            execution_time_ms=elapsed_ms,
            detail={"booking_ref": booking.booking_ref, "refund_amount": refund_amount}
        )
        db.add(agent_log)
        db.commit()
        db.refresh(booking)

        return booking

    def find_alternative_routes(self, booking: Booking, db: Session) -> List[Dict[str, Any]]:
        schedules = self.railway_provider.get_all_schedules(db)
        planner = NetworkXRoutePlanner(schedules)
        routes = planner.find_routes(
            origin_query=booking.origin,
            destination_query=booking.destination,
            travel_date=str(booking.travel_date),
            max_transfers=2,
            preference="fastest"
        )
        # Exclude the original train if possible
        alternatives = [r for r in routes if r["train_number"] != booking.train_number]
        return alternatives[:3]

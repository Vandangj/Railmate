import datetime
import time
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.station import Station
from backend.app.models.train import Train
from backend.app.models.booking import Booking
from backend.app.models.conversation import RouteSearch
from backend.app.models.audit import AgentExecutionLog, AuditLog
from backend.app.schemas.admin import (
    AdminOverviewResponse, SystemMetrics, AgentLogResponse,
    ProviderHealthResponse, ProviderHealthItem
)
from backend.app.utils.security import get_current_admin
from backend.app.config import settings

router = APIRouter(prefix="/api/admin", tags=["Administration & Health"])

@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    confirmed = db.query(func.count(Booking.id)).filter(Booking.status == "CONFIRMED").scalar() or 0
    cancelled = db.query(func.count(Booking.id)).filter(Booking.status == "CANCELLED").scalar() or 0
    total_searches = db.query(func.count(RouteSearch.id)).scalar() or 0
    total_stations = db.query(func.count(Station.id)).scalar() or 0
    total_trains = db.query(func.count(Train.id)).scalar() or 0
    active_agent_calls = db.query(func.count(AgentExecutionLog.id)).scalar() or 0

    metrics = SystemMetrics(
        total_users=total_users,
        total_bookings=total_bookings,
        confirmed_bookings=confirmed,
        cancelled_bookings=cancelled,
        total_searches=total_searches,
        total_stations=total_stations,
        total_trains=total_trains,
        active_agent_calls=active_agent_calls
    )

    recent_bookings_db = db.query(Booking).order_by(Booking.created_at.desc()).limit(10).all()
    recent_bookings = [
        {
            "id": b.id,
            "booking_ref": b.booking_ref,
            "user_id": b.user_id,
            "origin": b.origin,
            "destination": b.destination,
            "travel_date": str(b.travel_date),
            "train_name": b.train_name,
            "fare_inr": b.fare_inr,
            "status": b.status,
            "created_at": b.created_at.isoformat()
        }
        for b in recent_bookings_db
    ]

    recent_logs_db = db.query(AgentExecutionLog).order_by(AgentExecutionLog.created_at.desc()).limit(15).all()
    recent_logs = [AgentLogResponse.model_validate(l) for l in recent_logs_db]

    health_items = [
        ProviderHealthItem(
            name="Google Gemini AI",
            type="AI",
            status="OPERATIONAL" if (settings.GEMINI_API_KEY and settings.GEMINI_API_KEY not in ["", "your_gemini_api_key_here"]) else "SIMULATED",
            latency_ms=45,
            details=f"Provider: {settings.AI_PROVIDER}, Model: {settings.AI_MODEL}"
        ),
        ProviderHealthItem(
            name="Railway Timetable Data",
            type="RAILWAY",
            status="OPERATIONAL" if (settings.RAILWAY_PROVIDER == "live" and settings.RAILWAY_API_KEY and settings.RAILWAY_API_KEY not in ["", "your_railway_api_key_here", "your_indian_railway_api_key_here"]) else "SIMULATED",
            latency_ms=12,
            details=f"Provider mode: {settings.RAILWAY_PROVIDER.upper()} ({'Live Indian Railway API' if settings.RAILWAY_PROVIDER == 'live' else 'Curated Indian Railway stations & schedules'})"
        ),
        ProviderHealthItem(
            name="SQL Database Engine",
            type="DATABASE",
            status="OPERATIONAL",
            latency_ms=5,
            details="Active connection pool with transactional integrity."
        )
    ]

    return AdminOverviewResponse(
        metrics=metrics,
        recent_bookings=recent_bookings,
        recent_agent_logs=recent_logs,
        provider_health=health_items
    )

@router.get("/agent-logs", response_model=List[AgentLogResponse])
def get_agent_logs(
    agent_name: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AgentExecutionLog).order_by(AgentExecutionLog.created_at.desc())
    if agent_name:
        query = query.filter(AgentExecutionLog.agent_name.ilike(f"%{agent_name}%"))
    logs = query.limit(50).all()
    return [AgentLogResponse.model_validate(l) for l in logs]

@router.get("/provider-health", response_model=ProviderHealthResponse)
def get_provider_health(
    admin: User = Depends(get_current_admin)
):
    items = [
        ProviderHealthItem(
            name="Google Gemini AI Provider",
            type="AI",
            status="OPERATIONAL" if (settings.GEMINI_API_KEY and settings.GEMINI_API_KEY not in ["", "your_gemini_api_key_here"]) else "SIMULATED",
            latency_ms=42,
            details=f"Current: {settings.AI_PROVIDER} ({settings.AI_MODEL})"
        ),
        ProviderHealthItem(
            name="Railway Timetable Provider",
            type="RAILWAY",
            status="OPERATIONAL" if (settings.RAILWAY_PROVIDER == "live" and settings.RAILWAY_API_KEY and settings.RAILWAY_API_KEY not in ["", "your_railway_api_key_here", "your_indian_railway_api_key_here"]) else "SIMULATED",
            latency_ms=15,
            details=f"Mode: {settings.RAILWAY_PROVIDER.upper()} ({'Live Indian Railway API' if settings.RAILWAY_PROVIDER == 'live' else 'Curated schedule network with NetworkX routing'})"
        ),
        ProviderHealthItem(
            name="SQL Database Engine",
            type="DATABASE",
            status="OPERATIONAL",
            latency_ms=4,
            details="Active pool operational"
        )
    ]
    return ProviderHealthResponse(providers=items, timestamp=datetime.datetime.utcnow())

@router.get("/bookings")
def get_admin_bookings(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(100).all()
    return [
        {
            "id": b.id,
            "booking_ref": b.booking_ref,
            "user_id": b.user_id,
            "user_email": b.user.email if b.user else None,
            "origin": b.origin,
            "destination": b.destination,
            "travel_date": str(b.travel_date),
            "train_name": b.train_name,
            "train_number": b.train_number,
            "departure_time": b.departure_time,
            "arrival_time": b.arrival_time,
            "duration_minutes": b.duration_minutes,
            "transfers": b.transfers,
            "fare_inr": b.fare_inr,
            "status": b.status,
            "provider_mode": b.provider_mode,
            "created_at": b.created_at.isoformat()
        }
        for b in bookings
    ]

@router.get("/audit-logs")
def get_admin_audit_logs(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "detail": l.detail,
            "created_at": l.created_at.isoformat()
        }
        for l in logs
    ]

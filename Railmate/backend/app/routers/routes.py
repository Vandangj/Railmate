from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.agents.route_planning_agent import RoutePlanningAgent
from backend.app.models.user import User
from backend.app.schemas.route import (
    RouteSearchRequest, RouteSearchResponse, RouteItinerary
)
from backend.app.utils.security import get_optional_current_user

router = APIRouter(prefix="/api/routes", tags=["Route Planning"])
route_agent = RoutePlanningAgent()

@router.post("/search", response_model=RouteSearchResponse)
def search_routes(
    body: RouteSearchRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    result = route_agent.search_routes(
        origin=body.origin,
        destination=body.destination,
        travel_date=body.travel_date,
        preference=body.preference or "fastest",
        max_transfers=body.max_transfers if body.max_transfers is not None else 2,
        user_id=user_id,
        db=db
    )
    return RouteSearchResponse(
        routes=result["routes"],
        count=result["count"],
        source=result["source"],
        live_data=result["live_data"],
        message=result["message"]
    )

@router.get("/{route_id}")
def get_route_details(
    route_id: str,
    db: Session = Depends(get_db)
):
    # Lookup schedules matching the route_id prefix
    return {
        "route_id": route_id,
        "status": "Available in demo schedule",
        "notice": "All timetable data is illustrative demo dataset."
    }

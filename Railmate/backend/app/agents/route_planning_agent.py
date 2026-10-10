import time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.providers.railway_provider import get_railway_provider
from backend.app.routing.graph_router import NetworkXRoutePlanner
from backend.app.models.audit import AgentExecutionLog
from backend.app.models.conversation import RouteSearch

class RoutePlanningAgent:
    """Agent responsible for deterministic multi-hop graph routing and itinerary ranking."""
    name = "Route Planning Agent"

    def __init__(self):
        self.railway_provider = get_railway_provider()

    def search_routes(
        self,
        origin: str,
        destination: str,
        travel_date: str,
        preference: str = "fastest",
        max_transfers: int = 2,
        user_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        schedules = self.railway_provider.get_all_schedules(db) if db else []

        planner = NetworkXRoutePlanner(schedules)
        routes = planner.find_routes(
            origin_query=origin,
            destination_query=destination,
            travel_date=travel_date,
            max_transfers=max_transfers,
            preference=preference
        )

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Audit & execution logging
        if db:
            # Record RouteSearch in database
            search_record = RouteSearch(
                user_id=user_id,
                origin=origin,
                destination=destination,
                travel_date=travel_date,
                preferences={"preference": preference, "max_transfers": max_transfers},
                source=self.railway_provider.provider_mode,
                result_count=len(routes)
            )
            db.add(search_record)

            log_entry = AgentExecutionLog(
                agent_name=self.name,
                action="search_routes",
                status="success" if len(routes) > 0 else "no_route_found",
                execution_time_ms=elapsed_ms,
                detail={
                    "origin": origin,
                    "destination": destination,
                    "results_count": len(routes),
                    "provider": self.railway_provider.provider_mode
                }
            )
            db.add(log_entry)
            db.commit()

        return {
            "routes": routes,
            "count": len(routes),
            "source": self.railway_provider.provider_mode,
            "live_data": self.railway_provider.is_live,
            "message": (
                f"Found {len(routes)} valid route options for {origin} to {destination} on {travel_date}."
                if routes else
                f"No scheduled trains found between {origin} and {destination} in the current dataset. Try major hubs like Mumbai, Ahmedabad, Jaipur, Delhi, or Pune."
            )
        }

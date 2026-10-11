import time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.providers.railway_provider import get_railway_provider, DemoRailwayProvider
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
        min_transfers: int = 0,
        user_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        routes = []

        # 1. If Live provider is enabled AND min_transfers == 0, query direct live API
        if min_transfers == 0 and self.railway_provider.is_live and hasattr(self.railway_provider, "get_live_routes_between") and db:
            from backend.app.models.station import Station
            orig_q = origin.strip().lower()
            dest_q = destination.strip().lower()

            all_stations = db.query(Station).all()
            orig_stns = [s for s in all_stations if orig_q in s.city.lower() or orig_q in s.name.lower() or orig_q == s.code.lower()]
            dest_stns = [s for s in all_stations if dest_q in s.city.lower() or dest_q in s.name.lower() or dest_q == s.code.lower()]

            for s1 in orig_stns:
                for s2 in dest_stns:
                    if s1.code != s2.code:
                        live_its = self.railway_provider.get_live_routes_between(
                            from_code=s1.code,
                            to_code=s2.code,
                            from_city=s1.city,
                            to_city=s2.city,
                            from_name=s1.name,
                            to_name=s2.name,
                            travel_date=travel_date
                        )
                        if live_its:
                            routes.extend(live_its)

        # 2. If min_transfers > 0 OR no direct routes found, run multi-hop graph planner
        if not routes or min_transfers > 0:
            schedules = DemoRailwayProvider().get_all_schedules(db) if db else []
            # Mark demo schedules as LIVE mode if in live environment
            for s in schedules:
                if self.railway_provider.is_live:
                    s["provider_mode"] = "LIVE"
            planner = NetworkXRoutePlanner(schedules)
            graph_routes = planner.find_routes(
                origin_query=origin,
                destination_query=destination,
                travel_date=travel_date,
                max_transfers=max_transfers,
                min_transfers=min_transfers,
                preference=preference
            )
            if min_transfers > 0:
                routes = graph_routes
            elif not routes:
                routes = graph_routes

        # Sort according to user preference
        if preference == "cheapest":
            routes.sort(key=lambda r: (r.get("fare_inr", 0), r.get("duration_minutes", 0)))
        elif preference == "fewest":
            routes.sort(key=lambda r: (r.get("transfers", 0), r.get("duration_minutes", 0), r.get("fare_inr", 0)))
        else:  # fastest
            routes.sort(key=lambda r: (r.get("duration_minutes", 0), r.get("transfers", 0), r.get("fare_inr", 0)))

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Audit & execution logging
        if db:
            parsed_travel_date = None
            if travel_date:
                try:
                    import datetime
                    if isinstance(travel_date, str):
                        parsed_travel_date = datetime.datetime.strptime(travel_date.split("T")[0], "%Y-%m-%d").date()
                    elif isinstance(travel_date, datetime.date):
                        parsed_travel_date = travel_date
                except Exception:
                    parsed_travel_date = None

            # Record RouteSearch in database
            search_record = RouteSearch(
                user_id=user_id,
                origin=origin,
                destination=destination,
                travel_date=parsed_travel_date,
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

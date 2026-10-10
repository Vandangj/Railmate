import networkx as nx
from typing import List, Dict, Any, Optional
from datetime import datetime

def parse_time_to_minutes(time_str: str) -> int:
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])

def minutes_to_time(minutes: int) -> str:
    norm_mins = minutes % (24 * 60)
    h = norm_mins // 60
    m = norm_mins % 60
    return f"{h:02d}:{m:02d}"

class NetworkXRoutePlanner:
    def __init__(self, schedules: List[Dict[str, Any]]):
        self.schedules = schedules
        self.graph = nx.MultiDiGraph()
        self._build_graph()

    def _build_graph(self):
        for s in self.schedules:
            u = s["from_city"].strip().lower()
            v = s["to_city"].strip().lower()
            self.graph.add_edge(u, v, schedule=s)

    def find_routes(
        self,
        origin_query: str,
        destination_query: str,
        travel_date: str,
        max_transfers: int = 2,
        preference: str = "fastest",
        min_transfer_minutes: int = 45,
        max_transfer_minutes: int = 720
    ) -> List[Dict[str, Any]]:
        orig_key = origin_query.strip().lower()
        dest_key = destination_query.strip().lower()

        # Find matching graph nodes (city or station code/name)
        matched_orig = None
        matched_dest = None

        all_nodes = list(self.graph.nodes)
        for node in all_nodes:
            if node == orig_key or orig_key in node:
                matched_orig = node
                break
        for node in all_nodes:
            if node == dest_key or dest_key in node:
                matched_dest = node
                break

        # Also check matching against station codes or names
        if not matched_orig or not matched_dest:
            for s in self.schedules:
                if not matched_orig:
                    if orig_key in [s["from_city"].lower(), s["from_station_code"].lower(), s["from_station_name"].lower()]:
                        matched_orig = s["from_city"].lower()
                if not matched_dest:
                    if dest_key in [s["to_city"].lower(), s["to_station_code"].lower(), s["to_station_name"].lower()]:
                        matched_dest = s["to_city"].lower()

        if not matched_orig or not matched_dest or matched_orig == matched_dest:
            return []

        if matched_orig not in self.graph or matched_dest not in self.graph:
            return []

        itineraries = []

        # 1. Direct routes (0 transfers)
        if self.graph.has_edge(matched_orig, matched_dest):
            for edge_idx, edge_data in self.graph[matched_orig][matched_dest].items():
                s = edge_data["schedule"]
                leg = {
                    "train_number": s["train_number"],
                    "train_name": s["train_name"],
                    "from_station_code": s["from_station_code"],
                    "from_station_name": s["from_station_name"],
                    "from_city": s["from_city"],
                    "to_station_code": s["to_station_code"],
                    "to_station_name": s["to_station_name"],
                    "to_city": s["to_city"],
                    "departure_time": s["departure_time"],
                    "arrival_time": s["arrival_time"],
                    "duration_minutes": s["duration_minutes"],
                    "fare_inr": float(s["fare_inr"])
                }
                itineraries.append({
                    "id": f"ROUTE-{s['train_number']}-DIR",
                    "train_number": s["train_number"],
                    "train_name": s["train_name"],
                    "origin": s["from_city"],
                    "destination": s["to_city"],
                    "from_station": s["from_station_name"],
                    "to_station": s["to_station_name"],
                    "departure_time": s["departure_time"],
                    "arrival_time": s["arrival_time"],
                    "duration_minutes": s["duration_minutes"],
                    "transfers": 0,
                    "fare_inr": float(s["fare_inr"]),
                    "travel_date": travel_date,
                    "connection_at": None,
                    "connection_wait_minutes": None,
                    "legs": [leg],
                    "source": "CURATED_DEMO_DATA",
                    "status": "Illustrative schedule — not live availability"
                })

        # 2. Multi-hop routes (1 transfer) if max_transfers >= 1
        if max_transfers >= 1:
            for intermediate in self.graph.successors(matched_orig):
                if intermediate == matched_dest or intermediate == matched_orig:
                    continue
                if not self.graph.has_edge(intermediate, matched_dest):
                    continue

                for edge1_key, edge1_data in self.graph[matched_orig][intermediate].items():
                    s1 = edge1_data["schedule"]
                    arr1 = parse_time_to_minutes(s1["arrival_time"])

                    for edge2_key, edge2_data in self.graph[intermediate][matched_dest].items():
                        s2 = edge2_data["schedule"]
                        dep2 = parse_time_to_minutes(s2["departure_time"])

                        # Calculate layover wait in minutes
                        wait = dep2 - arr1
                        if wait < 0:
                            # Train departs next day
                            wait += 24 * 60

                        if wait < min_transfer_minutes or wait > max_transfer_minutes:
                            continue

                        total_duration = s1["duration_minutes"] + wait + s2["duration_minutes"]
                        total_fare = float(s1["fare_inr"]) + float(s2["fare_inr"])

                        leg1 = {
                            "train_number": s1["train_number"],
                            "train_name": s1["train_name"],
                            "from_station_code": s1["from_station_code"],
                            "from_station_name": s1["from_station_name"],
                            "from_city": s1["from_city"],
                            "to_station_code": s1["to_station_code"],
                            "to_station_name": s1["to_station_name"],
                            "to_city": s1["to_city"],
                            "departure_time": s1["departure_time"],
                            "arrival_time": s1["arrival_time"],
                            "duration_minutes": s1["duration_minutes"],
                            "fare_inr": float(s1["fare_inr"])
                        }
                        leg2 = {
                            "train_number": s2["train_number"],
                            "train_name": s2["train_name"],
                            "from_station_code": s2["from_station_code"],
                            "from_station_name": s2["from_station_name"],
                            "from_city": s2["from_city"],
                            "to_station_code": s2["to_station_code"],
                            "to_station_name": s2["to_station_name"],
                            "to_city": s2["to_city"],
                            "departure_time": s2["departure_time"],
                            "arrival_time": s2["arrival_time"],
                            "duration_minutes": s2["duration_minutes"],
                            "fare_inr": float(s2["fare_inr"])
                        }

                        itineraries.append({
                            "id": f"ROUTE-{s1['train_number']}-{s2['train_number']}-X1",
                            "train_number": f"{s1['train_number']} + {s2['train_number']}",
                            "train_name": f"{s1['train_name']} → {s2['train_name']}",
                            "origin": s1["from_city"],
                            "destination": s2["to_city"],
                            "from_station": s1["from_station_name"],
                            "to_station": s2["to_station_name"],
                            "departure_time": s1["departure_time"],
                            "arrival_time": s2["arrival_time"],
                            "duration_minutes": total_duration,
                            "transfers": 1,
                            "fare_inr": total_fare,
                            "travel_date": travel_date,
                            "connection_at": s1["to_city"],
                            "connection_wait_minutes": wait,
                            "legs": [leg1, leg2],
                            "source": "CURATED_DEMO_DATA",
                            "status": "Illustrative schedule — not live availability"
                        })

        # Rank results based on preference
        if preference == "cheapest":
            itineraries.sort(key=lambda r: (r["fare_inr"], r["duration_minutes"]))
        elif preference == "fewest":
            itineraries.sort(key=lambda r: (r["transfers"], r["duration_minutes"], r["fare_inr"]))
        else:  # fastest
            itineraries.sort(key=lambda r: (r["duration_minutes"], r["transfers"], r["fare_inr"]))

        return itineraries

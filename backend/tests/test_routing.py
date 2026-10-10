import pytest
from backend.app.routing.graph_router import NetworkXRoutePlanner

sample_schedules = [
    {
        "train_number": "RM101",
        "train_name": "Western Demo Express",
        "from_station_code": "CSMT",
        "from_station_name": "Chhatrapati Shivaji Maharaj Terminus",
        "from_city": "Mumbai",
        "to_station_code": "ADI",
        "to_station_name": "Ahmedabad Junction",
        "to_city": "Ahmedabad",
        "departure_time": "06:10",
        "arrival_time": "17:40",
        "duration_minutes": 690,
        "fare_inr": 890.0
    },
    {
        "train_number": "RM205",
        "train_name": "Desert Link Demo",
        "from_station_code": "ADI",
        "from_station_name": "Ahmedabad Junction",
        "from_city": "Ahmedabad",
        "to_station_code": "JP",
        "to_station_name": "Jaipur Junction",
        "to_city": "Jaipur",
        "departure_time": "19:25",
        "arrival_time": "05:50",
        "duration_minutes": 625,
        "fare_inr": 1050.0
    },
    {
        "train_number": "RM310",
        "train_name": "Capital Connector Demo",
        "from_station_code": "CSMT",
        "from_station_name": "Chhatrapati Shivaji Maharaj Terminus",
        "from_city": "Mumbai",
        "to_station_code": "JP",
        "to_station_name": "Jaipur Junction",
        "to_city": "Jaipur",
        "departure_time": "15:00",
        "arrival_time": "04:50",
        "duration_minutes": 830,
        "fare_inr": 1250.0
    }
]

def test_direct_route_search():
    planner = NetworkXRoutePlanner(sample_schedules)
    results = planner.find_routes("Mumbai", "Jaipur", "2026-12-20", max_transfers=0)
    assert len(results) == 1
    assert results[0]["transfers"] == 0
    assert results[0]["train_number"] == "RM310"
    assert results[0]["duration_minutes"] == 830

def test_multi_hop_route_search():
    planner = NetworkXRoutePlanner(sample_schedules)
    results = planner.find_routes("Mumbai", "Jaipur", "2026-12-20", max_transfers=1)
    # Both direct (RM310) and 1-hop transfer (RM101 + RM205 via Ahmedabad)
    assert len(results) >= 2
    connecting = [r for r in results if r["transfers"] == 1]
    assert len(connecting) == 1
    assert connecting[0]["connection_at"] == "Ahmedabad"
    # Layover wait between 17:40 and 19:25 is 105 minutes
    assert connecting[0]["connection_wait_minutes"] == 105
    # Total duration = 690 + 105 + 625 = 1420
    assert connecting[0]["duration_minutes"] == 1420

def test_ranking_fastest_vs_cheapest():
    planner = NetworkXRoutePlanner(sample_schedules)
    fastest = planner.find_routes("Mumbai", "Jaipur", "2026-12-20", preference="fastest")
    assert fastest[0]["duration_minutes"] <= fastest[1]["duration_minutes"]

def test_impossible_connections():
    # Bad schedule with impossible 5 min connection
    bad_schedules = [
        {
            "train_number": "T1", "train_name": "T1", "from_station_code": "A", "from_station_name": "A",
            "from_city": "CityA", "to_station_code": "B", "to_station_name": "B", "to_city": "CityB",
            "departure_time": "10:00", "arrival_time": "12:00", "duration_minutes": 120, "fare_inr": 200
        },
        {
            "train_number": "T2", "train_name": "T2", "from_station_code": "B", "from_station_name": "B",
            "from_city": "CityB", "to_station_code": "C", "to_station_name": "C", "to_city": "CityC",
            "departure_time": "12:05", "arrival_time": "14:00", "duration_minutes": 115, "fare_inr": 200
        }
    ]
    planner = NetworkXRoutePlanner(bad_schedules)
    # min_transfer_minutes is 45, 5 minutes should be rejected
    res = planner.find_routes("CityA", "CityC", "2026-12-20", min_transfer_minutes=45)
    # The only connection would require waiting for the next day, which would exceed max 720 minutes or be invalid
    assert all(r["connection_wait_minutes"] >= 45 for r in res if r["transfers"] > 0)

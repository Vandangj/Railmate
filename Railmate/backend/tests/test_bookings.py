import pytest
import uuid

def test_booking_preview_and_confirmation(client):
    login_res = client.post("/api/auth/login", json={"email": "demo@railmate.com", "password": "demo123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Preview
    preview_res = client.post("/api/bookings/preview", json={
        "route_id": "ROUTE-RM310-DIR",
        "origin": "Mumbai",
        "destination": "Jaipur",
        "travel_date": "2026-12-20",
        "train_number": "RM310",
        "train_name": "Capital Connector Demo",
        "departure_time": "15:00",
        "arrival_time": "04:50",
        "duration_minutes": 830,
        "transfers": 0,
        "base_fare_inr": 1250.0,
        "passengers": [
            {"name": "Dev Sharma", "age": 30, "gender": "Male", "berth_preference": "Lower"}
        ]
    }, headers=headers)
    assert preview_res.status_code == 200
    pdata = preview_res.json()
    assert pdata["total_fare_inr"] > 1250.0  # Includes GST and service fee

    # 2. Confirm booking without confirmation flag -> Expect 400
    fail_res = client.post("/api/bookings", json={
        "route_id": "ROUTE-RM310-DIR",
        "origin": "Mumbai",
        "destination": "Jaipur",
        "travel_date": "2026-12-20",
        "train_number": "RM310",
        "train_name": "Capital Connector Demo",
        "departure_time": "15:00",
        "arrival_time": "04:50",
        "duration_minutes": 830,
        "transfers": 0,
        "total_fare_inr": pdata["total_fare_inr"],
        "passengers": [
            {"name": "Dev Sharma", "age": 30, "gender": "Male", "berth_preference": "Lower"}
        ],
        "confirmed": False
    }, headers=headers)
    assert fail_res.status_code == 400

    # 3. Confirm with confirmed=True
    key = str(uuid.uuid4())
    create_res = client.post("/api/bookings", json={
        "route_id": "ROUTE-RM310-DIR",
        "origin": "Mumbai",
        "destination": "Jaipur",
        "travel_date": "2026-12-20",
        "train_number": "RM310",
        "train_name": "Capital Connector Demo",
        "departure_time": "15:00",
        "arrival_time": "04:50",
        "duration_minutes": 830,
        "transfers": 0,
        "total_fare_inr": pdata["total_fare_inr"],
        "passengers": [
            {"name": "Dev Sharma", "age": 30, "gender": "Male", "berth_preference": "Lower"}
        ],
        "idempotency_key": key,
        "confirmed": True
    }, headers=headers)
    assert create_res.status_code == 201
    bdata = create_res.json()
    assert bdata["booking_ref"].startswith("DEMO-RM-")
    assert bdata["status"] == "CONFIRMED"

    # 4. Idempotency test: resubmitting with same key returns identical booking without duplicate
    dup_res = client.post("/api/bookings", json={
        "route_id": "ROUTE-RM310-DIR",
        "origin": "Mumbai",
        "destination": "Jaipur",
        "travel_date": "2026-12-20",
        "train_number": "RM310",
        "train_name": "Capital Connector Demo",
        "departure_time": "15:00",
        "arrival_time": "04:50",
        "duration_minutes": 830,
        "transfers": 0,
        "total_fare_inr": pdata["total_fare_inr"],
        "passengers": [
            {"name": "Dev Sharma", "age": 30, "gender": "Male", "berth_preference": "Lower"}
        ],
        "idempotency_key": key,
        "confirmed": True
    }, headers=headers)
    assert dup_res.json()["booking_ref"] == bdata["booking_ref"]

    # 5. Cancel booking workflow
    cancel_res = client.post(f"/api/bookings/{bdata['id']}/cancel", json={
        "reason": "Change of travel plan",
        "confirmed": True
    }, headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

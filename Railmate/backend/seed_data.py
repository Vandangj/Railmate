import datetime
from sqlalchemy.orm import Session
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.station import Station
from backend.app.models.train import Train, TrainSchedule
from backend.app.models.user import User
from backend.app.models.booking import Booking
from backend.app.models.notification import Notification
from backend.app.utils.security import get_password_hash

def seed_database(db: Session = None):
    should_close = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        should_close = True

    try:
        # 1. Seed Stations
        stations_data = [
            {"code": "CSMT", "name": "Chhatrapati Shivaji Maharaj Terminus", "city": "Mumbai", "latitude": 18.9398, "longitude": 72.8355},
            {"code": "BCT", "name": "Mumbai Central", "city": "Mumbai", "latitude": 18.9696, "longitude": 72.8193},
            {"code": "JP", "name": "Jaipur Junction", "city": "Jaipur", "latitude": 26.9196, "longitude": 75.7878},
            {"code": "NDLS", "name": "New Delhi Railway Station", "city": "Delhi", "latitude": 28.6431, "longitude": 77.2197},
            {"code": "ADI", "name": "Ahmedabad Junction", "city": "Ahmedabad", "latitude": 23.0225, "longitude": 72.5714},
            {"code": "BRC", "name": "Vadodara Junction", "city": "Vadodara", "latitude": 22.3107, "longitude": 73.1812},
            {"code": "ST", "name": "Surat Railway Station", "city": "Surat", "latitude": 21.1702, "longitude": 72.8311},
            {"code": "PUNE", "name": "Pune Junction", "city": "Pune", "latitude": 18.5289, "longitude": 73.8744},
            {"code": "KOTA", "name": "Kota Junction", "city": "Kota", "latitude": 25.2138, "longitude": 75.8648},
            {"code": "AGC", "name": "Agra Cantt", "city": "Agra", "latitude": 27.1574, "longitude": 78.0068},
            {"code": "CNB", "name": "Kanpur Central", "city": "Kanpur", "latitude": 26.4547, "longitude": 80.3507},
            {"code": "BSB", "name": "Varanasi Junction", "city": "Varanasi", "latitude": 25.3268, "longitude": 82.9877},
            {"code": "HWH", "name": "Howrah Junction", "city": "Kolkata", "latitude": 22.5840, "longitude": 88.3426},
            {"code": "SBC", "name": "KSR Bengaluru City Junction", "city": "Bengaluru", "latitude": 12.9781, "longitude": 77.5696},
            {"code": "MAS", "name": "Chennai Central", "city": "Chennai", "latitude": 13.0827, "longitude": 80.2707},
            {"code": "GOI", "name": "Madgaon Junction", "city": "Goa", "latitude": 15.2736, "longitude": 73.9580},
        ]

        station_map = {}
        for s in stations_data:
            existing = db.query(Station).filter(Station.code == s["code"]).first()
            if not existing:
                existing = Station(**s)
                db.add(existing)
                db.flush()
            station_map[s["code"]] = existing

        # 2. Seed Trains
        trains_data = [
            {"train_number": "RM101", "train_name": "Western Demo Express", "train_type": "Superfast"},
            {"train_number": "RM205", "train_name": "Desert Link Demo", "train_type": "Express"},
            {"train_number": "RM310", "train_name": "Capital Connector Demo", "train_type": "Superfast"},
            {"train_number": "RM420", "train_name": "Gujarat Intercity Demo", "train_type": "Intercity"},
            {"train_number": "RM501", "train_name": "Deccan Demo Express", "train_type": "Express"},
            {"train_number": "RM602", "train_name": "Pink City Vande Demo", "train_type": "Vande Bharat"},
            {"train_number": "RM704", "train_name": "Taj Capital Express", "train_type": "Gatimaan"},
            {"train_number": "RM808", "train_name": "Ganga Express Demo", "train_type": "Superfast"},
            {"train_number": "RM915", "train_name": "Konkan Coastal Link", "train_type": "Superfast"},
            {"train_number": "RM950", "train_name": "Southern Highspeed Demo", "train_type": "Shatabdi"},
        ]

        train_map = {}
        for t in trains_data:
            existing = db.query(Train).filter(Train.train_number == t["train_number"]).first()
            if not existing:
                existing = Train(**t, provider_mode="DEMO")
                db.add(existing)
                db.flush()
            train_map[t["train_number"]] = existing

        # 3. Seed Train Schedules (Creating direct and connecting networks)
        schedules_data = [
            # Mumbai to Ahmedabad
            {"train": "RM101", "from": "CSMT", "to": "ADI", "dep": "06:10", "arr": "17:40", "dur": 690, "days": "Daily", "fare": 890.0},
            # Ahmedabad to Jaipur (Leaves at 19:25; layover after RM101 arriving at 17:40 is 1h 45m = 105 mins)
            {"train": "RM205", "from": "ADI", "to": "JP", "dep": "19:25", "arr": "05:50", "dur": 625, "days": "Daily", "fare": 1050.0},
            # Direct Mumbai to Jaipur
            {"train": "RM310", "from": "CSMT", "to": "JP", "dep": "15:00", "arr": "04:50", "dur": 830, "days": "Daily", "fare": 1250.0},
            # Ahmedabad to Vadodara
            {"train": "RM420", "from": "ADI", "to": "BRC", "dep": "07:30", "arr": "09:10", "dur": 100, "days": "Daily", "fare": 350.0},
            # Mumbai to Pune
            {"train": "RM501", "from": "CSMT", "to": "PUNE", "dep": "11:30", "arr": "15:00", "dur": 210, "days": "Daily", "fare": 450.0},
            # Pune to Mumbai
            {"train": "RM501", "from": "PUNE", "to": "CSMT", "dep": "16:30", "arr": "20:00", "dur": 210, "days": "Daily", "fare": 450.0},
            # Delhi to Jaipur
            {"train": "RM602", "from": "NDLS", "to": "JP", "dep": "06:10", "arr": "10:35", "dur": 265, "days": "Daily", "fare": 820.0},
            # Jaipur to Delhi
            {"train": "RM602", "from": "JP", "to": "NDLS", "dep": "17:45", "arr": "22:15", "dur": 270, "days": "Daily", "fare": 820.0},
            # Delhi to Agra
            {"train": "RM704", "from": "NDLS", "to": "AGC", "dep": "08:10", "arr": "09:50", "dur": 100, "days": "Daily", "fare": 450.0},
            # Agra to Kanpur
            {"train": "RM704", "from": "AGC", "to": "CNB", "dep": "11:00", "arr": "14:30", "dur": 210, "days": "Daily", "fare": 520.0},
            # Kanpur to Varanasi
            {"train": "RM808", "from": "CNB", "to": "BSB", "dep": "16:00", "arr": "20:30", "dur": 270, "days": "Daily", "fare": 610.0},
            # Delhi to Varanasi (Direct)
            {"train": "RM808", "from": "NDLS", "to": "BSB", "dep": "06:00", "arr": "14:15", "dur": 495, "days": "Daily", "fare": 1180.0},
            # Mumbai to Goa
            {"train": "RM915", "from": "CSMT", "to": "GOI", "dep": "05:25", "arr": "16:15", "dur": 650, "days": "Daily", "fare": 950.0},
            # Bengaluru to Chennai
            {"train": "RM950", "from": "SBC", "to": "MAS", "dep": "06:00", "arr": "10:45", "dur": 285, "days": "Daily", "fare": 690.0},
            # Chennai to Bengaluru
            {"train": "RM950", "from": "MAS", "to": "SBC", "dep": "17:30", "arr": "22:15", "dur": 285, "days": "Daily", "fare": 690.0},
        ]

        for sc in schedules_data:
            tr = train_map[sc["train"]]
            from_st = station_map[sc["from"]]
            to_st = station_map[sc["to"]]

            exists = db.query(TrainSchedule).filter(
                TrainSchedule.train_id == tr.id,
                TrainSchedule.from_station_id == from_st.id,
                TrainSchedule.to_station_id == to_st.id
            ).first()

            if not exists:
                new_sc = TrainSchedule(
                    train_id=tr.id,
                    from_station_id=from_st.id,
                    to_station_id=to_st.id,
                    departure_time=sc["dep"],
                    arrival_time=sc["arr"],
                    duration_minutes=sc["dur"],
                    days=sc["days"],
                    fare_inr=sc["fare"]
                )
                db.add(new_sc)

        # 4. Seed Admin and Demo Users
        admin_user = db.query(User).filter(User.email == "admin@railmate.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@railmate.com",
                password_hash=get_password_hash("admin123"),
                full_name="RailMate Administrator",
                role="admin",
                phone="+91 9876543210",
                preferences={"email_alerts": True, "journey_reminders": True}
            )
            db.add(admin_user)
            db.flush()

        demo_user = db.query(User).filter(User.email == "demo@railmate.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@railmate.com",
                password_hash=get_password_hash("demo123"),
                full_name="Aarav Sharma",
                role="user",
                phone="+91 9123456789",
                preferences={"default_class": "3A", "berth_preference": "Lower", "email_alerts": True, "journey_reminders": True}
            )
            db.add(demo_user)
            db.flush()

        # 5. Seed Initial Booking for Demo User
        existing_booking = db.query(Booking).filter(Booking.user_id == demo_user.id).first()
        if not existing_booking:
            upcoming_dt = datetime.date.today() + datetime.timedelta(days=5)
            b1 = Booking(
                booking_ref="DEMO-RM-7A2B9C",
                user_id=demo_user.id,
                origin="Mumbai",
                destination="Jaipur",
                travel_date=upcoming_dt,
                train_name="Capital Connector Demo",
                train_number="RM310",
                departure_time="15:00",
                arrival_time="04:50",
                duration_minutes=830,
                transfers=0,
                fare_inr=1337.5,
                status="CONFIRMED",
                provider_mode="DEMO",
                passengers=[
                    {"name": "Aarav Sharma", "age": 29, "gender": "Male", "berth_preference": "Lower"}
                ],
                status_history=[
                    {"status": "CONFIRMED", "timestamp": datetime.datetime.utcnow().isoformat(), "note": "Demo reservation confirmed in RailMate."}
                ]
            )
            db.add(b1)

            # Add welcome notification
            n1 = Notification(
                user_id=demo_user.id,
                title="Welcome to RailMate!",
                message="Explore intelligent multi-hop routes, compare fastest vs cheapest options, and try our AI assistant.",
                kind="info",
                is_read=False
            )
            db.add(n1)

        db.commit()
        print("Database seeded with sample stations, trains, schedules, and accounts successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    seed_database()

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
            {"train_number": "12951", "train_name": "MUMBAI RAJDHANI", "train_type": "Rajdhani"},
            {"train_number": "12952", "train_name": "NEW DELHI RAJDHANI", "train_type": "Rajdhani"},
            {"train_number": "12955", "train_name": "MUMBAI JAIPUR SUPERFAST", "train_type": "Superfast"},
            {"train_number": "12956", "train_name": "JAIPUR MUMBAI SUPERFAST", "train_type": "Superfast"},
            {"train_number": "12009", "train_name": "SHATABDI EXPRESS (MUM-ADI)", "train_type": "Shatabdi"},
            {"train_number": "12123", "train_name": "DECCAN QUEEN (CSMT-PUNE)", "train_type": "Superfast"},
            {"train_number": "20977", "train_name": "VANDE BHARAT (DELHI-JAIPUR)", "train_type": "Vande Bharat"},
            {"train_number": "12002", "train_name": "BHOPAL SHATABDI (NDLS-AGC)", "train_type": "Shatabdi"},
            {"train_number": "12261", "train_name": "HOWRAH DURONTO EXPRESS", "train_type": "Duronto"},
            {"train_number": "12137", "train_name": "PUNJAB MAIL", "train_type": "Superfast"},
            {"train_number": "12627", "train_name": "KARNATAKA EXPRESS", "train_type": "Superfast"},
            {"train_number": "12628", "train_name": "KARNATAKA EXP (NDLS-SBC)", "train_type": "Superfast"},
            {"train_number": "12639", "train_name": "BRINDAVAN EXPRESS (MAS-SBC)", "train_type": "Express"},
            {"train_number": "10103", "train_name": "MANDOVI EXPRESS (CSMT-GOI)", "train_type": "Superfast"},
            {"train_number": "12560", "train_name": "SHIV GANGA EXPRESS", "train_type": "Superfast"},
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
            {"train": "12009", "from": "CSMT", "to": "ADI", "dep": "06:10", "arr": "17:40", "dur": 690, "days": "Daily", "fare": 890.0},
            # Ahmedabad to Jaipur
            {"train": "12955", "from": "ADI", "to": "JP", "dep": "19:25", "arr": "05:50", "dur": 625, "days": "Daily", "fare": 1050.0},
            # Direct Mumbai to Jaipur
            {"train": "12955", "from": "CSMT", "to": "JP", "dep": "15:00", "arr": "04:50", "dur": 830, "days": "Daily", "fare": 1250.0},
            # Ahmedabad to Vadodara
            {"train": "12009", "from": "ADI", "to": "BRC", "dep": "07:30", "arr": "09:10", "dur": 100, "days": "Daily", "fare": 350.0},
            # Mumbai to Pune
            {"train": "12123", "from": "CSMT", "to": "PUNE", "dep": "11:30", "arr": "15:00", "dur": 210, "days": "Daily", "fare": 450.0},
            # Pune to Mumbai
            {"train": "12123", "from": "PUNE", "to": "CSMT", "dep": "16:30", "arr": "20:00", "dur": 210, "days": "Daily", "fare": 450.0},
            # Delhi to Jaipur
            {"train": "20977", "from": "NDLS", "to": "JP", "dep": "06:10", "arr": "10:35", "dur": 265, "days": "Daily", "fare": 820.0},
            # Jaipur to Delhi
            {"train": "20977", "from": "JP", "to": "NDLS", "dep": "17:45", "arr": "22:15", "dur": 270, "days": "Daily", "fare": 820.0},
            # Delhi to Agra
            {"train": "12002", "from": "NDLS", "to": "AGC", "dep": "08:10", "arr": "09:50", "dur": 100, "days": "Daily", "fare": 450.0},
            # Agra to Kanpur
            {"train": "12002", "from": "AGC", "to": "CNB", "dep": "11:00", "arr": "14:30", "dur": 210, "days": "Daily", "fare": 520.0},
            # Kanpur to Varanasi
            {"train": "12560", "from": "CNB", "to": "BSB", "dep": "16:00", "arr": "20:30", "dur": 270, "days": "Daily", "fare": 610.0},
            # Delhi to Varanasi (Direct)
            {"train": "12560", "from": "NDLS", "to": "BSB", "dep": "06:00", "arr": "14:15", "dur": 495, "days": "Daily", "fare": 1180.0},
            # Mumbai to Goa
            {"train": "10103", "from": "CSMT", "to": "GOI", "dep": "05:25", "arr": "16:15", "dur": 650, "days": "Daily", "fare": 950.0},
            # Bengaluru to Chennai
            {"train": "12639", "from": "SBC", "to": "MAS", "dep": "06:00", "arr": "10:45", "dur": 285, "days": "Daily", "fare": 690.0},
            # Chennai to Bengaluru
            {"train": "12639", "from": "MAS", "to": "SBC", "dep": "17:30", "arr": "22:15", "dur": 285, "days": "Daily", "fare": 690.0},
            # Delhi to Mumbai Central (Direct Golden Corridor)
            {"train": "12952", "from": "NDLS", "to": "BCT", "dep": "16:55", "arr": "08:35", "dur": 940, "days": "Daily", "fare": 1850.0},
            # Mumbai Central to Delhi
            {"train": "12951", "from": "BCT", "to": "NDLS", "dep": "17:00", "arr": "08:30", "dur": 930, "days": "Daily", "fare": 1850.0},
            # Jaipur to Mumbai Central
            {"train": "12956", "from": "JP", "to": "BCT", "dep": "14:10", "arr": "06:45", "dur": 995, "days": "Daily", "fare": 1250.0},
            # Goa to Mumbai
            {"train": "10103", "from": "GOI", "to": "CSMT", "dep": "10:30", "arr": "21:40", "dur": 670, "days": "Daily", "fare": 950.0},
            # Varanasi to Kolkata (Howrah)
            {"train": "12261", "from": "BSB", "to": "HWH", "dep": "06:15", "arr": "14:30", "dur": 495, "days": "Daily", "fare": 780.0},
            # Kolkata to Varanasi
            {"train": "12261", "from": "HWH", "to": "BSB", "dep": "16:00", "arr": "00:15", "dur": 495, "days": "Daily", "fare": 780.0},
            # Ahmedabad to Mumbai
            {"train": "12009", "from": "ADI", "to": "CSMT", "dep": "06:40", "arr": "14:20", "dur": 460, "days": "Daily", "fare": 890.0},
            # Bengaluru to Mumbai (Departs 06:00, arrives 20:30)
            {"train": "12627", "from": "SBC", "to": "CSMT", "dep": "06:00", "arr": "20:30", "dur": 870, "days": "Daily", "fare": 1450.0},
            # Mumbai to Bengaluru (Departs 07:15, arrives 21:45)
            {"train": "12628", "from": "CSMT", "to": "SBC", "dep": "07:15", "arr": "21:45", "dur": 870, "days": "Daily", "fare": 1450.0},
            # Bengaluru to Pune
            {"train": "12627", "from": "SBC", "to": "PUNE", "dep": "07:00", "arr": "19:30", "dur": 750, "days": "Daily", "fare": 1150.0},
            # Pune to Delhi (Leaves 21:00, arrives 14:00 next day)
            {"train": "12137", "from": "PUNE", "to": "NDLS", "dep": "21:00", "arr": "14:00", "dur": 1020, "days": "Daily", "fare": 1720.0},
            # Delhi to Pune
            {"train": "12137", "from": "NDLS", "to": "PUNE", "dep": "15:30", "arr": "08:30", "dur": 1020, "days": "Daily", "fare": 1720.0},
            # Chennai to Delhi (Tamil Nadu Link)
            {"train": "12627", "from": "MAS", "to": "NDLS", "dep": "22:00", "arr": "06:30", "dur": 1950, "days": "Daily", "fare": 2150.0},
            # Delhi to Chennai
            {"train": "12628", "from": "NDLS", "to": "MAS", "dep": "22:30", "arr": "07:10", "dur": 1960, "days": "Daily", "fare": 2150.0},
            # Direct Karnataka Express link: Bengaluru to Delhi
            {"train": "12627", "from": "SBC", "to": "NDLS", "dep": "19:20", "arr": "09:00", "dur": 2260, "days": "Daily", "fare": 2650.0},
            # Direct Karnataka Express link: Delhi to Bengaluru
            {"train": "12628", "from": "NDLS", "to": "SBC", "dep": "20:00", "arr": "09:40", "dur": 2260, "days": "Daily", "fare": 2650.0},
            # Mumbai to Varanasi
            {"train": "12560", "from": "CSMT", "to": "BSB", "dep": "06:00", "arr": "04:30", "dur": 1350, "days": "Daily", "fare": 1350.0},
            # Varanasi to Mumbai
            {"train": "12560", "from": "BSB", "to": "CSMT", "dep": "14:00", "arr": "12:30", "dur": 1350, "days": "Daily", "fare": 1350.0},
            # Direct Mumbai to Kolkata (Howrah)
            {"train": "12261", "from": "CSMT", "to": "HWH", "dep": "17:15", "arr": "20:40", "dur": 1645, "days": "Daily", "fare": 1950.0},
            # Kolkata (Howrah) to Mumbai
            {"train": "12261", "from": "HWH", "to": "CSMT", "dep": "21:00", "arr": "00:25", "dur": 1645, "days": "Daily", "fare": 1950.0},
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

import os
import sys

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import engine, Base
from backend.app.models import *
from backend.seed_data import seed_database

def init_db():
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")
    print("Seeding initial railway data and demo accounts...")
    seed_database()
    print("RailMate database initialization complete!")

if __name__ == "__main__":
    init_db()

import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.routers import (
    auth, chat, routes, stations, bookings, notifications, admin, support
)
from backend.app.models.station import Station

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("railmate")

app = FastAPI(
    title="RailMate — AI-Powered Multi-Agent Railway Travel Assistant API",
    description="Comprehensive backend API for RailMate multi-agent railway journey planning, NetworkX graph routing, booking simulation, and conversational travel assistant.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(routes.router)
app.include_router(stations.router)
app.include_router(bookings.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(support.router)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    # Check if database needs automatic demo seed
    db = SessionLocal()
    try:
        station_count = db.query(Station).count()
        if station_count == 0:
            logger.info("Database is empty. Automatically seeding demo stations, trains, schedules, and accounts...")
            from backend.seed_data import seed_database
            seed_database(db)
            logger.info("Demo database seeded successfully.")
    except Exception as e:
        logger.error(f"Error during startup seeding check: {e}")
    finally:
        db.close()

@app.get("/", tags=["Health"])
def root():
    return {
        "app": "RailMate API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "mode": settings.RAILWAY_PROVIDER.upper(),
        "ai_provider": settings.AI_PROVIDER
    }

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "environment": settings.ENVIRONMENT
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    APP_NAME: str = "RailMate"
    SECRET_KEY: str = "railmate_super_secret_jwt_key_change_in_production_987654321"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database Configuration - defaults to local SQLite if MySQL URL is not set
    DATABASE_URL: str = "sqlite:///./railmate.db"

    # AI Configuration
    AI_PROVIDER: str = "gemini"  # "gemini", "openrouter", or "mock"
    AI_MODEL: str = "gemini-3.5-flash"
    GEMINI_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None

    # Railway Provider Configuration
    RAILWAY_PROVIDER: str = "live"  # "demo" or "live"
    RAILWAY_API_BASE_URL: Optional[str] = "https://irctc-indian-railway-pnr-status.p.rapidapi.com"
    RAILWAY_API_KEY: Optional[str] = None
    RAILWAY_API_HOST: Optional[str] = "irctc-indian-railway-pnr-status.p.rapidapi.com"

    # Frontend Origin for CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # Optional Email Settings
    EMAIL_PROVIDER_API_KEY: Optional[str] = None
    EMAIL_FROM_ADDRESS: str = "notifications@railmate.internal"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

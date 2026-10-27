import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicHelp"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./civichelp.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # AI Configuration
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"
    GEMINI_ENABLED: bool = True
    GEMINI_TIMEOUT_SECONDS: int = 15
    GEMINI_MAX_OUTPUT_TOKENS: int = 1024

    # Authentication & JWT Configuration
    JWT_SECRET_KEY: str = "civichelp-production-secret-key-32chars-min-secure-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    ADMIN_INITIAL_EMAIL: str = "admin@civichelp.gov.in"
    ADMIN_INITIAL_PASSWORD: str = "CivicHelp@Admin2026!"

    # Public Intelligence & News Configuration
    NEWS_PROVIDER: str = "CIVIC_TELEMETRY"
    NEWS_API_KEY: str = ""
    NEWS_ENABLED: bool = True
    NEWS_CACHE_TTL_SECONDS: int = 300

    # Demo & Synthetic Data Settings
    DEMO_MODE: bool = True
    DEFAULT_DEMO_COUNT: int = 450

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

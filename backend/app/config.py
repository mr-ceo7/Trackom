"""Trackom SaaS Backend - Configuration."""

from pydantic_settings import BaseSettings
from functools import lru_cache



class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "Trackom API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"


    # Database
    DATABASE_URL: str = "postgresql+asyncpg://trackom:trackom_secret@localhost:5432/trackom_db"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # SMS Gateway
    SMS_GATEWAY_API_KEY: str = ""
    SMS_GATEWAY_URL: str = ""

    # AdvantaSMS Gateway
    ADVANTA_API_KEY: str = "REDACTED_ADVANTA_API_KEY"
    ADVANTA_PARTNER_ID: str = "2872"
    ADVANTA_BASE_URL: str = "https://quicksms.advantasms.com"
    ADVANTA_DEFAULT_SHORTCODE: str = "ARVOCAP"

    # M-Pesa Integration
    MPESA_CONSUMER_KEY: str = "REDACTED_MPESA_CONSUMER_KEY"
    MPESA_CONSUMER_SECRET: str = "REDACTED_MPESA_CONSUMER_SECRET"
    MPESA_SHORTCODE: str = "174379"
    MPESA_PASSKEY: str = "REDACTED_MPESA_PASSKEY"
    MPESA_CALLBACK_URL: str = "REDACTED_MPESA_CALLBACK_URL"
    MPESA_ENV: str = "sandbox"
    MPESA_CALLBACK_SECRET: str = "REDACTED_MPESA_CALLBACK_SECRET"

    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()

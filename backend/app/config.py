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
    ADVANTA_API_KEY: str = "7218b12ef227065935349cc18da61ea7"
    ADVANTA_PARTNER_ID: str = "2872"
    ADVANTA_BASE_URL: str = "https://quicksms.advantasms.com"
    ADVANTA_DEFAULT_SHORTCODE: str = "ARVOCAP"

    # Google Auth
    GOOGLE_CLIENT_ID: str = "924177133255-g3duhln1pfflnr50qqg3le5mh3jo59pa.apps.googleusercontent.com"

    # M-Pesa Integration
    MPESA_CONSUMER_KEY: str = "5KqSGxWCdvtyvG5NaDRWQcv45AzXllgX9EaG0nPK5GmOSoNJ"
    MPESA_CONSUMER_SECRET: str = "MmMJD2thRvITFb39dr2WqXeJHMJETFIJp2DsZ5NXtfkpw2UDDIEpQf9i9crnaAMs"
    MPESA_SHORTCODE: str = "174379"
    MPESA_PASSKEY: str = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    MPESA_CALLBACK_URL: str = "https://unfenestral-scratchily-lester.ngrok-free.dev/api/v1/wallet/mpesa/callback"
    MPESA_ENV: str = "sandbox"
    MPESA_CALLBACK_SECRET: str = "11e8d7aa90384eab766cd7f624f3c10ae198c8de0abb46c5540978c7e1f6b14d"

    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()

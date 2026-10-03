from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_DB = (_BACKEND_DIR / "edupulse.db").as_posix()


class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{_DEFAULT_DB}"
    SECRET_KEY: str = "edupulse-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    MOCK_EMAIL: bool = False
    GMAIL_CLIENT_ID: str = ""
    GMAIL_CLIENT_SECRET: str = ""
    GMAIL_REFRESH_TOKEN: str = ""
    GMAIL_SENDER_EMAIL: str = ""
    GMAIL_APP_PASSWORD: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.DATABASE_URL in ("sqlite:///./edupulse.db", "sqlite:///edupulse.db"):
            self.DATABASE_URL = f"sqlite:///{_DEFAULT_DB}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

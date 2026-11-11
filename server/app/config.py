import os
import re
import secrets
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent

load_dotenv(ROOT / ".env")


def db_url(raw: str | None = None) -> str:
    url = raw or os.getenv("DB_POSTGRES_URL", "")
    if not url:
        raise RuntimeError(
            "DB_POSTGRES_URL is not configured. Add it to server/.env or the Render environment."
        )
    url = re.sub(r"^postgres(ql)?://", "postgresql+asyncpg://", url)
    return url.replace("sslmode=", "ssl=")


@dataclass(frozen=True)
class Settings:
    db_url: str = field(default_factory=db_url)
    secret: str = field(
        default_factory=lambda: os.getenv("CMMS_SECRET") or secrets.token_urlsafe(48)
    )
    session_hours: int = field(
        default_factory=lambda: int(os.getenv("CMMS_SESSION_HOURS", "12"))
    )
    cookie_secure: bool = field(
        default_factory=lambda: os.getenv("CMMS_COOKIE_SECURE", "0") == "1"
    )
    cookie_name: str = "cmms_session"
    max_login_failures: int = 5
    lockout_seconds: int = 300


settings = Settings()

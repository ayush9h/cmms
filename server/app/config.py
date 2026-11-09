import os
import secrets
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    data_path: Path = field(default_factory=lambda: Path(os.getenv("CMMS_DATA", ROOT / "data" / "ASSET_MASTER_filled_sample_data.xlsx")))
    users_path: Path = field(default_factory=lambda: Path(os.getenv("CMMS_USERS", ROOT / "data" / "users.json")))
    secret: str = field(default_factory=lambda: os.getenv("CMMS_SECRET") or secrets.token_urlsafe(48))
    session_hours: int = field(default_factory=lambda: int(os.getenv("CMMS_SESSION_HOURS", "12")))
    cookie_secure: bool = field(default_factory=lambda: os.getenv("CMMS_COOKIE_SECURE", "0") == "1")
    cookie_name: str = "cmms_session"
    max_login_failures: int = 5
    lockout_seconds: int = 300


settings = Settings()

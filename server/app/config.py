import re
import secrets
from pathlib import Path
from typing import Annotated

from pydantic import Field, ValidationError, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        frozen=True,
    )

    db_url: str = Field(validation_alias="DB_POSTGRES_URL", min_length=1)
    secret: str = Field(
        default_factory=lambda: secrets.token_urlsafe(48),
        validation_alias="CMMS_SECRET",
        min_length=1,
    )
    session_hours: int = Field(12, validation_alias="CMMS_SESSION_HOURS")
    cookie_secure: bool = Field(False, validation_alias="CMMS_COOKIE_SECURE")
    # Comma-separated browser origins; empty means no cross-origin access.
    allowed_origins: Annotated[tuple[str, ...], NoDecode] = Field(
        (), validation_alias="CMMS_ALLOWED_ORIGINS"
    )
    cookie_name: str = "cmms_session"
    max_login_failures: int = 5
    lockout_seconds: int = 300

    @model_validator(mode="before")
    @classmethod
    def blank_means_unset(cls, data):
        # A key left empty in .env falls back to the default, as `os.getenv(k) or x` did.
        if isinstance(data, dict):
            return {k: v for k, v in data.items() if v != ""}
        return data

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, v):
        # NoDecode above keeps pydantic-settings from demanding JSON for this field.
        if isinstance(v, str):
            return tuple(o.strip() for o in v.split(",") if o.strip())
        return v

    @field_validator("db_url", mode="after")
    @classmethod
    def asyncpg_driver(cls, v: str) -> str:
        url = re.sub(r"^postgres(ql)?://", "postgresql+asyncpg://", v)
        return url.replace("sslmode=", "ssl=")


try:
    settings = Settings()
except ValidationError as e:
    raise RuntimeError(
        f"Configuration is incomplete. Set these in server/.env or the deployment environment:\n{e}"
    ) from e

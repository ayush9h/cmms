import datetime as dt

from sqlalchemy import DateTime, Text
from sqlmodel import Field, SQLModel


class PpcEntry(SQLModel, table=True):
    __tablename__ = "ppc_entries"

    id: int | None = Field(default=None, primary_key=True)
    date_from: dt.date = Field(index=True)
    date_to: dt.date
    running: str = Field(default="{}", sa_type=Text)
    asset_id: str = Field(foreign_key="assets.id", index=True, max_length=20)
    shift_minutes: int
    short_breaks: int = 0
    short_break_minutes: int = 0
    meal_breaks: int = 0
    meal_break_minutes: int = 0
    ideal_rate: float
    entered_by: str = Field(default="", max_length=120)
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.UTC), sa_type=DateTime(timezone=True))

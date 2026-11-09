import datetime as dt

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class Breakdown(SQLModel, table=True):
    __tablename__ = "breakdowns"

    id: int | None = Field(default=None, primary_key=True)
    date: dt.date = Field(index=True)
    asset_id: str = Field(foreign_key="assets.id", index=True, max_length=20)
    category: str = Field(max_length=40)
    problem: str = Field(max_length=120)
    start: dt.time
    stop: dt.time
    diagnose: int
    spares: int
    wrench: int
    remarks: str = Field(default="", max_length=500)
    action: str = Field(default="", max_length=500)
    entered_by: str = Field(default="", max_length=120)
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.UTC), sa_type=DateTime(timezone=True))

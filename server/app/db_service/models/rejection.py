import datetime as dt

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class Rejection(SQLModel, table=True):
    __tablename__ = "rejections"

    id: int | None = Field(default=None, primary_key=True)
    date: dt.date = Field(index=True)
    shift: str = Field(max_length=1)
    asset_id: str = Field(foreign_key="assets.id", index=True, max_length=20)
    part: str = Field(max_length=60)
    defect: str = Field(max_length=40)
    disposition: str = Field(max_length=10)
    entered_by: str = Field(default="", max_length=120)
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(dt.UTC), sa_type=DateTime(timezone=True))

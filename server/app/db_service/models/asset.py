import datetime as dt

from sqlmodel import Field, SQLModel


class Asset(SQLModel, table=True):
    __tablename__ = "assets"

    id: str = Field(primary_key=True, max_length=20)
    sno: int
    name: str = Field(max_length=80)
    area: str = Field(index=True, max_length=60)
    oem: str = Field(max_length=60)
    installed: dt.date
    application: str = Field(max_length=60)
    cls: str = Field(max_length=40)
    run_rate: float | None = None

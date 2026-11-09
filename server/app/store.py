import asyncio
from datetime import date, datetime, time, timedelta

import pandas as pd
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from .db_service.db import async_session_maker, engine
from .db_service.models import Asset, Breakdown, Rejection

PHASES = ("diagnose", "spares", "wrench")

SHOPS = ("Machine Shop", "PDC", "Utility")
SHIFTS = ("A", "B", "C")
DISPOSITIONS = ("Scrap", "Rework")
DEFECTS = (
    "Porosity",
    "Blow hole",
    "Cold shut",
    "Crack",
    "Flash",
    "Dimensional",
    "Surface finish",
    "Burr",
    "Thread damage",
    "Dent / handling damage",
    "Other",
)


def _clock(v):
    return v.strftime("%H:%M") if isinstance(v, time) else str(v)[:5]


def _load(conn):
    return tuple(pd.read_sql(select(m).order_by(m.id), conn) for m in (Asset, Breakdown, Rejection))


class Store:
    def __init__(self):
        self._lock = asyncio.Lock()

    async def refresh(self):
        async with engine.connect() as conn:
            a, b, r = await conn.run_sync(_load)
        a["installed"] = pd.to_datetime(a["installed"])
        names = a[["id", "area", "name"]]

        b = b.drop(columns="id").rename(columns={"asset_id": "id"})
        b["date"] = pd.to_datetime(b["date"])
        b["start"] = b["start"].map(_clock)
        b["stop"] = b["stop"].map(_clock)
        start = pd.to_timedelta(b["start"] + ":00")
        stop = pd.to_timedelta(b["stop"] + ":00")
        b["minutes"] = (((stop - start).dt.total_seconds() / 60) % 1440).astype(int)
        b = b.merge(names, on="id", how="left")
        b["month"] = b["date"].dt.strftime("%Y-%m")

        r = r.drop(columns="id").rename(columns={"asset_id": "id"}).merge(names, on="id", how="left")
        r["date"] = pd.to_datetime(r["date"])

        first = b["date"].min() if len(b) else pd.Timestamp.today().normalize()
        end = (b["date"].max() if len(b) else first) + pd.offsets.MonthEnd(0)
        a["age"] = ((end - a["installed"]).dt.days / 365.25).clip(lower=0).round(1)
        cols = ["date", "month", "id", "name", "area", "category", "problem", "start", "stop", "minutes", *PHASES, "remarks", "action", "entered_by"]
        self.assets, self.breakdowns, self.end = a, b[cols].reset_index(drop=True), end
        self.start = first.replace(day=1)
        self.rejections = r[["date", "shift", "id", "name", "area", "part", "defect", "disposition", "entered_by"]].reset_index(drop=True)

    def next_asset_id(self):
        nums = self.assets["id"].str.extract(r"(\d+)$")[0].dropna().astype(int)
        return f"AST-{(nums.max() if len(nums) else 0) + 1:03d}"

    def has_asset(self, asset_id):
        return asset_id.upper() in set(self.assets["id"].str.upper())

    def asset(self, asset_id):
        rows = self.assets[self.assets["id"] == asset_id]
        return None if rows.empty else rows.iloc[0]

    async def _insert(self, row):
        async with async_session_maker() as session:
            session.add(row)
            await session.commit()
        await self.refresh()

    async def add_asset(self, record: dict):
        async with self._lock:
            if self.has_asset(record["id"]):
                raise KeyError(record["id"])
            sno = int(self.assets["sno"].max()) + 1 if len(self.assets) else 1
            try:
                await self._insert(Asset.model_validate({**record, "sno": sno}))
            except IntegrityError as e:
                raise KeyError(record["id"]) from e

    async def add_breakdown(self, record: dict):
        async with self._lock:
            await self._insert(Breakdown(**record))

    async def add_rejection(self, record: dict):
        async with self._lock:
            await self._insert(Rejection(**record))


def stop_time(start: time, minutes: int):
    return (datetime.combine(date.min, start) + timedelta(minutes=minutes)).time()

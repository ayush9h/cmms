import asyncio
import json
from datetime import date, datetime, time, timedelta

import pandas as pd
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from .db_service.db import async_session_maker, engine
from .db_service.models import Asset, Breakdown, PpcEntry, Rejection

PHASES = ("diagnose", "spares", "wrench")

SHOPS = ("Machine Shop", "PDC", "Utility")
CLASSES = ("Material Handling", "Production", "Utility")
CATEGORIES = ("Electrical", "Electronics", "Hydraulic", "Mechanical", "Pneumatics", "Utility")
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


CAUSES = (
    ("rej_production", "Production"),
    ("rej_die", "Die Maintenance"),
    ("rej_machine", "Machine Maintenance"),
    ("rej_quality", "Quality"),
    ("rej_engineering", "Engineering"),
    ("rej_incoming", "Incoming Material"),
)


def shift_of(t: time) -> str:
    return "A" if 6 <= t.hour < 14 else "B" if 14 <= t.hour < 22 else "C"


def clock(v):
    return v.strftime("%H:%M") if isinstance(v, time) else str(v)[:5]


def load_frames(conn):
    return tuple(pd.read_sql(select(m).order_by(m.id), conn) for m in (Asset, Breakdown, Rejection, PpcEntry))


class Store:
    def __init__(self):
        self.lock = asyncio.Lock()

    async def refresh(self):
        async with engine.connect() as conn:
            a, b, r, p = await conn.run_sync(load_frames)
        a["installed"] = pd.to_datetime(a["installed"])
        names = a[["id", "area", "name"]]

        b = b.rename(columns={"id": "entry_id", "asset_id": "id"})
        b["date"] = pd.to_datetime(b["date"])
        b["start"] = b["start"].map(clock)
        b["stop"] = b["stop"].map(clock)
        start = pd.to_timedelta(b["start"] + ":00")
        stop = pd.to_timedelta(b["stop"] + ":00")
        b["minutes"] = (((stop - start).dt.total_seconds() / 60) % 1440).astype(int)
        b = b.merge(names, on="id", how="left")
        b["month"] = b["date"].dt.strftime("%Y-%m")

        r = r.rename(columns={"id": "entry_id", "asset_id": "id"}).merge(names, on="id", how="left")
        r["date"] = pd.to_datetime(r["date"])
        r["month"] = r["date"].dt.strftime("%Y-%m")
        r["rejected"] = r[[k for k, _ in CAUSES]].sum(axis=1).astype(int)

        first = b["date"].min() if len(b) else pd.Timestamp.today().normalize()
        end = (b["date"].max() if len(b) else first) + pd.offsets.MonthEnd(0)
        a["age"] = ((end - a["installed"]).dt.days / 365.25).clip(lower=0).round(1)
        cols = ["entry_id", "date", "month", "shift", "id", "name", "area", "category", "problem", "start", "stop", "minutes", *PHASES, "remarks", "action", "entered_by"]
        self.assets, self.breakdowns, self.end = a, b[cols].reset_index(drop=True), end
        self.start = first.replace(day=1)
        self.rejections = r[["entry_id", "date", "month", "shift", "id", "name", "area", "part", "produced", *(k for k, _ in CAUSES), "rejected", "defect", "disposition", "entered_by"]].reset_index(drop=True)

        p = p.rename(columns={"id": "entry_id", "asset_id": "id"}).merge(names, on="id", how="left")
        p["date"] = p["date_from"] = pd.to_datetime(p["date_from"])
        p["date_to"] = pd.to_datetime(p["date_to"])
        self.ppc_entries = p
        made = r.groupby(["id", "date", "shift"])[["produced", "rejected"]].sum()
        down = b.groupby(["id", "date", "shift"])["minutes"].sum()
        slots = made.join(down, how="outer").fillna(0).reset_index()
        rows = []
        for x in p.to_dict("records"):
            planned = x["shift_minutes"] - x["short_breaks"] * x["short_break_minutes"] - x["meal_breaks"] * x["meal_break_minutes"]
            for slot in slots[(slots["id"] == x["id"]) & slots["date"].between(x["date_from"], x["date_to"])].itertuples():
                stopped = min(int(slot.minutes), planned)
                rows.append({
                    **x,
                    "date": slot.date,
                    "month": slot.date.strftime("%Y-%m"),
                    "shift": slot.shift,
                    "planned": planned,
                    "downtime_minutes": stopped,
                    "operating": planned - stopped,
                    "projected_pieces": round(planned * x["ideal_rate"]),
                    "total_pieces": int(slot.produced),
                    "reject_pieces": int(slot.rejected),
                    "good_pieces": int(slot.produced - slot.rejected),
                })
        derived = ["month", "shift", "planned", "downtime_minutes", "operating", "projected_pieces", "total_pieces", "reject_pieces", "good_pieces"]
        self.ppc = pd.DataFrame(rows, columns=[*p.columns, *derived])

    def next_asset_id(self):
        nums = self.assets["id"].str.extract(r"(\d+)$")[0].dropna().astype(int)
        return f"AST-{(nums.max() if len(nums) else 0) + 1:03d}"

    def has_asset(self, asset_id):
        return asset_id.upper() in set(self.assets["id"].str.upper())

    def asset(self, asset_id):
        rows = self.assets[self.assets["id"] == asset_id]
        return None if rows.empty else rows.iloc[0]

    async def insert(self, row):
        async with async_session_maker() as session:
            session.add(row)
            await session.commit()
        await self.refresh()

    async def add_asset(self, record: dict):
        async with self.lock:
            if self.has_asset(record["id"]):
                raise KeyError(record["id"])
            sno = int(self.assets["sno"].max()) + 1 if len(self.assets) else 1
            try:
                await self.insert(Asset.model_validate({**record, "sno": sno}))
            except IntegrityError as e:
                raise KeyError(record["id"]) from e

    async def add_breakdown(self, record: dict):
        async with self.lock:
            await self.insert(Breakdown(**record))

    async def add_rejection(self, record: dict):
        async with self.lock:
            await self.insert(Rejection(**record))

    async def add_ppc(self, record: dict):
        async with self.lock:
            await self.insert(PpcEntry(**record))

    async def update(self, model, entry_id: int, record: dict):
        async with self.lock:
            async with async_session_maker() as session:
                row = await session.get(model, entry_id)
                if row is None:
                    raise KeyError(entry_id)
                for key, value in record.items():
                    setattr(row, key, value)
                await session.commit()
            await self.refresh()


def stop_time(start: time, minutes: int):
    return (datetime.combine(date.min, start) + timedelta(minutes=minutes)).time()

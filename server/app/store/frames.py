"""Shapes the four raw tables into the frames every read endpoint queries."""

import pandas as pd
from sqlalchemy import select

from ..db_service.models import Asset, Breakdown, PpcEntry, Rejection
from .clock import clock
from .constants import CAUSE_KEYS, PHASES

BREAKDOWN_COLS = [
    "entry_id",
    "date",
    "month",
    "shift",
    "id",
    "name",
    "area",
    "category",
    "problem",
    "start",
    "stop",
    "minutes",
    *PHASES,
    "remarks",
    "action",
    "entered_by",
]
REJECTION_COLS = [
    "entry_id",
    "date",
    "month",
    "shift",
    "id",
    "name",
    "area",
    "part",
    "produced",
    *CAUSE_KEYS,
    "rejected",
    "defect",
    "disposition",
    "entered_by",
]
PPC_DERIVED = [
    "month",
    "shift",
    "planned",
    "downtime_minutes",
    "operating",
    "projected_pieces",
    "total_pieces",
    "reject_pieces",
    "good_pieces",
]


def load_frames(conn):
    return tuple(
        pd.read_sql(select(m).order_by(m.id), conn)
        for m in (Asset, Breakdown, Rejection, PpcEntry)
    )


def prepare_assets(a):
    a["installed"] = pd.to_datetime(a["installed"])
    return a


def prepare_breakdowns(b, names):
    b = b.rename(columns={"id": "entry_id", "asset_id": "id"})
    b["date"] = pd.to_datetime(b["date"])
    b["start"] = b["start"].map(clock)
    b["stop"] = b["stop"].map(clock)
    start = pd.to_timedelta(b["start"] + ":00")
    stop = pd.to_timedelta(b["stop"] + ":00")
    b["minutes"] = (((stop - start).dt.total_seconds() / 60) % 1440).astype(int)
    b = b.merge(names, on="id", how="left")
    b["month"] = b["date"].dt.strftime("%Y-%m")
    return b


def prepare_rejections(r, names):
    r = r.rename(columns={"id": "entry_id", "asset_id": "id"}).merge(
        names, on="id", how="left"
    )
    r["date"] = pd.to_datetime(r["date"])
    r["month"] = r["date"].dt.strftime("%Y-%m")
    r["rejected"] = r[CAUSE_KEYS].sum(axis=1).astype(int)
    return r


def period(b):
    """First logged day and the month-end of the last, falling back to today on an empty log."""
    first = b["date"].min() if len(b) else pd.Timestamp.today().normalize()
    return first, (b["date"].max() if len(b) else first) + pd.offsets.MonthEnd(0)


def age(a, end):
    return ((end - a["installed"]).dt.days / 365.25).clip(lower=0).round(1)


def prepare_ppc(p, names):
    p = p.rename(columns={"id": "entry_id", "asset_id": "id"}).merge(
        names, on="id", how="left"
    )
    p["date"] = p["date_from"] = pd.to_datetime(p["date_from"])
    p["date_to"] = pd.to_datetime(p["date_to"])
    return p


def ppc_slots(p, b, r):
    """One row per PPC day and shift, carrying the OEE inputs for that slot."""
    made = r.groupby(["id", "date", "shift"])[["produced", "rejected"]].sum()
    down = b.groupby(["id", "date", "shift"])["minutes"].sum()
    slots = made.join(down, how="outer").fillna(0).reset_index()
    rows = []
    for x in p.to_dict("records"):
        planned = (
            x["shift_minutes"]
            - x["short_breaks"] * x["short_break_minutes"]
            - x["meal_breaks"] * x["meal_break_minutes"]
        )
        for slot in slots[
            (slots["id"] == x["id"])
            & slots["date"].between(x["date_from"], x["date_to"])
        ].itertuples():
            stopped = min(int(slot.minutes), planned)
            rows.append(
                {
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
                }
            )
    return pd.DataFrame(rows, columns=[*p.columns, *PPC_DERIVED])

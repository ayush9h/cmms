import json

import pandas as pd

from .store import CATEGORIES, CAUSES, CLASSES, DEFECTS, DISPOSITIONS, PHASES, SHIFTS, SHOPS, Store

DIMS = {"area": "area", "category": "category", "month": "month", "asset": "id"}


def hours(minutes):
    return round(float(minutes) / 60, 1)


def pick(df, col, value):
    if not value:
        return df
    return df[df[col].isin(value)] if isinstance(value, list) else df[df[col] == value]


def scope(df, f, skip=()):
    for key, col in DIMS.items():
        if key not in skip:
            df = pick(df, col, f.get(key))
    return df


def assets_in(store: Store, f):
    return pick(pick(store.assets, "area", f.get("area")), "id", f.get("asset"))


def months(store: Store):
    return pd.period_range(store.start, store.end, freq="M").strftime("%Y-%m")


def span_hours(store: Store, month=None):
    today = pd.Timestamp.today().normalize()
    if month:
        period = pd.Period(month)
        first, last = period.start_time, period.end_time.normalize()
    else:
        first, last = store.start, store.end
    return max(1, (min(last, today) - first).days + 1) * 24


def mtbf_hours(store: Store, f, minutes, events):
    if not events:
        return None
    return round((len(assets_in(store, f)) * span_hours(store, f.get("month")) - minutes / 60) / events, 1)


def dashboard(store: Store, f):
    bd = store.breakdowns
    df = scope(bd, f)
    n = len(df)
    by_month = scope(bd, f, ("month",)).groupby("month").agg(minutes=("minutes", "sum"), events=("id", "size"))
    by_month = by_month.reindex(months(store), fill_value=0)
    cats = scope(bd, f, ("category",)).groupby("category")["minutes"].sum()
    return {
        "period": {"start": store.start.strftime("%Y-%m-%d"), "end": store.end.strftime("%Y-%m-%d")},
        "kpi": {
            "downtime_h": hours(df["minutes"].sum()),
            "events": n,
            "mttr_min": round(df["minutes"].mean()) if n else None,
            "mtbf_h": mtbf_hours(store, f, df["minutes"].sum(), n),
            "assets_hit": int(df["id"].nunique()),
            "assets_total": len(assets_in(store, f)),
            "phases": {k: int(df[k].sum()) for k in PHASES},
        },
        "monthly": [
            {
                "month": m,
                "downtime_h": hours(r.minutes),
                "events": int(r.events),
                "mttr_min": round(r.minutes / r.events) if r.events else None,
                "mtbf_h": mtbf_hours(store, {**f, "month": m}, r.minutes, int(r.events)),
            }
            for m, r in by_month.iterrows()
        ],
        "categories": [{"name": c, "minutes": int(m)} for c, m in cats.items()],
    }


DAYS_SHOWN = 31


def oee_figures(rows):
    planned, operating, down = (int(rows[c].sum()) for c in ("planned", "operating", "downtime_minutes"))
    total, good, ideal = int(rows["total_pieces"].sum()), int(rows["good_pieces"].sum()), int(rows["projected_pieces"].sum())
    a = operating / planned if planned else None
    p = min(1.0, total / ideal) if ideal and total else None
    q = good / total if total else None
    overall = a * p * q if None not in (a, p, q) else None
    return {
        **{k: None if v is None else round(v * 100, 1) for k, v in (("availability", a), ("performance", p), ("quality", q), ("oee", overall))},
        "entries": len(rows),
        "planned_min": planned,
        "operating_min": operating,
        "downtime_min": down,
        "projected_pieces": ideal,
        "total_pieces": total,
        "good_pieces": good,
        "reject_pieces": total - good,
    }


def oee(store: Store, f):
    rows = pick(scope(store.ppc, f, ("category", "month")), "shift", f.get("shift"))
    now = pick(rows, "month", f.get("month"))
    first = min([store.start, *rows["date"]])
    last = max([store.end, *rows["date"]])
    days = sorted(now["date"].unique())[-DAYS_SHOWN:]
    return {
        "kpi": oee_figures(now),
        "monthly": [{"month": m, **oee_figures(rows[rows["month"] == m])} for m in pd.period_range(first, last, freq="M").strftime("%Y-%m")],
        "daily": [{"date": pd.Timestamp(d).strftime("%Y-%m-%d"), **oee_figures(now[now["date"] == d])} for d in days],
        "shifts": [{"shift": s, **oee_figures(now[now["shift"] == s])} for s in SHIFTS],
    }


def ppc_find(store: Store, asset_id, date_from, date_to):
    p = store.ppc_entries
    hit = p[(p["id"] == asset_id) & (p["date_from"] <= pd.Timestamp(date_to)) & (p["date_to"] >= pd.Timestamp(date_from))]
    if hit.empty:
        return None
    r = hit.iloc[0]
    return {
        "entry_id": int(r.entry_id),
        "date_from": r.date_from.strftime("%Y-%m-%d"),
        "date_to": r.date_to.strftime("%Y-%m-%d"),
        "running": json.loads(r.running),
        "shift_hours": r.shift_minutes / 60,
        **{k: int(r[k]) for k in ("short_breaks", "short_break_minutes", "meal_breaks", "meal_break_minutes")},
        "ideal_rate": float(r.ideal_rate),
    }


def search(df, q, columns):
    q = (q or "").strip().lower()
    if not q:
        return df
    hit = pd.Series(False, index=df.index)
    for col in columns:
        hit |= df[col].fillna("").astype(str).str.lower().str.contains(q, regex=False)
    return df[hit]


def paginate(df, page, size):
    total = len(df)
    pages = max(1, -(-total // size))
    page = min(max(1, page), pages)
    return df.iloc[(page - 1) * size : page * size], {"total": total, "page": page, "pages": pages, "page_size": size}


def asset_page(store: Store, q=None, area=None, cls=None, page=1, size=25):
    stats = store.breakdowns.groupby("id").agg(minutes=("minutes", "sum"), events=("id", "size"), last=("date", "max"))
    rows = store.assets.join(stats, on="id").fillna({"minutes": 0, "events": 0}).sort_values("id")
    rows = pick(pick(rows, "area", area), "cls", cls)
    rows = search(rows, q, ["id", "name", "area", "oem", "application"])
    chunk, meta = paginate(rows, page, size)
    items = [
        {
            "id": r.id,
            "name": r.name,
            "area": r.area,
            "oem": r.oem,
            "installed": r.installed.strftime("%Y-%m-%d"),
            "age": r.age,
            "application": r.application,
            "cls": r.cls,
            "downtime_h": hours(r.minutes),
            "events": int(r.events),
            "last_bd": r.last.strftime("%Y-%m-%d") if pd.notna(r.last) else None,
        }
        for r in chunk.itertuples()
    ]
    return {"items": items, **meta, "all": len(store.assets)}


def breakdown_rows(store: Store, q=None, area=None, category=None, asset=None, date_from=None, date_to=None):
    df = pick(pick(pick(store.breakdowns, "area", area), "category", category), "id", asset)
    if date_from:
        df = df[df["date"] >= pd.Timestamp(date_from)]
    if date_to:
        df = df[df["date"] <= pd.Timestamp(date_to)]
    df = search(df, q, ["id", "name", "problem", "remarks", "action", "entered_by"])
    return df.sort_values(["date", "start"], ascending=False, kind="stable")


def breakdown_page(store: Store, q=None, area=None, category=None, asset=None, date_from=None, date_to=None, page=1, size=25):
    df = breakdown_rows(store, q, area, category, asset, date_from, date_to)
    chunk, meta = paginate(df, page, size)
    return {"items": [breakdown_item(r) for r in chunk.itertuples()], **meta, "all": len(store.breakdowns)}


def breakdown_item(r):
    return {
        "entry_id": int(r.entry_id),
        "date": r.date.strftime("%Y-%m-%d"),
        "shift": r.shift,
        "id": r.id,
        "name": r.name,
        "area": r.area,
        "category": r.category,
        "problem": r.problem,
        "start": r.start,
        "stop": r.stop,
        "minutes": int(r.minutes),
        **{k: int(getattr(r, k)) for k in PHASES},
        "description": r.remarks,
        "action": r.action,
        "entered_by": r.entered_by,
    }


def entry(df, entry_id, item):
    rows = df[df["entry_id"] == entry_id]
    return None if rows.empty else item(next(rows.itertuples()))


def options(store: Store):
    bd = store.breakdowns
    return {
        "area": list(SHOPS),
        "cls": list(CLASSES),
        "application": sorted(store.assets["application"].dropna().unique()),
        "category": list(CATEGORIES),
        "month": sorted(bd["month"].unique()),
        "problem": bd["problem"][bd["problem"] != ""].value_counts().index.tolist(),
        "asset": [{"id": r.id, "name": r.name, "area": r.area, "run_rate": None if pd.isna(r.run_rate) else r.run_rate} for r in store.assets.itertuples()],
        "defect": list(DEFECTS),
        "shift": list(SHIFTS),
        "disposition": list(DISPOSITIONS),
        "cause": [{"key": key, "label": label} for key, label in CAUSES],
    }


def rejection_rows(store: Store, q=None, area=None, asset=None, defect=None, disposition=None):
    df = pick(pick(pick(pick(store.rejections, "area", area), "id", asset), "defect", defect), "disposition", disposition)
    df = search(df, q, ["id", "name", "part", "defect", "entered_by"])
    return df.iloc[::-1].sort_values("date", ascending=False, kind="stable")


def rejection_page(store: Store, q=None, area=None, asset=None, defect=None, disposition=None, page=1, size=25):
    df = rejection_rows(store, q, area, asset, defect, disposition)
    chunk, meta = paginate(df, page, size)
    return {"items": [rejection_item(r) for r in chunk.itertuples()], **meta, "all": len(store.rejections)}


def rejection_item(r):
    return {
        "entry_id": int(r.entry_id),
        "date": r.date.strftime("%Y-%m-%d"),
        "shift": r.shift,
        "id": r.id,
        "name": r.name,
        "area": r.area,
        "part": r.part,
        "produced": int(r.produced),
        **{k: int(getattr(r, k)) for k, _ in CAUSES},
        "rejected": int(r.rejected),
        "rate": round(r.rejected / r.produced * 100, 1) if r.produced else None,
        "defect": r.defect,
        "disposition": r.disposition,
        "entered_by": r.entered_by,
    }

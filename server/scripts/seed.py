import asyncio
from datetime import time

import numpy as np
import pandas as pd
from sqlalchemy import select

from app.config import SEED
from app.db_service.db import async_session_maker, engine
from app.db_service.models import Asset, Breakdown

BREAKDOWN_LIMIT = 50


def _clock(v):
    text = v.strftime("%H:%M") if isinstance(v, time) else str(v)[:5]
    return time.fromisoformat(text)


def _text(v):
    return "" if pd.isna(v) else str(v)


def rows_from_workbook():
    a = pd.read_excel(SEED, sheet_name="ASSET MASTER").rename(columns=str.strip).dropna(subset=["Asset ID"])
    assets = [
        Asset.model_validate({
            "id": r["Asset ID"],
            "sno": int(r["S.No"]),
            "name": r["Asset Name"],
            "area": r["Asset Installation Area"],
            "oem": r["Asset OEM"],
            "installed": pd.Timestamp(r["Asset Installation Date"]).date(),
            "application": r["Asset Application"],
            "cls": r["Asset Cattegory Class"],
        })
        for _, r in a.iterrows()
    ]

    b = pd.read_excel(SEED, sheet_name="BREAKDOWN").rename(columns=str.strip)
    b["date"] = pd.to_datetime(b["Date"], errors="coerce", format="mixed")
    b = b.dropna(subset=["date", "Asset ID"]).sort_values("date", kind="stable").reset_index(drop=True)
    picks = np.unique(np.linspace(0, len(b) - 1, min(BREAKDOWN_LIMIT, len(b))).round().astype(int))
    breakdowns = [
        Breakdown(
            date=r["date"].date(),
            asset_id=r["Asset ID"],
            category=r["BD Category"],
            problem=_text(r["Problem Defination"]),
            start=_clock(r["BD Start Time"]),
            stop=_clock(r["BD Stop Time"]),
            diagnose=int(r["Diagnose Time"]),
            spares=int(r["Spares Arrangement time"]),
            wrench=int(r["Wrench Time"]),
            remarks=_text(r.get("Remarks")),
            action=_text(r.get("Action Taken")),
            entered_by=_text(r.get("Entered By")),
        )
        for _, r in b.iloc[picks].iterrows()
    ]
    return assets, breakdowns


async def main():
    async with async_session_maker() as session:
        if (await session.execute(select(Asset.id).limit(1))).first():
            print("Database already has data; skipping seed.")
            return
        assets, breakdowns = rows_from_workbook()
        session.add_all(assets)
        await session.flush()
        session.add_all(breakdowns)
        await session.commit()
        print(f"Seeded {len(assets)} assets and {len(breakdowns)} breakdowns.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

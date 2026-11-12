import asyncio

from sqlalchemy import update
from sqlalchemy.exc import IntegrityError

from app.db_service.db import async_session_maker, engine
from app.db_service.models import Asset, Breakdown, PpcEntry, Rejection
from app.store import frames


class Store:
    """Every table held as a shaped pandas frame, reloaded in full after each write."""

    def __init__(self):
        self.lock = asyncio.Lock()

    async def refresh(self):
        async with engine.connect() as conn:
            a, b, r, p = await conn.run_sync(frames.load_frames)
        a = frames.prepare_assets(a)
        names = a[["id", "area", "name"]]
        b = frames.prepare_breakdowns(b, names)
        r = frames.prepare_rejections(r, names)
        first, end = frames.period(b)
        a["age"] = frames.age(a, end)

        self.assets, self.start, self.end = a, first.replace(day=1), end
        self.breakdowns = b[frames.BREAKDOWN_COLS].reset_index(drop=True)
        self.rejections = r[frames.REJECTION_COLS].reset_index(drop=True)
        self.ppc_entries = p = frames.prepare_ppc(p, names)
        self.ppc = frames.ppc_slots(p, b, r)

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

    async def update_asset(self, old_id: str, record: dict):
        """Edit an asset. The id is a FK target, so a rename repoints children first."""
        async with self.lock:
            new_id = record["id"]
            if new_id != old_id and self.has_asset(new_id):
                raise KeyError(new_id)
            async with async_session_maker() as session:
                row = await session.get(Asset, old_id)
                if row is None:
                    # not LookupError: KeyError subclasses it, and callers tell them apart
                    raise ValueError(old_id)
                if new_id == old_id:
                    for key, value in record.items():
                        setattr(row, key, value)
                else:
                    # one transaction: add the new row, move children onto it, drop the old
                    session.add(Asset.model_validate({**record, "sno": row.sno}))
                    await session.flush()
                    for model in (Breakdown, Rejection, PpcEntry):
                        await session.execute(
                            update(model)
                            .where(model.asset_id == old_id)
                            .values(asset_id=new_id)
                        )
                    await session.delete(row)
                await session.commit()
            await self.refresh()

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

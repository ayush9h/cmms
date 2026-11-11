from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app import analytics, exports
from app.auth import current_user
from app.db_service.models import Breakdown
from app.routes.deps import PAGE, PAGE_SIZE, SEARCH, download, found, many, store
from app.schemas import BreakdownIn
from app.store import Store, stop_time

router = APIRouter(prefix="/breakdowns")


def breakdown_record(body: BreakdownIn, s: Store):
    if body.date > date.today():
        raise HTTPException(422, "Breakdown date can't be in the future.")
    if s.asset(body.asset_id) is None:
        raise HTTPException(422, f"{body.asset_id} is not in the asset register.")
    start = body.start.replace(second=0, microsecond=0)
    return {
        "date": body.date,
        "asset_id": body.asset_id,
        "shift": body.shift,
        "category": body.category,
        "problem": body.problem,
        "start": start,
        "stop": stop_time(start, body.total),
        "diagnose": body.diagnose,
        "spares": body.spares,
        "wrench": body.wrench,
        "remarks": body.description,
        "action": body.action,
    }


def breakdown_saved(record):
    return {
        "asset_id": record["asset_id"],
        "date": record["date"].isoformat(),
        "start": record["start"].strftime("%H:%M"),
    }


@router.get("")
def list_breakdowns(
    q: str | None = SEARCH,
    area: list[str] = many(),
    category: list[str] = many(),
    asset: list[str] = many(),
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = PAGE,
    page_size: int = PAGE_SIZE,
    s: Store = Depends(store),
    _=Depends(current_user),
):
    if date_from and date_to and date_from > date_to:
        raise HTTPException(422, "The start date must be on or before the end date.")
    return analytics.breakdown_page(
        s, q, area, category, asset, date_from, date_to, page, page_size
    )


@router.get("/export")
def export_breakdowns(
    q: str | None = SEARCH,
    area: list[str] = many(),
    category: list[str] = many(),
    asset: list[str] = many(),
    date_from: date | None = None,
    date_to: date | None = None,
    s: Store = Depends(store),
    _=Depends(current_user),
):
    rows = analytics.breakdown_rows(s, q, area, category, asset, date_from, date_to)
    return download(exports.breakdowns_xlsx(rows), exports.XLSX, "breakdowns", "xlsx")


@router.get("/{entry_id:int}")
def get_breakdown(entry_id: int, s: Store = Depends(store), _=Depends(current_user)):
    return found(analytics.entry(s.breakdowns, entry_id, analytics.breakdown_item))


@router.post("", status_code=201)
async def create_breakdown(
    body: BreakdownIn, s: Store = Depends(store), user=Depends(current_user)
):
    record = breakdown_record(body, s)
    await s.add_breakdown({**record, "entered_by": f"{user['id']} {user['name']}"})
    return breakdown_saved(record)


@router.put("/{entry_id:int}")
async def update_breakdown(
    entry_id: int, body: BreakdownIn, s: Store = Depends(store), _=Depends(current_user)
):
    record = breakdown_record(body, s)
    try:
        await s.update(Breakdown, entry_id, record)
    except KeyError:
        found(None)
    return breakdown_saved(record)

from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app import analytics, exports
from app.auth import current_user
from app.db_service.models import Rejection
from app.routes.deps import PAGE, PAGE_SIZE, SEARCH, download, found, many, store
from app.schemas import RejectionIn
from app.store import CAUSES, Store

router = APIRouter(prefix="/rejections")


def rejection_record(body: RejectionIn, s: Store):
    if body.date > date.today():
        raise HTTPException(422, "Date can't be in the future.")
    if s.asset(body.asset_id) is None:
        raise HTTPException(422, f"{body.asset_id} is not in the asset register.")
    return {
        "date": body.date,
        "shift": body.shift,
        "asset_id": body.asset_id,
        "part": body.part,
        **body.model_dump(include={"produced", *(key for key, _ in CAUSES)}),
        "defect": body.defect if body.rejected else "",
        "disposition": body.disposition if body.rejected else "",
    }


def rejection_saved(body: RejectionIn):
    return {"asset_id": body.asset_id, "date": body.date.isoformat(), "part": body.part}


@router.get("")
def list_rejections(
    q: str | None = SEARCH,
    area: list[str] = many(),
    asset: list[str] = many(),
    defect: list[str] = many(),
    disposition: list[str] = many(),
    page: int = PAGE,
    page_size: int = PAGE_SIZE,
    s: Store = Depends(store),
    _=Depends(current_user),
):
    return analytics.rejection_page(
        s, q, area, asset, defect, disposition, page, page_size
    )


@router.get("/export")
def export_rejections(
    q: str | None = SEARCH,
    area: list[str] = many(),
    asset: list[str] = many(),
    defect: list[str] = many(),
    disposition: list[str] = many(),
    s: Store = Depends(store),
    _=Depends(current_user),
):
    rows = analytics.rejection_rows(s, q, area, asset, defect, disposition)
    return download(exports.rejections_xlsx(rows), exports.XLSX, "rejections", "xlsx")


@router.get("/{entry_id:int}")
def get_rejection(entry_id: int, s: Store = Depends(store), _=Depends(current_user)):
    return found(analytics.entry(s.rejections, entry_id, analytics.rejection_item))


@router.post("", status_code=201)
async def create_rejection(
    body: RejectionIn, s: Store = Depends(store), user=Depends(current_user)
):
    await s.add_rejection(
        {**rejection_record(body, s), "entered_by": f"{user['id']} {user['name']}"}
    )
    return rejection_saved(body)


@router.put("/{entry_id:int}")
async def update_rejection(
    entry_id: int, body: RejectionIn, s: Store = Depends(store), _=Depends(current_user)
):
    try:
        await s.update(Rejection, entry_id, rejection_record(body, s))
    except KeyError:
        found(None)
    return rejection_saved(body)

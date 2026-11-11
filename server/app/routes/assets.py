from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from .. import analytics
from ..auth import current_user, require_manager
from ..schemas import AssetIn
from ..store import Store
from .deps import PAGE, PAGE_SIZE, SEARCH, many, store

router = APIRouter(prefix="/assets")


@router.get("")
def list_assets(
    q: str | None = SEARCH,
    area: list[str] = many(),
    cls: list[str] = many(),
    page: int = PAGE,
    page_size: int = PAGE_SIZE,
    s: Store = Depends(store),
    _=Depends(current_user),
):
    return {
        "next_id": s.next_asset_id(),
        **analytics.asset_page(s, q, area, cls, page, page_size),
    }


@router.post("", status_code=201)
async def create_asset(
    body: AssetIn, s: Store = Depends(store), _=Depends(require_manager)
):
    if body.installed > date.today():
        raise HTTPException(422, "Installation date can't be in the future.")
    try:
        await s.add_asset(body.model_dump())
    except KeyError:
        raise HTTPException(409, f"{body.id} already exists. Use {s.next_asset_id()}.")
    return {"id": body.id}

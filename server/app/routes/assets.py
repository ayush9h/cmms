from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app import analytics
from app.auth import current_user, require_manager, require_premium
from app.routes.deps import PAGE, PAGE_SIZE, SEARCH, many, store
from app.schemas import AssetIn
from app.store import Store

# the asset register is a Premium feature; the nav hides it, this enforces it
router = APIRouter(prefix="/assets", dependencies=[Depends(require_premium)])


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


@router.put("/{asset_id}")
async def update_asset(
    asset_id: str,
    body: AssetIn,
    s: Store = Depends(store),
    _=Depends(require_manager),
):
    if body.installed > date.today():
        raise HTTPException(422, "Installation date can't be in the future.")
    try:
        await s.update_asset(asset_id, body.model_dump())
    except ValueError:
        raise HTTPException(404, f"{asset_id} is not in the asset register.")
    except KeyError:
        raise HTTPException(409, f"{body.id} already exists. Pick another ID.")
    return {"id": body.id}

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app import analytics
from app.auth import current_user, require_premium
from app.db_service.models import PpcEntry
from app.routes.deps import store
from app.schemas import PpcIn
from app.store import Store

# PPC feeds OEE, both Premium
router = APIRouter(prefix="/ppc", dependencies=[Depends(require_premium)])


def ppc_record(body: PpcIn, s: Store, user, entry_id=None):
    if s.asset(body.asset_id) is None:
        raise HTTPException(422, f"{body.asset_id} is not in the asset register.")
    p = s.ppc_entries
    clash = (
        (p["id"] == body.asset_id)
        & (p["date_from"] <= str(body.date_to))
        & (p["date_to"] >= str(body.date_from))
        & (p["entry_id"] != entry_id)
    )
    if clash.any():
        raise HTTPException(
            409, f"{body.asset_id} already has a PPC entry that overlaps these dates."
        )
    return {
        **body.model_dump(exclude={"shift_hours", "running"}),
        "running": body.running_json(),
        "shift_minutes": body.shift_minutes,
        "entered_by": f"{user['id']} {user['name']}",
    }


def ppc_saved(body: PpcIn):
    return {"asset_id": body.asset_id, "date": body.date_from.isoformat()}


@router.get("/find")
def find_ppc(
    asset_id: str = Query(min_length=1, max_length=20),
    date_from: date = Query(),
    date_to: date = Query(),
    s: Store = Depends(store),
    _=Depends(current_user),
):
    return analytics.ppc_find(s, asset_id, date_from, date_to)


@router.post("", status_code=201)
async def create_ppc(
    body: PpcIn, s: Store = Depends(store), user=Depends(current_user)
):
    await s.add_ppc(ppc_record(body, s, user))
    return ppc_saved(body)


@router.put("/{entry_id}")
async def update_ppc(
    entry_id: int, body: PpcIn, s: Store = Depends(store), user=Depends(current_user)
):
    try:
        await s.update(PpcEntry, entry_id, ppc_record(body, s, user, entry_id))
    except KeyError:
        raise HTTPException(404, "That PPC entry no longer exists.")
    return ppc_saved(body)

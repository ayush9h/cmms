from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

from . import analytics, exports
from .auth import LoginThrottle, current_user, issue_token, public, require_manager, verify_password
from .config import settings
from .schemas import AssetIn, BreakdownIn, LoginIn, PpcIn, RejectionIn
from .db_service.models import Breakdown, PpcEntry, Rejection
from .store import CAUSES, Store, stop_time

router = APIRouter(prefix="/api")
throttle = LoginThrottle(settings.max_login_failures, settings.lockout_seconds)


def store(request: Request) -> Store:
    return request.app.state.store


@router.get("/health")
def health():
    return {"ok": True}


@router.post("/auth/login")
def login(body: LoginIn, request: Request, response: Response):
    key = body.user_id.upper()
    if throttle.blocked(key):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts. Wait five minutes and try again.")
    user = request.app.state.users.get(body.user_id)
    if not user or not verify_password(body.password, user["password_hash"]):
        throttle.fail(key)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User ID or password is incorrect.")
    throttle.clear(key)
    response.set_cookie(
        settings.cookie_name,
        issue_token(user),
        max_age=settings.session_hours * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )
    return public(user)


@router.post("/auth/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(settings.cookie_name, path="/")


@router.get("/auth/me")
def me(user=Depends(current_user)):
    return user


@router.get("/options")
def options(s: Store = Depends(store), _=Depends(current_user)):
    return analytics.options(s)


def many():
    return Query([], max_length=100)


@router.get("/dashboard")
def dashboard(
    area: list[str] = many(),
    category: list[str] = many(),
    month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    asset: list[str] = many(),
    s: Store = Depends(store),
    _=Depends(current_user),
):
    return analytics.dashboard(s, {"area": area, "category": category, "month": month, "asset": asset})


@router.get("/oee")
def oee(
    area: list[str] = many(),
    month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    asset: list[str] = many(),
    shift: list[str] = many(),
    s: Store = Depends(store),
    _=Depends(current_user),
):
    return analytics.oee(s, {"area": area, "month": month, "asset": asset, "shift": shift})


PAGE = Query(1, ge=1)
PAGE_SIZE = Query(25, ge=1, le=200)
SEARCH = Query(None, max_length=80)


@router.get("/assets")
def list_assets(
    q: str | None = SEARCH,
    area: list[str] = many(),
    cls: list[str] = many(),
    page: int = PAGE,
    page_size: int = PAGE_SIZE,
    s: Store = Depends(store),
    _=Depends(current_user),
):
    return {"next_id": s.next_asset_id(), **analytics.asset_page(s, q, area, cls, page, page_size)}


@router.post("/assets", status_code=201)
async def create_asset(body: AssetIn, s: Store = Depends(store), _=Depends(require_manager)):
    if body.installed > date.today():
        raise HTTPException(422, "Installation date can't be in the future.")
    try:
        await s.add_asset(body.model_dump())
    except KeyError:
        raise HTTPException(409, f"{body.id} already exists. Use {s.next_asset_id()}.")
    return {"id": body.id}


def download(content: bytes, media: str, stem: str, ext: str):
    name = f"{stem}-{date.today():%Y-%m-%d}.{ext}"
    return Response(content, media_type=media, headers={"Content-Disposition": f'attachment; filename="{name}"'})


@router.get("/dashboard/export")
def export_dashboard(
    area: list[str] = many(),
    category: list[str] = many(),
    month: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    asset: list[str] = many(),
    s: Store = Depends(store),
    _=Depends(current_user),
):
    f = {"area": area, "category": category, "month": month, "asset": asset}
    labels = {
        "Shop": ", ".join(area),
        "Month": f"{date.fromisoformat(month + '-01'):%B %Y}" if month else "",
        "Category": ", ".join(category),
        "Machine": ", ".join(asset),
    }
    return download(exports.dashboard_pptx(s, analytics.dashboard(s, f), f, labels), exports.PPTX, "reliability-review", "pptx")


@router.get("/breakdowns/export")
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


@router.get("/rejections/export")
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


@router.get("/breakdowns")
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
    return analytics.breakdown_page(s, q, area, category, asset, date_from, date_to, page, page_size)


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
    return {"asset_id": record["asset_id"], "date": record["date"].isoformat(), "start": record["start"].strftime("%H:%M")}


def found(item):
    if item is None:
        raise HTTPException(404, "That entry no longer exists.")
    return item


@router.get("/breakdowns/{entry_id:int}")
def get_breakdown(entry_id: int, s: Store = Depends(store), _=Depends(current_user)):
    return found(analytics.entry(s.breakdowns, entry_id, analytics.breakdown_item))


@router.post("/breakdowns", status_code=201)
async def create_breakdown(body: BreakdownIn, s: Store = Depends(store), user=Depends(current_user)):
    record = breakdown_record(body, s)
    await s.add_breakdown({**record, "entered_by": f"{user['id']} {user['name']}"})
    return breakdown_saved(record)


@router.put("/breakdowns/{entry_id:int}")
async def update_breakdown(entry_id: int, body: BreakdownIn, s: Store = Depends(store), _=Depends(current_user)):
    record = breakdown_record(body, s)
    try:
        await s.update(Breakdown, entry_id, record)
    except KeyError:
        found(None)
    return breakdown_saved(record)


@router.get("/rejections")
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
    return analytics.rejection_page(s, q, area, asset, defect, disposition, page, page_size)


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


@router.get("/rejections/{entry_id:int}")
def get_rejection(entry_id: int, s: Store = Depends(store), _=Depends(current_user)):
    return found(analytics.entry(s.rejections, entry_id, analytics.rejection_item))


@router.post("/rejections", status_code=201)
async def create_rejection(body: RejectionIn, s: Store = Depends(store), user=Depends(current_user)):
    await s.add_rejection({**rejection_record(body, s), "entered_by": f"{user['id']} {user['name']}"})
    return {"asset_id": body.asset_id, "date": body.date.isoformat(), "part": body.part}


@router.put("/rejections/{entry_id:int}")
async def update_rejection(entry_id: int, body: RejectionIn, s: Store = Depends(store), _=Depends(current_user)):
    try:
        await s.update(Rejection, entry_id, rejection_record(body, s))
    except KeyError:
        found(None)
    return {"asset_id": body.asset_id, "date": body.date.isoformat(), "part": body.part}


def ppc_record(body: PpcIn, s: Store, user, entry_id=None):
    if s.asset(body.asset_id) is None:
        raise HTTPException(422, f"{body.asset_id} is not in the asset register.")
    p = s.ppc_entries
    clash = (p["id"] == body.asset_id) & (p["date_from"] <= str(body.date_to)) & (p["date_to"] >= str(body.date_from)) & (p["entry_id"] != entry_id)
    if clash.any():
        raise HTTPException(409, f"{body.asset_id} already has a PPC entry that overlaps these dates.")
    return {
        **body.model_dump(exclude={"shift_hours", "running"}),
        "running": body.running_json(),
        "shift_minutes": body.shift_minutes,
        "entered_by": f"{user['id']} {user['name']}",
    }


@router.get("/ppc/find")
def find_ppc(
    asset_id: str = Query(pattern=r"^AST-\d{3,}$"),
    date_from: date = Query(),
    date_to: date = Query(),
    s: Store = Depends(store),
    _=Depends(current_user),
):
    return analytics.ppc_find(s, asset_id, date_from, date_to)


@router.post("/ppc", status_code=201)
async def create_ppc(body: PpcIn, s: Store = Depends(store), user=Depends(current_user)):
    await s.add_ppc(ppc_record(body, s, user))
    return {"asset_id": body.asset_id, "date": body.date_from.isoformat()}


@router.put("/ppc/{entry_id}")
async def update_ppc(entry_id: int, body: PpcIn, s: Store = Depends(store), user=Depends(current_user)):
    try:
        await s.update(PpcEntry, entry_id, ppc_record(body, s, user, entry_id))
    except KeyError:
        raise HTTPException(404, "That PPC entry no longer exists.")
    return {"asset_id": body.asset_id, "date": body.date_from.isoformat()}

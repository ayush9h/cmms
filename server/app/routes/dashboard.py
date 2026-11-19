from datetime import date

from fastapi import APIRouter, Depends

from app import analytics, exports
from app.auth import current_user
from app.routes.deps import MONTH, download, many, store
from app.store import Store

router = APIRouter()


@router.get("/options")
def options(s: Store = Depends(store), _=Depends(current_user)):
    return analytics.options(s)


@router.get("/dashboard")
def dashboard(
    area: list[str] = many(),
    category: list[str] = many(),
    month: str | None = MONTH,
    asset: list[str] = many(),
    s: Store = Depends(store),
    _=Depends(current_user),
):
    return analytics.dashboard(
        s, {"area": area, "category": category, "month": month, "asset": asset}
    )


@router.get("/oee")
def oee(
    area: list[str] = many(),
    month: str | None = MONTH,
    asset: list[str] = many(),
    shift: list[str] = many(),
    s: Store = Depends(store),
    _=Depends(current_user),
):
    return analytics.oee(
        s, {"area": area, "month": month, "asset": asset, "shift": shift}
    )


@router.get("/dashboard/export")
def export_dashboard(
    area: list[str] = many(),
    category: list[str] = many(),
    month: str | None = MONTH,
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
    return download(
        exports.dashboard_pptx(s, analytics.dashboard(s, f), f, labels),
        exports.PPTX,
        "reliability-review",
        "pptx",
    )

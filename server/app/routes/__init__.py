from fastapi import APIRouter

from app.routes.assets import router as assets_router
from app.routes.auth import router as auth_router
from app.routes.breakdowns import router as breakdowns_router
from app.routes.dashboard import router as dashboard_router
from app.routes.health import router as health_router
from app.routes.ppc import router as ppc_router
from app.routes.rejections import router as rejections_router

router = APIRouter(prefix="/api")

for tag, child in (
    ("health", health_router),
    ("auth", auth_router),
    ("dashboard", dashboard_router),
    ("assets", assets_router),
    ("breakdowns", breakdowns_router),
    ("rejections", rejections_router),
    ("ppc", ppc_router),
):
    router.include_router(child, tags=[tag])

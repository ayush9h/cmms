from fastapi import APIRouter

from .assets import router as assets_router
from .auth import router as auth_router
from .breakdowns import router as breakdowns_router
from .dashboard import router as dashboard_router
from .health import router as health_router
from .ppc import router as ppc_router
from .rejections import router as rejections_router

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

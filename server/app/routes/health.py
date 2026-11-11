import logging

from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.db_service.db import engine

logger = logging.getLogger(__name__)
router = APIRouter()


async def check_database_connectivity() -> str:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return "up"
    except Exception:
        logger.exception("Database health check failed")
        return "down"


async def perform_health_checks() -> dict:
    checks = {"app": "up", "database": await check_database_connectivity()}
    healthy = all(value == "up" for value in checks.values())
    return {"status": "healthy" if healthy else "unhealthy", "checks": checks}


@router.get("/health", summary="Backend health check")
@router.head("/health", include_in_schema=False)
async def health(response: Response):
    result = await perform_health_checks()
    response.status_code = (
        status.HTTP_200_OK
        if result["status"] == "healthy"
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return result

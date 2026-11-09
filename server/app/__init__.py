from contextlib import asynccontextmanager

from fastapi import FastAPI

from .auth import Users
from .config import settings
from .db_service.db import engine
from .routes import router
from .store import Store


def create_app(users_path=None) -> FastAPI:
    store = Store()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await store.refresh()
        yield
        await engine.dispose()

    app = FastAPI(title="OMR Bagla CMMS", docs_url="/api/docs", openapi_url="/api/openapi.json", lifespan=lifespan)
    app.state.store = store
    app.state.users = Users(users_path or settings.users_path)
    app.include_router(router)
    return app

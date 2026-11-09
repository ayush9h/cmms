from fastapi import FastAPI

from .auth import Users
from .config import settings
from .routes import router
from .store import Store


def create_app(data_path=None, users_path=None) -> FastAPI:
    app = FastAPI(title="OMR Bagla CMMS", docs_url="/api/docs", openapi_url="/api/openapi.json")
    app.state.store = Store(data_path or settings.data_path)
    app.state.users = Users(users_path or settings.users_path)
    app.include_router(router)
    return app

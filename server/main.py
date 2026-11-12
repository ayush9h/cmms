from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db_service.db import engine
from app.routes import router
from app.store import Store

store = Store()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await store.refresh()
    yield
    await engine.dispose()


app = FastAPI(
    title="OPMAX Dashboard System",
    description="Customizable dashboard system for manufacturing plants.",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)
app.state.store = store
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

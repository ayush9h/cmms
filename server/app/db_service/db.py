from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (AsyncSession, async_sessionmaker,
                                    create_async_engine)

from app.config import settings

engine = create_async_engine(
    settings.db_url,
    pool_size=2,
    max_overflow=1,
    pool_pre_ping=True,
    pool_recycle=1800,
)

async_session_maker = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

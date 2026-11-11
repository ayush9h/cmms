from datetime import date

from fastapi import HTTPException, Query, Request, Response

from app.store import Store


def store(request: Request) -> Store:
    return request.app.state.store


def many():
    return Query([], max_length=100)


MONTH = Query(None, pattern=r"^\d{4}-\d{2}$")
PAGE = Query(1, ge=1)
PAGE_SIZE = Query(25, ge=1, le=200)
SEARCH = Query(None, max_length=80)


def found(item):
    if item is None:
        raise HTTPException(404, "That entry no longer exists.")
    return item


def download(content: bytes, media: str, stem: str, ext: str):
    name = f"{stem}-{date.today():%Y-%m-%d}.{ext}"
    return Response(
        content,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )

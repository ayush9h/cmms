from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import (LoginThrottle, current_user, issue_token, public,
                    verify_password)
from ..config import settings
from ..db_service.db import get_session
from ..db_service.models import User
from ..schemas import LoginIn

router = APIRouter(prefix="/auth")
throttle = LoginThrottle(settings.max_login_failures, settings.lockout_seconds)


@router.post("/login")
async def login(
    body: LoginIn, response: Response, session: AsyncSession = Depends(get_session)
):
    key = body.user_id.upper()
    if throttle.blocked(key):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many attempts. Wait five minutes and try again.",
        )
    user = await session.get(User, body.user_id.strip().lower())
    if not user or not verify_password(body.password, user.password_hash):
        throttle.fail(key)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "User ID or password is incorrect."
        )
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


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(settings.cookie_name, path="/")


@router.get("/me")
def me(user=Depends(current_user)):
    return user

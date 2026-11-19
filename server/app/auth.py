import hashlib
import hmac
import threading
import time
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request, status

from app.config import settings

ROLES = ("employee", "manager")
TIERS = ("free", "premium")
# What a free account may record. Premium is unlimited. The keys are the nouns
# shown to the user, so there is no second table of labels to keep in step.
FREE_LIMITS = {"assets": 5, "breakdowns": 30, "rejections": 30, "PPC entries": 30}


def free_limit(user, kind: str) -> int | None:
    """Rows of `kind` this account may add. None is unlimited."""
    return None if user["tier"] == "premium" else FREE_LIMITS[kind]


def over_limit(kind: str, limit: int) -> HTTPException:
    return HTTPException(
        status.HTTP_403_FORBIDDEN,
        f"The free plan covers {limit} {kind}. Contact us to upgrade and add more.",
    )


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, salt, digest = encoded.split("$")
    except ValueError:
        return False
    if scheme != "scrypt":
        return False
    candidate = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32
    )
    return hmac.compare_digest(candidate.hex(), digest)


class LoginThrottle:
    def __init__(self, limit, window):
        self.limit, self.window = limit, window
        self.fails = {}
        self.lock = threading.Lock()

    def blocked(self, key):
        with self.lock:
            recent = [
                t for t in self.fails.get(key, []) if time.monotonic() - t < self.window
            ]
            self.fails[key] = recent
            return len(recent) >= self.limit

    def fail(self, key):
        with self.lock:
            self.fails.setdefault(key, []).append(time.monotonic())

    def clear(self, key):
        with self.lock:
            self.fails.pop(key, None)


def public(user):
    return {
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "tier": user.tier,
    }


def issue_token(user):
    now = datetime.now(timezone.utc)
    payload = {
        **public(user),
        "sub": user.id,
        "iat": now,
        "exp": now + timedelta(hours=settings.session_hours),
    }
    return jwt.encode(payload, settings.secret, algorithm="HS256")


def current_user(request: Request):
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to continue.")
    try:
        claims = jwt.decode(token, settings.secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Your session has expired. Sign in again."
        )
    if claims.get("role") not in ROLES:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to continue.")
    tier = claims.get("tier")
    return {
        "id": claims["sub"],
        "name": claims["name"],
        "role": claims["role"],
        # tokens issued before tiers existed carry no claim; treat them as free
        "tier": tier if tier in TIERS else "free",
    }


def require_manager(user=Depends(current_user)):
    if user["role"] != "manager":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Only managers can register assets."
        )
    return user


def require_premium(user=Depends(current_user)):
    if user["tier"] != "premium":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "This is a Premium feature. Contact us to upgrade your account.",
        )
    return user

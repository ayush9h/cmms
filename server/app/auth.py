import hashlib
import hmac
import json
import threading
import time
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request, status

from .config import settings

ROLES = ("employee", "manager")


class Users:
    def __init__(self, path):
        records = json.loads(path.read_text(encoding="utf-8"))
        self._by_id = {u["id"].upper(): u for u in records}

    def get(self, user_id):
        return self._by_id.get(user_id.strip().upper())


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, salt, digest = encoded.split("$")
    except ValueError:
        return False
    if scheme != "scrypt":
        return False
    candidate = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32)
    return hmac.compare_digest(candidate.hex(), digest)


class LoginThrottle:
    def __init__(self, limit, window):
        self.limit, self.window = limit, window
        self._fails = {}
        self._lock = threading.Lock()

    def blocked(self, key):
        with self._lock:
            recent = [t for t in self._fails.get(key, []) if time.monotonic() - t < self.window]
            self._fails[key] = recent
            return len(recent) >= self.limit

    def fail(self, key):
        with self._lock:
            self._fails.setdefault(key, []).append(time.monotonic())

    def clear(self, key):
        with self._lock:
            self._fails.pop(key, None)


def public(user):
    return {"id": user["id"], "name": user["name"], "role": user["role"]}


def issue_token(user):
    now = datetime.now(timezone.utc)
    payload = {**public(user), "sub": user["id"], "iat": now, "exp": now + timedelta(hours=settings.session_hours)}
    return jwt.encode(payload, settings.secret, algorithm="HS256")


def current_user(request: Request):
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to continue.")
    try:
        claims = jwt.decode(token, settings.secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Your session has expired. Sign in again.")
    if claims.get("role") not in ROLES:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to continue.")
    return {"id": claims["sub"], "name": claims["name"], "role": claims["role"]}


def require_manager(user=Depends(current_user)):
    if user["role"] != "manager":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only managers can register assets.")
    return user

from pydantic import Field

from .base import Strict


class LoginIn(Strict):
    user_id: str = Field(min_length=3, max_length=20)
    password: str = Field(min_length=1, max_length=128)

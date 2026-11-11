from datetime import date
from typing import Literal

from pydantic import Field

from app.schemas.base import Strict
from app.store import CLASSES, SHOPS


class AssetIn(Strict):
    id: str = Field(pattern=r"^AST-\d{3,}$")
    name: str = Field(min_length=2, max_length=80)
    area: Literal[SHOPS]
    oem: str = Field(min_length=1, max_length=60)
    installed: date
    application: str = Field(min_length=2, max_length=60)
    cls: Literal[CLASSES]
    run_rate: float = Field(gt=0, le=100_000)

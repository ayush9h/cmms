from datetime import date, time
from typing import Literal

from pydantic import Field, model_validator

from app.schemas.base import Strict
from app.store import CATEGORIES, SHIFTS


class BreakdownIn(Strict):
    date: date
    asset_id: str = Field(pattern=r"^AST-\d{3,}$")
    shift: Literal[SHIFTS]
    category: Literal[CATEGORIES]
    problem: str = Field(min_length=2, max_length=120)
    start: time
    diagnose: int = Field(ge=0, le=1440)
    spares: int = Field(ge=0, le=1440)
    wrench: int = Field(ge=0, le=1440)
    description: str = Field(min_length=5, max_length=500)
    action: str = Field(min_length=3, max_length=500)

    @model_validator(mode="after")
    def total_in_range(self):
        total = self.diagnose + self.spares + self.wrench
        if not 1 <= total < 1440:
            raise ValueError(
                "Diagnosis, spares and wrench time must add up to between 1 minute and 24 hours."
            )
        return self

    @property
    def total(self):
        return self.diagnose + self.spares + self.wrench

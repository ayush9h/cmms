from datetime import date, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .store import DEFECTS, DISPOSITIONS, SHIFTS, SHOPS


class Strict(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


class LoginIn(Strict):
    user_id: str = Field(min_length=3, max_length=20)
    password: str = Field(min_length=1, max_length=128)


class AssetIn(Strict):
    id: str = Field(pattern=r"^AST-\d{3,}$")
    name: str = Field(min_length=2, max_length=80)
    area: Literal[SHOPS]
    oem: str = Field(min_length=1, max_length=60)
    installed: date
    application: str = Field(min_length=2, max_length=60)
    cls: str = Field(min_length=2, max_length=40)


class BreakdownIn(Strict):
    date: date
    asset_id: str = Field(pattern=r"^AST-\d{3,}$")
    category: str = Field(min_length=2, max_length=40)
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
            raise ValueError("Diagnosis, spares and wrench time must add up to between 1 minute and 24 hours.")
        return self

    @property
    def total(self):
        return self.diagnose + self.spares + self.wrench


class RejectionIn(Strict):
    date: date
    shift: Literal[SHIFTS]
    asset_id: str = Field(pattern=r"^AST-\d{3,}$")
    part: str = Field(min_length=2, max_length=60)
    defect: Literal[DEFECTS]
    disposition: Literal[DISPOSITIONS]

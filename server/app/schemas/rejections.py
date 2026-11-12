from datetime import date
from typing import Literal

from pydantic import Field, model_validator

from app.schemas.base import AssetId, Strict
from app.store import CAUSES, DEFECTS, DISPOSITIONS, SHIFTS


class RejectionIn(Strict):
    date: date
    shift: Literal[SHIFTS]
    asset_id: AssetId
    part: str = Field(min_length=2, max_length=60)
    produced: int = Field(ge=1, le=1_000_000)
    rej_production: int = Field(0, ge=0, le=1_000_000)
    rej_die: int = Field(0, ge=0, le=1_000_000)
    rej_machine: int = Field(0, ge=0, le=1_000_000)
    rej_quality: int = Field(0, ge=0, le=1_000_000)
    rej_engineering: int = Field(0, ge=0, le=1_000_000)
    rej_incoming: int = Field(0, ge=0, le=1_000_000)
    defect: Literal[DEFECTS] | None = None
    disposition: Literal[DISPOSITIONS] | None = None

    @property
    def rejected(self):
        return sum(getattr(self, key) for key, _ in CAUSES)

    @model_validator(mode="after")
    def quantities_add_up(self):
        if self.rejected > self.produced:
            raise ValueError("Total rejected can't be more than the quantity produced.")
        if self.rejected and not (self.defect and self.disposition):
            raise ValueError(
                "Choose the main defect and whether the rejected parts are scrapped or reworked."
            )
        return self

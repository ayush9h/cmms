import json
from datetime import date, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .store import CATEGORIES, CAUSES, CLASSES, DEFECTS, DISPOSITIONS, SHIFTS, SHOPS


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
    cls: Literal[CLASSES]
    run_rate: float = Field(gt=0, le=100_000)


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
            raise ValueError("Choose the main defect and whether the rejected parts are scrapped or reworked.")
        return self


class PpcIn(Strict):
    date_from: date
    date_to: date
    running: dict[date, list[Literal[SHIFTS]]]
    asset_id: str = Field(pattern=r"^AST-\d{3,}$")
    shift_hours: float = Field(gt=0, le=24)
    short_breaks: int = Field(0, ge=0, le=20)
    short_break_minutes: int = Field(0, ge=0, le=120)
    meal_breaks: int = Field(0, ge=0, le=10)
    meal_break_minutes: int = Field(0, ge=0, le=180)
    ideal_rate: float = Field(gt=0, le=100_000)

    @property
    def shift_minutes(self):
        return round(self.shift_hours * 60)

    @property
    def planned(self):
        return self.shift_minutes - self.short_breaks * self.short_break_minutes - self.meal_breaks * self.meal_break_minutes

    @model_validator(mode="after")
    def breaks_fit(self):
        if self.planned < 1:
            raise ValueError("Breaks can't take up the whole shift.")
        if self.date_from > self.date_to:
            raise ValueError("The start date must be on or before the end date.")
        if any(not self.date_from <= day <= self.date_to for day in self.running):
            raise ValueError("Running days must fall inside the period.")
        if not self.slots:
            raise ValueError("Tick at least one shift the machine ran.")
        return self

    @property
    def slots(self):
        return sum(len(set(shifts)) for shifts in self.running.values())

    def running_json(self):
        return json.dumps({day.isoformat(): sorted(set(shifts)) for day, shifts in sorted(self.running.items()) if shifts})

import json
from datetime import date
from typing import Literal

from pydantic import Field, model_validator

from app.schemas.base import Strict
from app.store import SHIFTS


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
        return (
            self.shift_minutes
            - self.short_breaks * self.short_break_minutes
            - self.meal_breaks * self.meal_break_minutes
        )

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
        return json.dumps(
            {
                day.isoformat(): sorted(set(shifts))
                for day, shifts in sorted(self.running.items())
                if shifts
            }
        )

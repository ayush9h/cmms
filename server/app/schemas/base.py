from pydantic import BaseModel, ConfigDict


class Strict(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class Strict(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")


# Asset IDs are free-form: any format the plant already uses. The only bound is
# the assets.id column (and the asset_id columns that reference it), varchar 20.
AssetId = Annotated[str, Field(min_length=1, max_length=20)]

import pandas as pd

from ..store import CAUSES
from .workbook import single_sheet


def rejections_xlsx(df: pd.DataFrame):
    columns = [
        ("Date", 12, "yyyy-mm-dd"),
        ("Shift", 7, None),
        ("Asset ID", 10, None),
        ("Machine", 28, None),
        ("Shop", 14, None),
        ("Part", 28, None),
        ("Produced", 11, "#,##0"),
        *((label, 14, "#,##0") for _, label in CAUSES),
        ("Total rejected", 14, "#,##0"),
        ("Rejection %", 12, "0.0%"),
        ("Defect", 20, None),
        ("Disposition", 12, None),
        ("Logged by", 26, None),
    ]
    rows = [
        [
            r.date.to_pydatetime(),
            r.shift,
            r.id,
            r.name,
            r.area,
            r.part,
            int(r.produced),
            *(int(getattr(r, k)) for k, _ in CAUSES),
            int(r.rejected),
            r.rejected / r.produced if r.produced else None,
            r.defect,
            r.disposition,
            r.entered_by,
        ]
        for r in df.itertuples()
    ]
    return single_sheet("Rejections", columns, rows)

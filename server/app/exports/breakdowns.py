import pandas as pd

from .workbook import single_sheet


def breakdowns_xlsx(df: pd.DataFrame):
    columns = [
        ("Date", 12, "yyyy-mm-dd"),
        ("Shift", 7, None),
        ("Start", 8, None),
        ("Stop", 8, None),
        ("Asset ID", 10, None),
        ("Asset", 28, None),
        ("Shop", 14, None),
        ("Category", 13, None),
        ("Problem", 28, None),
        ("Problem description", 48, None),
        ("Action taken", 48, None),
        ("Diagnosis (min)", 15, "0"),
        ("Spares wait (min)", 17, "0"),
        ("Wrench time (min)", 17, "0"),
        ("Downtime (min)", 15, "0"),
        ("Logged by", 26, None),
    ]
    rows = [
        [
            r.date.to_pydatetime(),
            r.shift,
            r.start,
            r.stop,
            r.id,
            r.name,
            r.area,
            r.category,
            r.problem,
            r.remarks,
            r.action,
            int(r.diagnose),
            int(r.spares),
            int(r.wrench),
            int(r.minutes),
            r.entered_by or "Imported",
        ]
        for r in df.itertuples()
    ]
    return single_sheet("Breakdowns", columns, rows)

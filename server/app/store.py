import os
import threading
from datetime import date, datetime, time, timedelta
from pathlib import Path

import openpyxl
import pandas as pd

PHASES = {"diagnose": "Diagnose Time", "spares": "Spares Arrangement time", "wrench": "Wrench Time"}

ASSET_COLUMNS = {
    "S.No": "sno",
    "Asset ID": "id",
    "Asset Name": "name",
    "Asset Installation Area": "area",
    "Asset OEM": "oem",
    "Asset Installation Date": "installed",
    "Asset Application": "application",
    "Asset Cattegory Class": "cls",
}

BREAKDOWN_COLUMNS = {
    "Date": "date",
    "Asset Name": "name",
    "Asset ID": "id",
    "BD Category": "category",
    "Problem Defination": "problem",
    "BD Start Time": "start",
    "Diagnose Time": "diagnose",
    "Spares Arrangement time": "spares",
    "Wrench Time": "wrench",
    "BD Stop Time": "stop",
    "Todal Breakdown Time": "total",
    "Remarks": "remarks",
    "Overall Equipment": "area",
    "Entered By": "entered_by",
    "Action Taken": "action",
}

OPTIONAL_COLUMNS = ("Entered By", "Action Taken")

SHOPS = ("Machine Shop", "PDC", "Utility")
SHIFTS = ("A", "B", "C")
DISPOSITIONS = ("Scrap", "Rework")
DEFECTS = (
    "Porosity",
    "Blow hole",
    "Cold shut",
    "Crack",
    "Flash",
    "Dimensional",
    "Surface finish",
    "Burr",
    "Thread damage",
    "Dent / handling damage",
    "Other",
)

REJECTION_SHEET = "REJECTION"
REJECTION_COLUMNS = {
    "Date": "date",
    "Shift": "shift",
    "Asset ID": "id",
    "Asset Name": "name",
    "Shop": "area",
    "Part": "part",
    "Defect": "defect",
    "Disposition": "disposition",
    "Entered By": "entered_by",
}


class WorkbookLocked(Exception):
    pass


def _clock(v):
    return v.strftime("%H:%M") if isinstance(v, time) else str(v)[:5]


class Store:
    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.Lock()
        self.refresh()

    def refresh(self):
        a = pd.read_excel(self.path, sheet_name="ASSET MASTER").rename(columns=str.strip).dropna(subset=["Asset ID"])
        a = a.rename(columns=ASSET_COLUMNS)
        b = pd.read_excel(self.path, sheet_name="BREAKDOWN").rename(columns=str.strip)
        b["date"] = pd.to_datetime(b["Date"], errors="coerce", format="mixed")
        b = b.dropna(subset=["date", "Asset ID"]).copy()
        for key, col in PHASES.items():
            b[key] = pd.to_numeric(b[col], errors="coerce").fillna(0).astype(int)
        start = pd.to_timedelta(b["BD Start Time"].map(_clock) + ":00")
        stop = pd.to_timedelta(b["BD Stop Time"].map(_clock) + ":00")
        b["minutes"] = (((stop - start).dt.total_seconds() / 60) % 1440).astype(int)
        b["start"] = b["BD Start Time"].map(_clock)
        b["stop"] = b["BD Stop Time"].map(_clock)
        b["problem"] = b["Problem Defination"].fillna("").astype(str)
        b["remarks"] = b["Remarks"].where(b["Remarks"].notna(), "").astype(str) if "Remarks" in b else ""
        for label, key in (("Entered By", "entered_by"), ("Action Taken", "action")):
            b[key] = b[label].where(b[label].notna(), "").astype(str) if label in b else ""
        b = b.rename(columns={"Asset ID": "id", "BD Category": "category"})
        b = b.merge(a[["id", "area", "name"]], on="id", how="left")
        b["month"] = b["date"].dt.strftime("%Y-%m")
        end = b["date"].max() + pd.offsets.MonthEnd(0)
        a["age"] = ((end - a["installed"]).dt.days / 365.25).clip(lower=0).round(1)
        cols = ["date", "month", "id", "name", "area", "category", "problem", "start", "stop", "minutes", *PHASES, "remarks", "action", "entered_by"]
        self.assets, self.breakdowns, self.end = a, b[cols].reset_index(drop=True), end
        self.start = b["date"].min().replace(day=1)
        self.rejections = self._rejections()

    def _rejections(self):
        cols = list(REJECTION_COLUMNS.values())
        try:
            r = pd.read_excel(self.path, sheet_name=REJECTION_SHEET).rename(columns=str.strip)
        except ValueError:
            return pd.DataFrame(columns=cols)
        r = r.rename(columns=REJECTION_COLUMNS).reindex(columns=cols).dropna(subset=["id", "date"])
        r["date"] = pd.to_datetime(r["date"], errors="coerce", format="mixed")
        for key in ("shift", "name", "area", "part", "defect", "disposition", "entered_by"):
            r[key] = r[key].where(r[key].notna(), "").astype(str)
        return r.dropna(subset=["date"]).reset_index(drop=True)

    def next_asset_id(self):
        nums = self.assets["id"].str.extract(r"(\d+)$")[0].dropna().astype(int)
        return f"AST-{(nums.max() if len(nums) else 0) + 1:03d}"

    def has_asset(self, asset_id):
        return asset_id.upper() in set(self.assets["id"].str.upper())

    def asset(self, asset_id):
        rows = self.assets[self.assets["id"] == asset_id]
        return None if rows.empty else rows.iloc[0]

    def add_asset(self, record: dict):
        with self._lock:
            if self.has_asset(record["id"]):
                raise KeyError(record["id"])
            self._append("ASSET MASTER", ASSET_COLUMNS, record, "id", lambda prev: {"sno": (prev.get("sno") or 0) + 1})
            self.refresh()

    def add_breakdown(self, record: dict):
        with self._lock:
            self._append("BREAKDOWN", BREAKDOWN_COLUMNS, record, "id", lambda prev: {})
            self.refresh()

    def add_rejection(self, record: dict):
        with self._lock:
            self._append(REJECTION_SHEET, REJECTION_COLUMNS, record, "id", lambda prev: {})
            self.refresh()

    def _append(self, sheet, columns, record, key, derive):
        wb = openpyxl.load_workbook(self.path)
        if sheet not in wb.sheetnames:
            wb.create_sheet(sheet).append(list(columns))
        ws = wb[sheet]
        header = {str(c.value).strip(): c.column for c in ws[1] if c.value is not None}
        for label in columns:
            if label not in header and label in OPTIONAL_COLUMNS:
                header[label] = ws.max_column + 1
                ws.cell(1, header[label], label)
        col = {columns[label]: idx for label, idx in header.items() if label in columns}
        last = max(r for r in range(1, ws.max_row + 1) if ws.cell(r, col[key]).value is not None)
        prev = {k: ws.cell(last, c).value for k, c in col.items()} if last > 1 else {}
        values = {**record, **derive(prev)}
        row = last + 1
        for k, c in col.items():
            if k not in values:
                continue
            v = values[k]
            if k == "total":
                letters = {name: openpyxl.utils.get_column_letter(col[name]) for name in PHASES}
                v = f"={letters['diagnose']}{row}+{letters['spares']}{row}+{letters['wrench']}{row}"
            cell = ws.cell(row, c, v)
            if last > 1:
                cell.number_format = ws.cell(last, c).number_format
            elif isinstance(v, datetime):
                cell.number_format = "yyyy-mm-dd"
        tmp = self.path.with_name(self.path.stem + ".saving.xlsx")
        try:
            wb.save(tmp)
            os.replace(tmp, self.path)
        except PermissionError as e:
            tmp.unlink(missing_ok=True)
            raise WorkbookLocked from e


def as_datetime(d: date):
    return datetime.combine(d, time())


def stop_time(start: time, minutes: int):
    return (datetime.combine(date.min, start) + timedelta(minutes=minutes)).time()

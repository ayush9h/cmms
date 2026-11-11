from io import BytesIO

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from .theme import BRAND


def write_table(ws, columns, rows):
    ws.append([c[0] for c in columns])
    for row in rows:
        ws.append(row)
    head = PatternFill("solid", fgColor=BRAND)
    for i, (_, width, fmt) in enumerate(columns, start=1):
        cell = ws.cell(1, i)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = head
        cell.alignment = Alignment(vertical="center")
        ws.column_dimensions[get_column_letter(i)].width = width
        if fmt:
            for r in range(2, ws.max_row + 1):
                ws.cell(r, i).number_format = fmt
    ws.row_dimensions[1].height = 22
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions


def to_bytes(wb):
    out = BytesIO()
    wb.save(out)
    return out.getvalue()


def single_sheet(title, columns, rows):
    wb = Workbook()
    wb.active.title = title
    write_table(wb.active, columns, rows)
    return to_bytes(wb)

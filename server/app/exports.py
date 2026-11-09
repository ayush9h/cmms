from datetime import date
from io import BytesIO
from pathlib import Path

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from .analytics import scope
from .store import Store

LOGO = Path(__file__).parent / "assets" / "omr-mark.png"
XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

BRAND = "0091D0"
INK = RGBColor(0x0F, 0x21, 0x30)
MUTED = RGBColor(0x5D, 0x6B, 0x76)
LINE = RGBColor(0xE2, 0xE8, 0xED)
PANEL = RGBColor(0xF8, 0xFA, 0xFB)
CATS = ["2A78D6", "EB6834", "1BAF7A", "EDA100", "E87BA4", "008300"]
PHASES = [("diagnose", "Diagnosis", "2A78D6"), ("spares", "Spares arrangement", "EB6834"), ("wrench", "Wrench time", "199E70")]
FONT = "Segoe UI"


def _sheet(title, columns, rows):
    wb = Workbook()
    ws = wb.active
    ws.title = title
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
    out = BytesIO()
    wb.save(out)
    return out.getvalue()


def breakdowns_xlsx(df: pd.DataFrame):
    columns = [
        ("Date", 12, "yyyy-mm-dd"), ("Start", 8, None), ("Stop", 8, None), ("Asset ID", 10, None), ("Asset", 28, None),
        ("Shop", 14, None), ("Category", 13, None), ("Problem", 28, None), ("Problem description", 48, None),
        ("Action taken", 48, None), ("Diagnosis (min)", 15, "0"), ("Spares wait (min)", 17, "0"),
        ("Wrench time (min)", 17, "0"), ("Downtime (min)", 15, "0"), ("Logged by", 26, None),
    ]
    rows = [
        [r.date.to_pydatetime(), r.start, r.stop, r.id, r.name, r.area, r.category, r.problem, r.remarks, r.action,
         int(r.diagnose), int(r.spares), int(r.wrench), int(r.minutes), r.entered_by or "Imported"]
        for r in df.itertuples()
    ]
    return _sheet("Breakdowns", columns, rows)


def rejections_xlsx(df: pd.DataFrame):
    columns = [
        ("Date", 12, "yyyy-mm-dd"), ("Shift", 7, None), ("Asset ID", 10, None), ("Machine", 28, None), ("Shop", 14, None),
        ("Part", 28, None), ("Defect", 20, None), ("Disposition", 12, None), ("Logged by", 26, None),
    ]
    rows = [
        [r.date.to_pydatetime(), r.shift, r.id, r.name, r.area, r.part, r.defect, r.disposition, r.entered_by]
        for r in df.itertuples()
    ]
    return _sheet("Rejections", columns, rows)


def _text(slide, x, y, w, h, text, size=14, bold=False, color=INK, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.name = FONT
    run.font.color.rgb = color
    return box


def _slide(prs, title, sub):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    _text(slide, 0.6, 0.45, 10.5, 0.6, title, 28, True)
    _text(slide, 0.6, 1.05, 10.5, 0.4, sub, 13, color=MUTED)
    slide.shapes.add_picture(str(LOGO), Inches(11.55), Inches(0.5), height=Inches(0.5))
    return slide


def _flat(shape):
    shape.shadow.inherit = False
    return shape


def _card(slide, x, y, w, h):
    card = _flat(slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)))
    card.adjustments[0] = 0.06
    card.fill.solid()
    card.fill.fore_color.rgb = PANEL
    card.line.color.rgb = LINE
    return card


def _style_chart(chart):
    chart.has_title = False
    chart.font.name = FONT
    chart.font.size = Pt(12)
    chart.font.color.rgb = MUTED


def _doughnut(slide, names, values, colors, unit):
    data = CategoryChartData()
    data.categories = names
    data.add_series("Share", values)
    chart = slide.shapes.add_chart(XL_CHART_TYPE.DOUGHNUT, Inches(0.6), Inches(1.7), Inches(6.2), Inches(5.3), data).chart
    _style_chart(chart)
    chart.has_legend = False
    plot = chart.plots[0]
    plot.has_data_labels = True
    labels = plot.data_labels
    labels.show_percentage, labels.show_value, labels.show_category_name = True, False, False
    labels.number_format, labels.number_format_is_linked = "0%", False
    labels.font.size, labels.font.bold = Pt(12), True
    labels.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    for point, color in zip(plot.series[0].points, colors):
        point.format.fill.solid()
        point.format.fill.fore_color.rgb = RGBColor.from_string(color)
    total = sum(values) or 1
    for i, (name, value, color) in enumerate(zip(names, values, colors)):
        y = 2.2 + i * 0.62
        dot = _flat(slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.4), Inches(y + 0.07), Inches(0.22), Inches(0.22)))
        dot.fill.solid()
        dot.fill.fore_color.rgb = RGBColor.from_string(color)
        dot.line.fill.background()
        _text(slide, 7.8, y, 2.9, 0.4, name, 15)
        _text(slide, 10.3, y, 1.4, 0.4, unit(value), 15, color=MUTED, align=PP_ALIGN.RIGHT)
        _text(slide, 11.8, y, 0.9, 0.4, f"{round(value / total * 100)}%", 15, True, align=PP_ALIGN.RIGHT)


def dashboard_pptx(store: Store, data: dict, f: dict, labels: dict):
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
    kpi = data["kpi"]
    period = f"{pd.Timestamp(data['period']['start']):%d %b %Y} – {pd.Timestamp(data['period']['end']):%d %b %Y}"
    applied = " · ".join(f"{k}: {v}" for k, v in labels.items() if v) or "All shops, months, categories and machines"
    sub = f"{applied}  |  {period}"
    hrs = lambda m: f"{m / 60:,.1f} h"
    top = scope(store.breakdowns, f).groupby(["id", "name", "area"]).agg(minutes=("minutes", "sum"), events=("id", "size"))
    top = top.sort_values("minutes", ascending=False).head(10).reset_index()

    cover = prs.slides.add_slide(prs.slide_layouts[6])
    cover.shapes.add_picture(str(LOGO), Inches(0.8), Inches(0.8), height=Inches(0.9))
    _text(cover, 0.8, 2.6, 11.5, 1.0, "Maintenance reliability review", 40, True)
    _text(cover, 0.8, 3.6, 11.5, 0.5, applied, 18, color=MUTED)
    _text(cover, 0.8, 4.1, 11.5, 0.5, period, 18, color=MUTED)
    bar = _flat(cover.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.0), Inches(1.2), Inches(0.08)))
    bar.fill.solid()
    bar.fill.fore_color.rgb = RGBColor.from_string(BRAND)
    bar.line.fill.background()
    _text(cover, 0.8, 6.6, 11.5, 0.4, f"OMR Bagla Automotive Systems India Ltd.  ·  Generated {date.today():%d %b %Y}", 12, color=MUTED)

    slide = _slide(prs, "Headline numbers", sub)
    tiles = [
        ("Downtime", f"{kpi['downtime_h']:,.1f}", "h", f"{kpi['assets_hit']} of {kpi['assets_total']} assets affected"),
        ("Breakdowns", f"{kpi['events']:,}", "", "Logged in the period"),
        ("MTTR", "—" if kpi["mttr_min"] is None else f"{kpi['mttr_min']:,}", "min", "Mean time to repair"),
        ("MTBF", "—" if kpi["mtbf_h"] is None else f"{kpi['mtbf_h']:,.1f}", "h", "Mean time between failures, 24 h run"),
    ]
    for i, (label, value, unit, note) in enumerate(tiles):
        x = 0.6 + i * 3.08
        _card(slide, x, 1.8, 2.85, 2.3)
        _text(slide, x + 0.3, 2.05, 2.3, 0.4, label, 15, True, MUTED)
        _text(slide, x + 0.3, 2.6, 2.3, 0.9, f"{value} {unit}".strip(), 36, True)
        _text(slide, x + 0.3, 3.5, 2.3, 0.5, note, 12, color=MUTED)
    worst = max(data["monthly"], key=lambda m: m["downtime_h"], default=None)
    biggest = max(data["categories"], key=lambda c: c["minutes"], default=None)
    total_min = sum(c["minutes"] for c in data["categories"]) or 1
    takeaways = [
        ("Worst month", f"{pd.Timestamp(worst['month'] + '-01'):%B %Y}" if worst and worst["downtime_h"] else "—",
         f"{worst['downtime_h']:,.1f} h of downtime" if worst and worst["downtime_h"] else "No downtime"),
        ("Largest category", biggest["name"] if biggest and biggest["minutes"] else "—",
         f"{round(biggest['minutes'] / total_min * 100)}% of downtime" if biggest and biggest["minutes"] else "No downtime"),
        ("Most downtime", f"{top.iloc[0]['id']} · {top.iloc[0]['name']}" if len(top) else "—",
         f"{hrs(top.iloc[0]['minutes'])} across {int(top.iloc[0]['events'])} breakdowns" if len(top) else "No downtime"),
    ]
    for i, (label, head, note) in enumerate(takeaways):
        x = 0.6 + i * 4.11
        _card(slide, x, 4.45, 3.88, 2.15)
        _text(slide, x + 0.3, 4.7, 3.3, 0.4, label, 13, True, MUTED)
        _text(slide, x + 0.3, 5.15, 3.3, 0.8, head, 20, True)
        _text(slide, x + 0.3, 6.0, 3.3, 0.4, note, 12, color=MUTED)

    slide = _slide(prs, "Downtime by month", sub)
    chart_data = CategoryChartData()
    chart_data.categories = [pd.Timestamp(f"{m['month']}-01").strftime("%b %y") for m in data["monthly"]]
    chart_data.add_series("Downtime (h)", [m["downtime_h"] for m in data["monthly"]])
    chart = slide.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(0.6), Inches(1.7), Inches(12.1), Inches(5.4), chart_data).chart
    _style_chart(chart)
    chart.has_legend = False
    plot = chart.plots[0]
    plot.gap_width = 70
    plot.series[0].format.fill.solid()
    plot.series[0].format.fill.fore_color.rgb = RGBColor.from_string(BRAND)
    plot.has_data_labels = True
    plot.data_labels.number_format, plot.data_labels.number_format_is_linked = "0", False
    plot.data_labels.position = XL_LABEL_POSITION.OUTSIDE_END
    plot.data_labels.font.size = Pt(11)
    chart.value_axis.has_major_gridlines = True
    chart.value_axis.major_gridlines.format.line.color.rgb = LINE
    chart.value_axis.format.line.fill.background()
    chart.category_axis.format.line.color.rgb = LINE
    chart.value_axis.tick_labels.font.size = Pt(11)

    slide = _slide(prs, "Downtime by breakdown category", sub)
    cats = sorted(data["categories"], key=lambda c: -c["minutes"])
    if any(c["minutes"] for c in cats):
        order = sorted(c["name"] for c in data["categories"])
        _doughnut(slide, [c["name"] for c in cats], [c["minutes"] for c in cats], [CATS[order.index(c["name"]) % 6] for c in cats], hrs)
    else:
        _text(slide, 0.6, 3.5, 12, 0.6, "No breakdowns match these filters.", 18, color=MUTED)

    slide = _slide(prs, "Where repair time goes", sub)
    phases = [(label, kpi["phases"][key], color) for key, label, color in PHASES]
    if sum(v for _, v, _ in phases):
        _doughnut(slide, [p[0] for p in phases], [p[1] for p in phases], [p[2] for p in phases], hrs)
    else:
        _text(slide, 0.6, 3.5, 12, 0.6, "No repair time in this selection.", 18, color=MUTED)

    slide = _slide(prs, "Machines with the most downtime", sub)
    if len(top):
        table = slide.shapes.add_table(len(top) + 1, 6, Inches(0.6), Inches(1.75), Inches(12.1), Inches(0.42 * (len(top) + 1))).table
        widths = [0.6, 1.3, 4.6, 2.0, 1.7, 1.9]
        heads = ["#", "Asset ID", "Machine", "Shop", "Breakdowns", "Downtime"]
        for c, (w, h) in enumerate(zip(widths, heads)):
            table.columns[c].width = Inches(w)
        rows = [[str(i + 1), r.id, r.name, r.area, str(int(r.events)), hrs(r.minutes)] for i, r in enumerate(top.itertuples())]
        for r, values in enumerate([heads, *rows]):
            for c, value in enumerate(values):
                cell = table.cell(r, c)
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor.from_string(BRAND) if r == 0 else (PANEL if r % 2 == 0 else RGBColor(0xFF, 0xFF, 0xFF))
                tf = cell.text_frame
                tf.text = value
                para = tf.paragraphs[0]
                para.alignment = PP_ALIGN.RIGHT if c >= 4 else PP_ALIGN.LEFT
                run = para.runs[0]
                run.font.name, run.font.size, run.font.bold = FONT, Pt(13), r == 0
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF) if r == 0 else INK
                cell.vertical_anchor = MSO_ANCHOR.MIDDLE
    else:
        _text(slide, 0.6, 3.5, 12, 0.6, "No breakdowns match these filters.", 18, color=MUTED)

    out = BytesIO()
    prs.save(out)
    return out.getvalue()

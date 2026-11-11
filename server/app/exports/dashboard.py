from datetime import date
from io import BytesIO

import pandas as pd
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from app.analytics import scope
from app.store import Store
from app.exports.slides import (add_card, add_doughnut, add_text, new_slide, no_shadow,
                     style_chart)
from app.exports.theme import (BRAND, BRAND_NAME, BRAND_RGB, CATS, FONT, INK,
                               LINE, MUTED, PANEL, PHASES, WHITE)


def dashboard_pptx(store: Store, data: dict, f: dict, labels: dict):
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
    kpi = data["kpi"]
    period = f"{pd.Timestamp(data['period']['start']):%d %b %Y} – {pd.Timestamp(data['period']['end']):%d %b %Y}"
    applied = (
        " · ".join(f"{k}: {v}" for k, v in labels.items() if v)
        or "All shops, months, categories and machines"
    )
    sub = f"{applied}  |  {period}"
    hrs = lambda m: f"{m / 60:,.1f} h"
    top = (
        scope(store.breakdowns, f)
        .groupby(["id", "name", "area"])
        .agg(minutes=("minutes", "sum"), events=("id", "size"))
    )
    top = top.sort_values("minutes", ascending=False).head(10).reset_index()

    cover = prs.slides.add_slide(prs.slide_layouts[6])
    add_text(cover, 0.8, 0.8, 6.0, 0.9, BRAND_NAME, 48, True, BRAND_RGB)
    add_text(cover, 0.8, 2.6, 11.5, 1.0, "Maintenance reliability review", 40, True)
    add_text(cover, 0.8, 3.6, 11.5, 0.5, applied, 18, color=MUTED)
    add_text(cover, 0.8, 4.1, 11.5, 0.5, period, 18, color=MUTED)
    bar = no_shadow(
        cover.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.0), Inches(1.2), Inches(0.08)
        )
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = RGBColor.from_string(BRAND)
    bar.line.fill.background()
    add_text(
        cover,
        0.8,
        6.6,
        11.5,
        0.4,
        f"{BRAND_NAME}  ·  Generated {date.today():%d %b %Y}",
        12,
        color=MUTED,
    )

    slide = new_slide(prs, "Headline numbers", sub)
    tiles = [
        (
            "Downtime",
            f"{kpi['downtime_h']:,.1f}",
            "h",
            f"{kpi['assets_hit']} of {kpi['assets_total']} assets affected",
        ),
        ("Breakdowns", f"{kpi['events']:,}", "", "Logged in the period"),
        (
            "MTTR",
            "—" if kpi["mttr_min"] is None else f"{kpi['mttr_min']:,}",
            "min",
            "Mean time to repair",
        ),
        (
            "MTBF",
            "—" if kpi["mtbf_h"] is None else f"{kpi['mtbf_h']:,.1f}",
            "h",
            "Mean time between failures, 24 h run",
        ),
    ]
    for i, (label, value, unit, note) in enumerate(tiles):
        x = 0.6 + i * 3.08
        add_card(slide, x, 1.8, 2.85, 2.3)
        add_text(slide, x + 0.3, 2.05, 2.3, 0.4, label, 15, True, MUTED)
        add_text(slide, x + 0.3, 2.6, 2.3, 0.9, f"{value} {unit}".strip(), 36, True)
        add_text(slide, x + 0.3, 3.5, 2.3, 0.5, note, 12, color=MUTED)
    worst = max(data["monthly"], key=lambda m: m["downtime_h"], default=None)
    biggest = max(data["categories"], key=lambda c: c["minutes"], default=None)
    total_min = sum(c["minutes"] for c in data["categories"]) or 1
    takeaways = [
        (
            "Worst month",
            (
                f"{pd.Timestamp(worst['month'] + '-01'):%B %Y}"
                if worst and worst["downtime_h"]
                else "—"
            ),
            (
                f"{worst['downtime_h']:,.1f} h of downtime"
                if worst and worst["downtime_h"]
                else "No downtime"
            ),
        ),
        (
            "Largest category",
            biggest["name"] if biggest and biggest["minutes"] else "—",
            (
                f"{round(biggest['minutes'] / total_min * 100)}% of downtime"
                if biggest and biggest["minutes"]
                else "No downtime"
            ),
        ),
        (
            "Most downtime",
            f"{top.iloc[0]['id']} · {top.iloc[0]['name']}" if len(top) else "—",
            (
                f"{hrs(top.iloc[0]['minutes'])} across {int(top.iloc[0]['events'])} breakdowns"
                if len(top)
                else "No downtime"
            ),
        ),
    ]
    for i, (label, head, note) in enumerate(takeaways):
        x = 0.6 + i * 4.11
        add_card(slide, x, 4.45, 3.88, 2.15)
        add_text(slide, x + 0.3, 4.7, 3.3, 0.4, label, 13, True, MUTED)
        add_text(slide, x + 0.3, 5.15, 3.3, 0.8, head, 20, True)
        add_text(slide, x + 0.3, 6.0, 3.3, 0.4, note, 12, color=MUTED)

    slide = new_slide(prs, "Downtime by month", sub)
    chart_data = CategoryChartData()
    chart_data.categories = [
        pd.Timestamp(f"{m['month']}-01").strftime("%b %y") for m in data["monthly"]
    ]
    chart_data.add_series("Downtime (h)", [m["downtime_h"] for m in data["monthly"]])
    chart = slide.shapes.add_chart(
        XL_CHART_TYPE.COLUMN_CLUSTERED,
        Inches(0.6),
        Inches(1.7),
        Inches(12.1),
        Inches(5.4),
        chart_data,
    ).chart
    style_chart(chart)
    chart.has_legend = False
    plot = chart.plots[0]
    plot.gap_width = 70
    plot.series[0].format.fill.solid()
    plot.series[0].format.fill.fore_color.rgb = RGBColor.from_string(BRAND)
    plot.has_data_labels = True
    plot.data_labels.number_format, plot.data_labels.number_format_is_linked = (
        "0",
        False,
    )
    plot.data_labels.position = XL_LABEL_POSITION.OUTSIDE_END
    plot.data_labels.font.size = Pt(11)
    chart.value_axis.has_major_gridlines = True
    chart.value_axis.major_gridlines.format.line.color.rgb = LINE
    chart.value_axis.format.line.fill.background()
    chart.category_axis.format.line.color.rgb = LINE
    chart.value_axis.tick_labels.font.size = Pt(11)

    slide = new_slide(prs, "Downtime by breakdown category", sub)
    cats = sorted(data["categories"], key=lambda c: -c["minutes"])
    if any(c["minutes"] for c in cats):
        order = sorted(c["name"] for c in data["categories"])
        add_doughnut(
            slide,
            [c["name"] for c in cats],
            [c["minutes"] for c in cats],
            [CATS[order.index(c["name"]) % 6] for c in cats],
            hrs,
        )
    else:
        add_text(
            slide,
            0.6,
            3.5,
            12,
            0.6,
            "No breakdowns match these filters.",
            18,
            color=MUTED,
        )

    slide = new_slide(prs, "Where repair time goes", sub)
    phases = [(label, kpi["phases"][key], color) for key, label, color in PHASES]
    if sum(v for _, v, _ in phases):
        add_doughnut(
            slide,
            [p[0] for p in phases],
            [p[1] for p in phases],
            [p[2] for p in phases],
            hrs,
        )
    else:
        add_text(
            slide,
            0.6,
            3.5,
            12,
            0.6,
            "No repair time in this selection.",
            18,
            color=MUTED,
        )

    slide = new_slide(prs, "Machines with the most downtime", sub)
    if len(top):
        table = slide.shapes.add_table(
            len(top) + 1,
            6,
            Inches(0.6),
            Inches(1.75),
            Inches(12.1),
            Inches(0.42 * (len(top) + 1)),
        ).table
        widths = [0.6, 1.3, 4.6, 2.0, 1.7, 1.9]
        heads = ["#", "Asset ID", "Machine", "Shop", "Breakdowns", "Downtime"]
        for c, (w, h) in enumerate(zip(widths, heads)):
            table.columns[c].width = Inches(w)
        rows = [
            [str(i + 1), r.id, r.name, r.area, str(int(r.events)), hrs(r.minutes)]
            for i, r in enumerate(top.itertuples())
        ]
        for r, values in enumerate([heads, *rows]):
            for c, value in enumerate(values):
                cell = table.cell(r, c)
                cell.fill.solid()
                cell.fill.fore_color.rgb = (
                    RGBColor.from_string(BRAND)
                    if r == 0
                    else (PANEL if r % 2 == 0 else WHITE)
                )
                tf = cell.text_frame
                tf.text = value
                para = tf.paragraphs[0]
                para.alignment = PP_ALIGN.RIGHT if c >= 4 else PP_ALIGN.LEFT
                run = para.runs[0]
                run.font.name, run.font.size, run.font.bold = FONT, Pt(13), r == 0
                run.font.color.rgb = WHITE if r == 0 else INK
                cell.vertical_anchor = MSO_ANCHOR.MIDDLE
    else:
        add_text(
            slide,
            0.6,
            3.5,
            12,
            0.6,
            "No breakdowns match these filters.",
            18,
            color=MUTED,
        )

    out = BytesIO()
    prs.save(out)
    return out.getvalue()

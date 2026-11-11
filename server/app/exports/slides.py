from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from .theme import FONT, INK, LINE, LOGO, MUTED, PANEL, WHITE


def add_text(
    slide,
    x,
    y,
    w,
    h,
    text,
    size=14,
    bold=False,
    color=INK,
    align=PP_ALIGN.LEFT,
    anchor=MSO_ANCHOR.TOP,
):
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


def new_slide(prs, title, sub):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_text(slide, 0.6, 0.45, 10.5, 0.6, title, 28, True)
    add_text(slide, 0.6, 1.05, 10.5, 0.4, sub, 13, color=MUTED)
    slide.shapes.add_picture(str(LOGO), Inches(11.55), Inches(0.5), height=Inches(0.5))
    return slide


def no_shadow(shape):
    shape.shadow.inherit = False
    return shape


def add_card(slide, x, y, w, h):
    card = no_shadow(
        slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)
        )
    )
    card.adjustments[0] = 0.06
    card.fill.solid()
    card.fill.fore_color.rgb = PANEL
    card.line.color.rgb = LINE
    return card


def style_chart(chart):
    chart.has_title = False
    chart.font.name = FONT
    chart.font.size = Pt(12)
    chart.font.color.rgb = MUTED


def add_doughnut(slide, names, values, colors, unit):
    data = CategoryChartData()
    data.categories = names
    data.add_series("Share", values)
    chart = slide.shapes.add_chart(
        XL_CHART_TYPE.DOUGHNUT, Inches(0.6), Inches(1.7), Inches(6.2), Inches(5.3), data
    ).chart
    style_chart(chart)
    chart.has_legend = False
    plot = chart.plots[0]
    plot.has_data_labels = True
    labels = plot.data_labels
    labels.show_percentage, labels.show_value, labels.show_category_name = (
        True,
        False,
        False,
    )
    labels.number_format, labels.number_format_is_linked = "0%", False
    labels.font.size, labels.font.bold = Pt(12), True
    labels.font.color.rgb = WHITE
    for point, color in zip(plot.series[0].points, colors):
        point.format.fill.solid()
        point.format.fill.fore_color.rgb = RGBColor.from_string(color)
    total = sum(values) or 1
    for i, (name, value, color) in enumerate(zip(names, values, colors)):
        y = 2.2 + i * 0.62
        dot = no_shadow(
            slide.shapes.add_shape(
                MSO_SHAPE.ROUNDED_RECTANGLE,
                Inches(7.4),
                Inches(y + 0.07),
                Inches(0.22),
                Inches(0.22),
            )
        )
        dot.fill.solid()
        dot.fill.fore_color.rgb = RGBColor.from_string(color)
        dot.line.fill.background()
        add_text(slide, 7.8, y, 2.9, 0.4, name, 15)
        add_text(
            slide, 10.3, y, 1.4, 0.4, unit(value), 15, color=MUTED, align=PP_ALIGN.RIGHT
        )
        add_text(
            slide,
            11.8,
            y,
            0.9,
            0.4,
            f"{round(value / total * 100)}%",
            15,
            True,
            align=PP_ALIGN.RIGHT,
        )

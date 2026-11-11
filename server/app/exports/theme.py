from pathlib import Path

from pptx.dml.color import RGBColor

LOGO = Path(__file__).parent.parent / "assets" / "omr-mark.png"

BRAND = "0091D0"
INK = RGBColor(0x0F, 0x21, 0x30)
MUTED = RGBColor(0x5D, 0x6B, 0x76)
LINE = RGBColor(0xE2, 0xE8, 0xED)
PANEL = RGBColor(0xF8, 0xFA, 0xFB)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
CATS = ["2A78D6", "EB6834", "1BAF7A", "EDA100", "E87BA4", "008300"]
PHASES = [
    ("diagnose", "Diagnosis", "2A78D6"),
    ("spares", "Spares arrangement", "EB6834"),
    ("wrench", "Wrench time", "199E70"),
]
FONT = "Segoe UI"

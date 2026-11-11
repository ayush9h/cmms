PHASES = ("diagnose", "spares", "wrench")

SHOPS = ("Machine Shop", "PDC", "Utility")
CLASSES = ("Material Handling", "Production", "Utility")
CATEGORIES = (
    "Electrical",
    "Electronics",
    "Hydraulic",
    "Mechanical",
    "Pneumatics",
    "Utility",
)
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

CAUSES = (
    ("rej_production", "Production"),
    ("rej_die", "Die Maintenance"),
    ("rej_machine", "Machine Maintenance"),
    ("rej_quality", "Quality"),
    ("rej_engineering", "Engineering"),
    ("rej_incoming", "Incoming Material"),
)

CAUSE_KEYS = [key for key, _ in CAUSES]

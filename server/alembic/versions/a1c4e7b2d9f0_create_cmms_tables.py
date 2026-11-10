from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "a1c4e7b2d9f0"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assets",
        sa.Column("id", sa.String(length=20), nullable=False),
        sa.Column("sno", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("area", sa.String(length=60), nullable=False),
        sa.Column("oem", sa.String(length=60), nullable=False),
        sa.Column("installed", sa.Date(), nullable=False),
        sa.Column("application", sa.String(length=60), nullable=False),
        sa.Column("cls", sa.String(length=40), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_assets_area", "assets", ["area"])

    op.create_table(
        "breakdowns",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("asset_id", sa.String(length=20), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("problem", sa.String(length=120), nullable=False),
        sa.Column("start", sa.Time(), nullable=False),
        sa.Column("stop", sa.Time(), nullable=False),
        sa.Column("diagnose", sa.Integer(), nullable=False),
        sa.Column("spares", sa.Integer(), nullable=False),
        sa.Column("wrench", sa.Integer(), nullable=False),
        sa.Column("remarks", sa.String(length=500), nullable=False),
        sa.Column("action", sa.String(length=500), nullable=False),
        sa.Column("entered_by", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_breakdowns_date", "breakdowns", ["date"])
    op.create_index("ix_breakdowns_asset_id", "breakdowns", ["asset_id"])

    op.create_table(
        "rejections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("shift", sa.String(length=1), nullable=False),
        sa.Column("asset_id", sa.String(length=20), nullable=False),
        sa.Column("part", sa.String(length=60), nullable=False),
        sa.Column("defect", sa.String(length=40), nullable=False),
        sa.Column("disposition", sa.String(length=10), nullable=False),
        sa.Column("entered_by", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rejections_date", "rejections", ["date"])
    op.create_index("ix_rejections_asset_id", "rejections", ["asset_id"])


def downgrade() -> None:
    op.drop_table("rejections")
    op.drop_table("breakdowns")
    op.drop_table("assets")

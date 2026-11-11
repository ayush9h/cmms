from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "d4f9b6e2a8c3"
down_revision: Union[str, Sequence[str], None] = "c3e8a5d1f7b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("rejections") as batch:
        batch.drop_column("target")
    op.create_table(
        "ppc_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("shift", sa.String(length=1), nullable=False),
        sa.Column("asset_id", sa.String(length=20), nullable=False),
        sa.Column("shift_minutes", sa.Integer(), nullable=False),
        sa.Column("short_breaks", sa.Integer(), nullable=False),
        sa.Column("short_break_minutes", sa.Integer(), nullable=False),
        sa.Column("meal_breaks", sa.Integer(), nullable=False),
        sa.Column("meal_break_minutes", sa.Integer(), nullable=False),
        sa.Column("downtime_minutes", sa.Integer(), nullable=False),
        sa.Column("ideal_rate", sa.Float(), nullable=False),
        sa.Column("total_pieces", sa.Integer(), nullable=False),
        sa.Column("reject_pieces", sa.Integer(), nullable=False),
        sa.Column("entered_by", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ppc_entries_date", "ppc_entries", ["date"])
    op.create_index("ix_ppc_entries_asset_id", "ppc_entries", ["asset_id"])


def downgrade() -> None:
    op.drop_table("ppc_entries")
    with op.batch_alter_table("rejections") as batch:
        batch.add_column(sa.Column("target", sa.Integer(), nullable=False, server_default="0"))

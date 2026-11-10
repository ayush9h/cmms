from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "b7d2f4a9c1e3"
down_revision: Union[str, Sequence[str], None] = "a1c4e7b2d9f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

QUANTITIES = ("produced", "rej_production", "rej_die", "rej_machine", "rej_quality", "rej_engineering", "rej_incoming")


def shift_for(start) -> str:
    hour = start.hour if hasattr(start, "hour") else int(str(start)[:2])
    return "A" if 6 <= hour < 14 else "B" if 14 <= hour < 22 else "C"


def upgrade() -> None:
    with op.batch_alter_table("breakdowns") as batch:
        batch.add_column(sa.Column("shift", sa.String(length=1), nullable=False, server_default=""))
    with op.batch_alter_table("rejections") as batch:
        for name in QUANTITIES:
            batch.add_column(sa.Column(name, sa.Integer(), nullable=False, server_default="0"))

    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, start FROM breakdowns")).fetchall()
    for row_id, start in rows:
        bind.execute(sa.text("UPDATE breakdowns SET shift = :shift WHERE id = :id"), {"shift": shift_for(start), "id": row_id})


def downgrade() -> None:
    with op.batch_alter_table("rejections") as batch:
        for name in QUANTITIES:
            batch.drop_column(name)
    with op.batch_alter_table("breakdowns") as batch:
        batch.drop_column("shift")

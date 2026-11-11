import json
from datetime import date, timedelta
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "a7c3e9f5b1d6"
down_revision: Union[str, Sequence[str], None] = "f6b2d8a4c0e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def as_date(v):
    return v if isinstance(v, date) else date.fromisoformat(str(v)[:10])


def upgrade() -> None:
    with op.batch_alter_table("ppc_entries") as batch:
        batch.add_column(
            sa.Column("running", sa.Text(), nullable=False, server_default="{}")
        )
    bind = op.get_bind()
    for row_id, first, last, days, shift in bind.execute(
        sa.text("SELECT id, date_from, date_to, working_days, shift FROM ppc_entries")
    ).fetchall():
        first, last = as_date(first), as_date(last)
        span = [first + timedelta(d) for d in range((last - first).days + 1)]
        picked = ([d for d in span if d.weekday() < 5] or span)[:days]
        running = json.dumps({d.isoformat(): [shift] for d in picked})
        bind.execute(
            sa.text("UPDATE ppc_entries SET running = :running WHERE id = :id"),
            {"running": running, "id": row_id},
        )
    with op.batch_alter_table("ppc_entries") as batch:
        batch.drop_column("shift")
        batch.drop_column("working_days")


def downgrade() -> None:
    with op.batch_alter_table("ppc_entries") as batch:
        batch.add_column(
            sa.Column("shift", sa.String(length=1), nullable=False, server_default="A")
        )
        batch.add_column(
            sa.Column("working_days", sa.Integer(), nullable=False, server_default="1")
        )
    bind = op.get_bind()
    for row_id, running in bind.execute(
        sa.text("SELECT id, running FROM ppc_entries")
    ).fetchall():
        slots = json.loads(running or "{}")
        shifts = sorted({s for day in slots.values() for s in day}) or ["A"]
        bind.execute(
            sa.text(
                "UPDATE ppc_entries SET shift = :shift, working_days = :days WHERE id = :id"
            ),
            {"shift": shifts[0], "days": max(1, len(slots)), "id": row_id},
        )
    with op.batch_alter_table("ppc_entries") as batch:
        batch.drop_column("running")

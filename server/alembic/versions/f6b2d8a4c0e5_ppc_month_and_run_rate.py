from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "f6b2d8a4c0e5"
down_revision: Union[str, Sequence[str], None] = "e5a1c7f3b9d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("assets") as batch:
        batch.add_column(sa.Column("run_rate", sa.Float(), nullable=True))
    with op.batch_alter_table("ppc_entries") as batch:
        batch.add_column(sa.Column("date_from", sa.Date(), nullable=True))
        batch.add_column(sa.Column("date_to", sa.Date(), nullable=True))
        batch.add_column(sa.Column("working_days", sa.Integer(), nullable=False, server_default="1"))
    op.execute("UPDATE ppc_entries SET date_from = date, date_to = date")
    op.drop_index("ix_ppc_entries_date", table_name="ppc_entries")
    with op.batch_alter_table("ppc_entries") as batch:
        batch.alter_column("date_from", existing_type=sa.Date(), nullable=False)
        batch.alter_column("date_to", existing_type=sa.Date(), nullable=False)
        batch.drop_column("date")
    op.create_index("ix_ppc_entries_date_from", "ppc_entries", ["date_from"])


def downgrade() -> None:
    op.drop_index("ix_ppc_entries_date_from", table_name="ppc_entries")
    with op.batch_alter_table("ppc_entries") as batch:
        batch.add_column(sa.Column("date", sa.Date(), nullable=True))
    op.execute("UPDATE ppc_entries SET date = date_from")
    with op.batch_alter_table("ppc_entries") as batch:
        batch.alter_column("date", existing_type=sa.Date(), nullable=False)
        batch.drop_column("working_days")
        batch.drop_column("date_to")
        batch.drop_column("date_from")
    op.create_index("ix_ppc_entries_date", "ppc_entries", ["date"])
    with op.batch_alter_table("assets") as batch:
        batch.drop_column("run_rate")

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "e5a1c7f3b9d4"
down_revision: Union[str, Sequence[str], None] = "d4f9b6e2a8c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LINKED = ("downtime_minutes", "total_pieces", "reject_pieces")


def upgrade() -> None:
    with op.batch_alter_table("ppc_entries") as batch:
        for name in LINKED:
            batch.drop_column(name)


def downgrade() -> None:
    with op.batch_alter_table("ppc_entries") as batch:
        for name in LINKED:
            batch.add_column(sa.Column(name, sa.Integer(), nullable=False, server_default="0"))

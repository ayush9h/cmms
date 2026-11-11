from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "c3e8a5d1f7b2"
down_revision: Union[str, Sequence[str], None] = "b7d2f4a9c1e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("rejections") as batch:
        batch.add_column(
            sa.Column("target", sa.Integer(), nullable=False, server_default="0")
        )


def downgrade() -> None:
    with op.batch_alter_table("rejections") as batch:
        batch.drop_column("target")

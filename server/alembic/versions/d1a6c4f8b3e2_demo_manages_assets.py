from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "d1a6c4f8b3e2"
down_revision: Union[str, Sequence[str], None] = "c9f1a3d7e4b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# The demo account is on the free tier, which now carries an allowance of
# app.auth.FREE_ASSETS assets. Registering one is manager-only, so the demo
# needs that role to use the allowance at all. require_manager guards nothing
# but asset create and edit, so this grants no other privilege.
DEMO = "demo"

users = sa.table("users", sa.column("id", sa.String), sa.column("role", sa.String))


def upgrade() -> None:
    op.execute(users.update().where(users.c.id == DEMO).values(role="manager"))


def downgrade() -> None:
    op.execute(users.update().where(users.c.id == DEMO).values(role="employee"))

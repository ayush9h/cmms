from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "c9f1a3d7e4b8"
down_revision: Union[str, Sequence[str], None] = "b8c4d1e9f2a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Accounts that keep the full product. Everyone else lands on the free tier.
PREMIUM = ("ayushkumar", "surendranath")

# Password is "demo1234"; scrypt, see app.auth.verify_password.
DEMO = {
    "id": "demo",
    "name": "Demo User",
    "email": "demo@cmms.local",
    "role": "employee",
    "tier": "free",
    "password_hash": (
        "scrypt$62658af887c6951a48b8aecd6e3a4e08$"
        "604a6f10041e2c85133c271971fa363e292a1cd0de75c4caec83ceb2364b2067"
    ),
}


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "tier",
            sa.String(length=20),
            nullable=False,
            server_default="free",
        ),
    )
    users = sa.table(
        "users",
        sa.column("id", sa.String),
        sa.column("name", sa.String),
        sa.column("email", sa.String),
        sa.column("role", sa.String),
        sa.column("tier", sa.String),
        sa.column("password_hash", sa.String),
    )
    op.execute(
        users.update().where(users.c.id.in_(PREMIUM)).values(tier="premium")
    )
    # re-runnable on a database that already has the demo account
    op.execute(users.delete().where(users.c.id == DEMO["id"]))
    op.bulk_insert(users, [DEMO])


def downgrade() -> None:
    users = sa.table("users", sa.column("id", sa.String))
    op.execute(users.delete().where(users.c.id == DEMO["id"]))
    op.drop_column("users", "tier")

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "b8c4d1e9f2a7"
down_revision: Union[str, Sequence[str], None] = "a7c3e9f5b1d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Seeded here so a fresh deployment can sign in; hashes are scrypt, see app.auth.verify_password.
SEED = [
    {
        "id": "ayushkumar",
        "name": "Ayush Kumar",
        "email": "ayushkumarlfs2@gmail.com",
        "role": "employee",
        "password_hash": "scrypt$4ca673bff8f1bfa5a74c8734804f1668$f8168c8c1b2555dd732262c45c48e58f8b9298bcf8f2bdaca5844f8c5709b35c",
    },
    {
        "id": "surendranath",
        "name": "Surendra Nath",
        "email": "surendra.nath.ayush@gmail.com",
        "role": "manager",
        "password_hash": "scrypt$bc763bcce21aaca72620eef0392eb7cd$5d13912740aaa1f9875e531f7df5d3252c310c7f15fa6a1ac27cc9ac10d7d7b3",
    },
]


def upgrade() -> None:
    users = op.create_table(
        "users",
        sa.Column("id", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("password_hash", sa.String(length=160), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.bulk_insert(users, SEED)


def downgrade() -> None:
    op.drop_table("users")

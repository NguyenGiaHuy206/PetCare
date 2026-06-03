"""Add categories table

Revision ID: 004_add_categories
Revises: 003_add_cart_tables
Create Date: 2026-05-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "004_add_categories"
down_revision = "003_add_cart_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if not inspector.has_table("categories"):
        op.create_table(
            "categories",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name"),
        )

    existing_indexes = {index["name"] for index in inspector.get_indexes("categories")}
    index_name = op.f("ix_categories_name")
    if index_name not in existing_indexes:
        op.create_index(index_name, "categories", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_categories_name"), table_name="categories")
    op.drop_table("categories")
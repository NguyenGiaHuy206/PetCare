"""Fix category uniqueness to be scope-aware

Revision ID: 006_fix_category_scope
Revises: 005_scoped_catalog
Create Date: 2026-05-03 00:00:00.000000

"""

from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "006_fix_category_scope"
down_revision = "005_scoped_catalog"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    indexes = {idx["name"]: idx for idx in inspector.get_indexes("categories")}

    # Remove legacy unique index by name, then recreate as non-unique.
    if "ix_categories_name" in indexes:
        op.drop_index("ix_categories_name", table_name="categories")
    op.create_index("ix_categories_name", "categories", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_categories_name", table_name="categories")
    op.create_index("ix_categories_name", "categories", ["name"], unique=True)

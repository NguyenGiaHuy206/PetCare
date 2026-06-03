"""Add user phone and address fields

Revision ID: 009_add_user_contact_fields
Revises: 008_add_product_duration_minutes
Create Date: 2026-06-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "009_add_user_contact_fields"
down_revision = "008_add_product_duration_minutes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("address", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "address")
    op.drop_column("users", "phone")
"""add optional product duration minutes

Revision ID: 008_add_product_duration_minutes
Revises: 007_booking_service_text
Create Date: 2026-05-04 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "008_add_product_duration_minutes"
down_revision = "007_booking_service_text"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("duration_minutes", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "duration_minutes")

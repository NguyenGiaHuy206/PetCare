"""convert booking service to text

Revision ID: 007_booking_service_text
Revises: 006_fix_category_scope_uniqueness
Create Date: 2026-05-04
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "007_booking_service_text"
down_revision = "006_fix_category_scope"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "bookings",
        "service",
        existing_type=sa.Enum("grooming", "boarding", "bathing", name="bookingservice"),
        type_=sa.String(length=255),
        existing_nullable=False,
        postgresql_using="service::text",
    )


def downgrade() -> None:
    op.alter_column(
        "bookings",
        "service",
        existing_type=sa.String(length=255),
        type_=sa.Enum("grooming", "boarding", "bathing", name="bookingservice"),
        existing_nullable=False,
        postgresql_using="service::bookingservice",
    )
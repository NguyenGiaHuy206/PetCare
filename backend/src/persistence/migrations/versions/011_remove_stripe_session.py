"""Remove legacy payment session field

Revision ID: 011_remove_stripe_session
Revises: 010_email_shipping_notifications
Create Date: 2026-06-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "011_remove_stripe_session"
down_revision = "010_email_shipping_notifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("orders", "stripe_session_id")


def downgrade() -> None:
    op.add_column("orders", sa.Column("stripe_session_id", sa.String(length=255), nullable=True, unique=True))

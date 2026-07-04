"""Add order payment state

Revision ID: 013_add_order_payment_state
Revises: 012_add_user_avatar_url
Create Date: 2026-06-04
"""

from alembic import op
import sqlalchemy as sa


revision = "013_add_order_payment_state"
down_revision = "012_add_user_avatar_url"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("payment_method", sa.String(length=20), nullable=False, server_default="vnpay"))
    op.add_column("orders", sa.Column("payment_status", sa.String(length=30), nullable=False, server_default="pending"))
    op.execute("UPDATE orders SET payment_status = 'paid' WHERE status IN ('paid', 'shipped', 'delivered')")
    op.execute("UPDATE orders SET status = 'pending' WHERE status = 'paid'")


def downgrade() -> None:
    op.drop_column("orders", "payment_status")
    op.drop_column("orders", "payment_method")

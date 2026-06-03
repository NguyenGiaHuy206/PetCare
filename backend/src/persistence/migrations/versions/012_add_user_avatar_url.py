"""Add user avatar url

Revision ID: 012_add_user_avatar_url
Revises: 011_remove_stripe_session
Create Date: 2026-06-03
"""

from alembic import op
import sqlalchemy as sa


revision = "012_add_user_avatar_url"
down_revision = "011_remove_stripe_session"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_url")

"""Add email verification, product package fields, and notifications

Revision ID: 010_email_shipping_notifications
Revises: 009_add_user_contact_fields
Create Date: 2026-06-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "010_email_shipping_notifications"
down_revision = "009_add_user_contact_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("email_verification_code_hash", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("email_verification_expires_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("products", sa.Column("package_weight_gram", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("products", sa.Column("package_length_cm", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("products", sa.Column("package_width_cm", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("products", sa.Column("package_height_cm", sa.Integer(), nullable=False, server_default="0"))

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)
    op.create_index(op.f("ix_notifications_type"), "notifications", ["type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_notifications_type"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_table("notifications")
    op.drop_column("products", "package_height_cm")
    op.drop_column("products", "package_width_cm")
    op.drop_column("products", "package_length_cm")
    op.drop_column("products", "package_weight_gram")
    op.drop_column("users", "email_verification_expires_at")
    op.drop_column("users", "email_verification_code_hash")
    op.drop_column("users", "is_email_verified")

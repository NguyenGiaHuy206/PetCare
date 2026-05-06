"""Add cart tables

Revision ID: 003_add_cart_tables
Revises: 002_add_pet_fields
Create Date: 2026-05-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "003_add_cart_tables"
down_revision = "002_add_pet_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create carts table
    op.create_table(
        "carts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_carts_user_id"), "carts", ["user_id"], unique=False)

    # Create cart_items table
    op.create_table(
        "cart_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cart_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("price_at_add", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["cart_id"], ["carts.id"],
                                ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"],
                                ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_cart_items_cart_id"), "cart_items",
                    ["cart_id"], unique=False)
    op.create_index(op.f("ix_cart_items_product_id"), "cart_items",
                    ["product_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_cart_items_product_id"), table_name="cart_items")
    op.drop_index(op.f("ix_cart_items_cart_id"), table_name="cart_items")
    op.drop_table("cart_items")
    op.drop_index(op.f("ix_carts_user_id"), table_name="carts")
    op.drop_table("carts")

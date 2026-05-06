"""Add scoped categories, product kinds, and dynamic care log activity

Revision ID: 005_scoped_catalog
Revises: 004_add_categories
Create Date: 2026-05-03 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "005_scoped_catalog"
down_revision = "004_add_categories"
branch_labels = None
depends_on = None


def _column_names(inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def _index_names(inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    # categories.scope enum + column
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoryscope') THEN
                CREATE TYPE categoryscope AS ENUM ('shop', 'service', 'carelog');
            END IF;
        END
        $$;
        """
    )

    category_columns = _column_names(inspector, "categories")
    if "scope" not in category_columns:
        op.add_column(
            "categories",
            sa.Column(
                "scope",
                postgresql.ENUM("shop", "service", "carelog", name="categoryscope", create_type=False),
                nullable=False,
                server_default="shop",
            ),
        )

    # Move known service labels to service scope.
    op.execute(
        """
        UPDATE categories
        SET scope = 'service'
        WHERE lower(name) IN ('grooming', 'veterinary', 'training', 'daycare');
        """
    )

    # Replace old global unique(name) with unique(scope, name)
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.table_constraints
                WHERE table_name = 'categories'
                  AND constraint_type = 'UNIQUE'
                  AND constraint_name = 'categories_name_key'
            ) THEN
                ALTER TABLE categories DROP CONSTRAINT categories_name_key;
            END IF;
        END
        $$;
        """
    )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.table_constraints
                WHERE table_name = 'categories'
                  AND constraint_type = 'UNIQUE'
                  AND constraint_name = 'uq_categories_scope_name'
            ) THEN
                ALTER TABLE categories ADD CONSTRAINT uq_categories_scope_name UNIQUE (scope, name);
            END IF;
        END
        $$;
        """
    )

    category_indexes = _index_names(inspector, "categories")
    if op.f("ix_categories_scope") not in category_indexes:
        op.create_index(op.f("ix_categories_scope"), "categories", ["scope"], unique=False)

    # products.kind enum + category_id
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'productkind') THEN
                CREATE TYPE productkind AS ENUM ('shop', 'service');
            END IF;
        END
        $$;
        """
    )

    product_columns = _column_names(inspector, "products")
    if "kind" not in product_columns:
        op.add_column(
            "products",
            sa.Column(
                "kind",
                postgresql.ENUM("shop", "service", name="productkind", create_type=False),
                nullable=False,
                server_default="shop",
            ),
        )
    if "category_id" not in product_columns:
        op.add_column(
            "products",
            sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
        )

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.table_constraints
                WHERE table_name = 'products'
                  AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name = 'fk_products_category_id'
            ) THEN
                ALTER TABLE products
                ADD CONSTRAINT fk_products_category_id
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
            END IF;
        END
        $$;
        """
    )

    product_indexes = _index_names(inspector, "products")
    if op.f("ix_products_kind") not in product_indexes:
        op.create_index(op.f("ix_products_kind"), "products", ["kind"], unique=False)
    if op.f("ix_products_category_id") not in product_indexes:
        op.create_index(op.f("ix_products_category_id"), "products", ["category_id"], unique=False)

    # care_logs.activity enum -> plain string
    care_log_columns = _column_names(inspector, "care_logs")
    if "activity" in care_log_columns:
        op.execute(
            """
            ALTER TABLE care_logs
            ALTER COLUMN activity TYPE VARCHAR(100)
            USING activity::text;
            """
        )

    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'carelogactivity') THEN
                DROP TYPE carelogactivity;
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    # Keep downgrade minimal and safe for existing data.
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.table_constraints
                WHERE table_name = 'products'
                  AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name = 'fk_products_category_id'
            ) THEN
                ALTER TABLE products DROP CONSTRAINT fk_products_category_id;
            END IF;
        END
        $$;
        """
    )
    with op.batch_alter_table("products") as batch_op:
        batch_op.drop_index(op.f("ix_products_category_id"))
        batch_op.drop_index(op.f("ix_products_kind"))
        batch_op.drop_column("category_id")
        batch_op.drop_column("kind")

    with op.batch_alter_table("categories") as batch_op:
        batch_op.drop_index(op.f("ix_categories_scope"))
        batch_op.drop_constraint("uq_categories_scope_name", type_="unique")
        batch_op.create_unique_constraint("categories_name_key", ["name"])
        batch_op.drop_column("scope")

    op.execute("DROP TYPE IF EXISTS productkind")
    op.execute("DROP TYPE IF EXISTS categoryscope")

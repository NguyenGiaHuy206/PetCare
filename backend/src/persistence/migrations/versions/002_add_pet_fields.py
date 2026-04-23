"""Add pet detail fields
Revision ID: 002_add_pet_fields
Revises: 001_initial
Create Date: 2024-01-02 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "002_add_pet_fields"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns
    op.add_column("pets", sa.Column("species", sa.String(100), nullable=True))
    op.add_column("pets", sa.Column("breed", sa.String(255), nullable=True))
    op.add_column("pets", sa.Column("weight", sa.Float(), nullable=True))
    op.add_column("pets", sa.Column("color", sa.String(100), nullable=True))
    op.add_column("pets", sa.Column("gender", sa.String(50), nullable=True))
    op.add_column("pets", sa.Column(
        "microchip_id", sa.String(50), nullable=True))
    op.add_column("pets", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column("pets", sa.Column(
        "photo_url", sa.String(512), nullable=True))

    # Add new age column as varchar first (alongside old integer age)
    op.add_column("pets", sa.Column("age_new", sa.String(100), nullable=True))

    # Migrate data: copy old integer age to varchar, copy type to species
    op.execute("UPDATE pets SET species = type WHERE type IS NOT NULL")
    op.execute(
        "UPDATE pets SET age_new = CAST(age AS VARCHAR) WHERE age IS NOT NULL")

    # Drop old columns
    op.drop_column("pets", "type")
    op.drop_column("pets", "age")
    op.drop_column("pets", "image_url")

    # Rename age_new to age
    op.alter_column("pets", "age_new", new_column_name="age")

    # Make required columns non-nullable
    op.alter_column("pets", "species", nullable=False,
                    existing_type=sa.String(100))
    op.alter_column("pets", "breed", nullable=False,
                    existing_type=sa.String(255))


def downgrade() -> None:
    op.drop_column("pets", "age")
    op.drop_column("pets", "species")
    op.drop_column("pets", "breed")
    op.drop_column("pets", "weight")
    op.drop_column("pets", "color")
    op.drop_column("pets", "gender")
    op.drop_column("pets", "microchip_id")
    op.drop_column("pets", "notes")
    op.drop_column("pets", "photo_url")
    op.add_column("pets", sa.Column("type", sa.String(100), nullable=False))
    op.add_column("pets", sa.Column("age", sa.Integer(), nullable=False))
    op.add_column("pets", sa.Column(
        "image_url", sa.String(512), nullable=True))

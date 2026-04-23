#!/usr/bin/env python
"""Reset database by dropping alembic tracking."""

from sqlalchemy import text
from src.persistence.database import engine
import asyncio


async def reset_db():
    async with engine.begin() as conn:
        # Drop alembic_version table if it exists
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        print("✓ Dropped alembic_version table")

asyncio.run(reset_db())

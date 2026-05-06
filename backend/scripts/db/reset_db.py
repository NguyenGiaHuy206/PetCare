#!/usr/bin/env python
"""Reset database by dropping alembic tracking."""

import asyncio

from sqlalchemy import text

from src.persistence.database import engine


async def reset_db() -> None:
    async with engine.begin() as conn:
        # Drop alembic_version table if it exists
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        print("✓ Dropped alembic_version table")


def run() -> None:
    asyncio.run(reset_db())


if __name__ == "__main__":
    run()

#!/usr/bin/env python
"""Drop all tables to start fresh."""

import asyncio

from sqlalchemy import text

from src.persistence.database import engine


async def reset_db() -> None:
    async with engine.begin() as conn:
        # Drop all enums
        enums = ['userrole', 'bookingservice',
                 'bookingstatus', 'carelogactivity', 'orderstatus']
        for enum in enums:
            try:
                await conn.execute(text(f'DROP TYPE IF EXISTS {enum} CASCADE'))
                print(f"✓ Dropped enum {enum}")
            except Exception as exc:
                print(f"! Failed to drop enum {enum}: {exc}")

        # Drop all tables
        tables = ['alembic_version', 'order_items', 'orders', 'products',
              'care_logs', 'bookings', 'payments', 'pets', 'users', 'storage', 'categories']
        for table in tables:
            try:
                await conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
                print(f"✓ Dropped table {table}")
            except Exception as exc:
                print(f"! Failed to drop table {table}: {exc}")


def run() -> None:
    asyncio.run(reset_db())


if __name__ == "__main__":
    run()

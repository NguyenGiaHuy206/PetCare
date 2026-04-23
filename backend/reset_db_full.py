#!/usr/bin/env python
"""Drop all tables to start fresh."""

from sqlalchemy import text, MetaData
from src.persistence.database import engine
import asyncio


async def reset_db():
    async with engine.begin() as conn:
        # Drop all enums
        enums = ['userrole', 'bookingservice',
                 'bookingstatus', 'carelogactivity', 'orderstatus']
        for enum in enums:
            try:
                await conn.execute(text(f'DROP TYPE IF EXISTS {enum} CASCADE'))
                print(f"✓ Dropped enum {enum}")
            except:
                pass

        # Drop all tables
        tables = ['alembic_version', 'order_items', 'orders', 'products',
                  'care_logs', 'bookings', 'payments', 'pets', 'users', 'storage']
        for table in tables:
            try:
                await conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
                print(f"✓ Dropped table {table}")
            except:
                pass

asyncio.run(reset_db())

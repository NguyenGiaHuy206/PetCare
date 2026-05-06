# Backend Scripts

This folder contains operational scripts used for maintenance and debugging.

## Database

- `python -m scripts.db.reset_db`
  - Drops the `alembic_version` table only.
- `python -m scripts.db.reset_db_full`
  - Drops enum types and all application tables.

## Debug

- `python -m scripts.debug.debug_test`
  - Runs a quick in-memory flow for auth, pet create, booking create, and status update.
- `python -m scripts.seed.seed_initial_data`
  - Creates or promotes the first admin account and seeds default categories.

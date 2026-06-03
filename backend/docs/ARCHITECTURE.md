# Backend Architecture

This backend follows a layered architecture and uses src.main:app as the single entrypoint.

## Layers

- api: FastAPI routers and request/response orchestration.
- domain: business logic and use-case rules.
- persistence: data access (database config, repositories, migrations).
- schemas: pydantic request/response contracts.
- middleware: cross-cutting HTTP concerns.
- tasks: async/background workflows.

## Dependency Rule

Flow should be one direction:

api -> domain -> persistence

The api layer can depend on schemas and middleware.
The domain layer should not depend on FastAPI.

## Entrypoints

- App server: src.main:app
- Migrations: alembic.ini with script location src/persistence/migrations
- Utility scripts: scripts/ directory via python -m scripts....

## Layout Goals

- Keep one source of truth per concern.
- Avoid duplicate app trees.
- Keep generated files out of source control.
- Keep script utilities out of runtime package paths.

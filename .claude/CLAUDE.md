# Pet Care & E-Commerce Backend — Claude Code Context

## Project Overview
Full-stack pet care + e-commerce REST API.
**Stack:** FastAPI · PostgreSQL · SQLAlchemy (async) · Alembic · Pydantic v2 · JWT · AWS S3 · Stripe

---

## Directory Layout
```
src/
  main.py                  # App factory, routers, middleware, lifespan
  config.py                # Pydantic BaseSettings (reads .env)
  api/
    deps.py                # get_db, get_current_user, require_admin
    auth.py                # /auth/register, /auth/login, /auth/refresh
    pets.py                # /pets CRUD
    bookings.py            # /bookings
    care_logs.py           # /care-logs
    storage.py             # /storage/presign, /storage/confirm
    products.py            # /products
    orders.py              # /orders
    payments.py            # /payments/webhook (Stripe)
    reports.py             # /reports (admin)
  domain/
    auth_service.py
    pet_service.py
    booking_service.py
    care_log_service.py
    storage_service.py
    order_service.py
    report_service.py
  persistence/
    database.py            # engine, AsyncSessionLocal, Base
    models/                # SQLAlchemy ORM models
    repositories/          # DB access functions (no business logic)
    migrations/            # Alembic versions
  schemas/                 # Pydantic request/response models
  middleware/
    logging.py
    error_handler.py
  tasks/                   # Background tasks (email, image)
tests/
  conftest.py
  unit/
  integration/
```

---

## Architecture Rules
- **Routers are thin.** They parse requests, call a service, return a schema. No DB access, no business logic in routers.
- **Services own business rules.** Ownership checks, status transitions, conflict detection — all in `domain/`. Services raise plain Python exceptions, not `HTTPException`.
- **Repositories do DB access only.** No business logic. Return ORM objects.
- **Never import FastAPI inside `domain/`.** Services must be testable without HTTP context.

---

## Coding Conventions
- Python 3.11+. Use `async/await` throughout (AsyncSession, async routes).
- Type annotations required on all function signatures.
- Pydantic v2 — use `model_config = ConfigDict(from_attributes=True)`.
- Use `UUID` (not int) for all primary keys.
- All timestamps in UTC (`datetime.utcnow()` or `func.now()`).
- Imports: stdlib → third-party → internal. Absolute imports only.
- No `print()` — use the structured logger from `middleware/logging.py`.
- Never hardcode secrets. All config via `src/config.py` (reads from `.env`).

---

## Environment Variables (`.env`)
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/petcare
JWT_SECRET=
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=7
S3_BUCKET=
S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Auth (Tasks 3.1–3.4)
- Passwords hashed with `bcrypt` via `passlib`.
- JWT: access token (15 min) + refresh token (7 days). Library: `python-jose`.
- `get_current_user` in `deps.py`: extracts `Authorization: Bearer <token>`, decodes, returns `User`.
- `require_admin`: calls `get_current_user`, asserts `user.role == "admin"`, raises `403` otherwise.
- User model has `role` field: `Enum("user", "admin")`, default `"user"`.

## Pet Management (Tasks 4.1–4.4)
- All pet endpoints require `get_current_user`.
- On every read/update/delete: assert `pet.owner_id == current_user.id`. Raise `403` if not.
- Pet fields: `id`, `owner_id` (FK→users), `name`, `type`, `age`.

## Booking System (Tasks 5.1–5.4)
- Services: grooming, boarding, bathing (stored as Enum).
- On create: check `booking_datetime > utcnow()` (reject past). Check no overlapping booking for same pet+service window.
- Status FSM: `pending → confirmed → completed` and `pending/confirmed → cancelled`. Reject invalid transitions.
- Admin endpoints use `require_admin` dependency.

## Care Logs (Tasks 6.1–6.2)
- Fields: `pet_id`, `activity` (feeding/grooming/walking), `timestamp`, `image_url`.
- `GET /care-logs?pet_id=&sort=asc|desc` — filter by pet_id, sort by timestamp.
- Validate pet ownership before creating a log.

## S3 File Storage (Tasks 7.1–7.3)
- `POST /storage/presign` → `storage_service.generate_presigned_url(filename)` → returns `{ upload_url, file_url }`.
- Use `boto3.client("s3").generate_presigned_url("put_object", ...)`, expiry 300s.
- Key pattern: `uploads/{uuid4()}/{filename}`.
- `POST /storage/confirm` → client sends back `file_url`, backend stores in the relevant model's `image_url` field.

## E-Commerce (Tasks 8.1–8.4)
- Products: admin-only write (`require_admin`), public read.
- `GET /products` supports `?search=&skip=0&limit=20` (Task 11 pagination).
- Cart is client-side; `POST /orders` receives `{ items: [{product_id, quantity}] }`.
- `order_service.create()`: validates each product exists + has stock, calculates total, inserts order (status=`pending`), inserts `order_items`.

## Stripe Payments (Tasks 9.1–9.4)
- `POST /orders` → after order created → `order_service.create_stripe_session(order)` → return `{ checkout_url }` to client.
- `POST /payments/webhook`: **read raw request body** (`await request.body()`), verify with `stripe.WebhookSignature.verify_header(payload, sig, STRIPE_WEBHOOK_SECRET)`. Raise `400` on bad signature.
- On `checkout.session.completed` event → `order_service.mark_paid(session.id)`.
- Webhook route must be **excluded from JSON body parsing middleware**.

## Reporting (Task 10)
- All report endpoints: `require_admin`.
- Queries: `SUM(total) WHERE status='paid'`, `COUNT(orders)`, `COUNT(bookings)`, group by day/week using `date_trunc`.

## Pagination & Filtering (Task 11)
- All list endpoints accept `?skip=0&limit=20` query params.
- Filtering: bookings by `?status=`, `?date=`, `?user_id=`; products by `?search=`.

## Error Handling (Task 12)
- Global handler in `middleware/error_handler.py` catches all unhandled exceptions.
- All errors return `{"error": "<message>"}` with appropriate HTTP status.
- Handle: `RequestValidationError` → 422, `SQLAlchemyError` → 500, `StripeError` → 502, custom domain exceptions → 400/403/404.

## Logging (Task 13)
- `middleware/logging.py`: log every request — `method`, `path`, `status_code`, `duration_ms`, `user_id` (if authenticated).
- Log all errors at `ERROR` level with traceback.
- Log Stripe webhook events at `INFO` level including event type and session id.
- Use Python `logging` module with structured JSON output.

## Background Tasks (Task 14)
- Use FastAPI `BackgroundTasks` for lightweight async jobs.
- `tasks/email.py`: `send_booking_confirmation(user, booking)`, `send_order_receipt(user, order)`.
- `tasks/image.py`: `process_uploaded_image(s3_key)` — resize to max 1200px, generate 200px thumbnail.
- Trigger after the main response is returned (inject `BackgroundTasks` in route handler).

---

## Database / Migrations (Task 19)
- Alembic config in `src/persistence/migrations/`.
- `env.py` imports `Base.metadata` and reads `DATABASE_URL` from config.
- Generate: `alembic revision --autogenerate -m "description"`
- Apply: `alembic upgrade head`
- Never edit generated migration files manually.

---

## Testing (Task 15)
- Framework: `pytest` + `pytest-asyncio` + `httpx.AsyncClient`.
- `conftest.py`: async test DB (SQLite in-memory), `AsyncClient` wrapping the app, fixture users (regular + admin).
- Mock S3 with `moto`. Mock Stripe with `unittest.mock.patch`.
- Unit tests per service in `tests/unit/`. Integration tests in `tests/integration/`.
- Run: `pytest tests/ -v`

### Key test cases to implement
```
test_auth.py:     invalid login rejected | expired token rejected | duplicate email rejected
test_pets.py:     user A cannot read/update/delete user B's pet
test_bookings.py: overlapping booking rejected | past date rejected | invalid status transition rejected
test_orders.py:   total price accurate | order items stored correctly
test_webhook.py:  bad stripe signature → 400 | valid event → order marked paid
```

---

## Docker (Task 16)
- `Dockerfile`: multi-stage — `python:3.11-slim` base, install deps from `pyproject.toml`, copy `src/`, expose `8000`.
- `docker-compose.yml`: services `backend` (build: ., port 8000:8000) and `db` (postgres:15, port 5432:5432, volume).
- Backend depends on `db`. Pass env vars via `env_file: .env`.

## CI/CD (Task 17)
- `.github/workflows/ci.yml`: trigger on `push` and `pull_request`.
- Jobs: `lint` (ruff + mypy), `test` (pytest with postgres service container), `build` (docker build).

---

## Security Rules (Task 20)
- Never log passwords, JWT secrets, or Stripe keys.
- Always use ORM queries — no raw SQL strings.
- Validate all user input via Pydantic schemas before it reaches the service layer.
- Stripe webhook: always verify signature before processing.
- S3 presigned URLs expire in 300 seconds.

---

## What NOT to Do
- Do not add business logic inside routers.
- Do not access `db` session directly inside `domain/` services — pass repo functions as dependencies or import repos.
- Do not commit `.env` files.
- Do not use `print()` for logging.
- Do not return raw SQLAlchemy model objects from routes — always serialize through Pydantic schemas.
- Do not skip ownership validation on any pet/booking/care-log endpoint.

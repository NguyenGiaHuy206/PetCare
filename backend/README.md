# PetCare Backend

FastAPI backend for PetCare. It provides authentication, pets, bookings, care logs, products, cart checkout, orders, reports, notifications, S3 uploads, GHN shipping support, SMTP email verification, and VNPAY payment return handling.

## Tech Stack

- FastAPI
- PostgreSQL
- SQLAlchemy 2 async ORM
- Alembic migrations
- JWT auth with refresh tokens
- AWS S3 presigned uploads
- SMTP email verification and notifications
- GHN shipping APIs
- VNPAY payment URLs and signed return verification

## Directory Layout

```text
src/
  main.py                 FastAPI app setup
  config.py               Environment-backed settings
  api/                    HTTP routers
  middleware/             Error handling and request logging
  persistence/
    database.py           SQLAlchemy engine/session setup
    migrations/           Alembic environment and revisions
    models/               ORM models
    repositories/         Database access helpers
  schemas/                Pydantic request/response models
  services/               Business logic and integrations
  tasks/                  Background-task helpers
scripts/
  seed/                   Initial admin/category seed
  db/                     Local database reset helpers
tests/                    Unit and integration tests
```

## Environment

Create a local environment file from the example:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Important variables:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/petcare
JWT_SECRET=change-me
FRONTEND_URL=http://localhost:5173

SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_FROM_EMAIL=no-reply@petty.local
SMTP_USE_TLS=false

GHN_API_URL=https://dev-online-gateway.ghn.vn/shiip/public-api
GHN_TOKEN=your-ghn-token
GHN_SHOP_ID=your-shop-id
GHN_FROM_DISTRICT_ID=0

VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_RETURN_URL=http://localhost:8000/payments/vnpay/return

S3_BUCKET=your-bucket-name
S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

When running through the root `docker-compose.yml`, the compose file overrides `DATABASE_URL` to use the `db` service and points SMTP to Mailpit.

## Run With Docker

From the repository root:

```bash
docker compose up -d --build
```

The backend container runs:

```bash
alembic upgrade head
python -m scripts.seed.seed_initial_data
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

Useful URLs:

- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Run Locally Without Docker

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m scripts.seed.seed_initial_data
uvicorn src.main:app --reload
```

Use a local PostgreSQL database matching `DATABASE_URL`.

## Migrations

```bash
# Apply migrations
alembic upgrade head

# Create a new migration
alembic revision -m "describe_change"

# Check current revision
alembic current
```

## Tests And Checks

```bash
python -m compileall src
pytest
```

If `pytest` is not installed, install development dependencies first:

```bash
pip install -e ".[dev]"
```

## Seed Data

Default local admin:

- Email: `admin@petcare.com`
- Password: `Admin123!`

Override with:

```env
SUPER_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change-this
```

## Operational Notes

- Payment state and fulfillment stage are separate. VNPAY success sets `payment_status=paid`; admin changes order `status` to `shipped` or `delivered`.
- COD orders use `payment_status=cod_pending`.
- Service bookings create service orders but service progress is represented differently in the frontend.
- Email verification and notifications use SMTP. In Docker, local emails are visible in Mailpit at http://localhost:8025.
- S3 uploads use presigned URLs; uploaded image display can be proxied by the backend storage endpoint.

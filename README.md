# PetCare

PetCare is a full-stack pet care and commerce app. It includes pet profiles, service bookings, care logs, shop products, cart checkout, order management, in-app notifications, reports, S3 image upload, GHN shipping quotes, and VNPAY/COD payments.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Nginx container
- Backend: FastAPI, SQLAlchemy async ORM, Alembic, PostgreSQL
- Local services: PostgreSQL
- Integrations: AWS S3, GHN, VNPAY

## Quick Start With Docker

1. Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

2. Edit `backend/.env` for real credentials when needed:

```env
JWT_SECRET=change-this
GHN_TOKEN=...
GHN_SHOP_ID=...
GHN_FROM_DISTRICT_ID=...
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...
```

3. Start the stack:

```bash
docker compose up -d --build
```

4. Open the app:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

The backend container runs Alembic migrations and seeds the initial admin account on startup.

Default local admin:

- Email: `admin@petcare.com`
- Password: `Admin123!`

Override it with `SEED_ADMIN_PASSWORD` and `ADMIN_EMAIL`.

## Common Commands

```bash
# Start services
docker compose up -d

# Rebuild after code changes
docker compose up -d --build

# Stop services
docker compose down

# Stop and remove database volume
docker compose down -v

# Backend logs
docker compose logs -f backend

# Frontend logs
docker compose logs -f frontend
```

## Local Development

Backend:

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn src.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Payment And Shipping Notes

- COD orders are created immediately with `payment_status=cod_pending`.
- VNPAY orders are created with `payment_status=pending`; users can pay during checkout/booking or later from their order page.
- Order fulfillment stage is separate from payment state.
- GHN is used for province/district/ward data and checkout shipping quotes.

## Repository Layout

```text
backend/            FastAPI app, migrations, services, tests
frontend/           React/Vite app and Nginx production image
docker-compose.yml  Local full-stack runtime
```

More details are in `backend/README.md` and `frontend/README.md`.

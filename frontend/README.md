# PetCare Frontend

React/Vite frontend for PetCare. The app talks to the FastAPI backend for authentication, pets, services, bookings, care logs, shop products, cart checkout, orders, reports, notifications, image uploads, GHN shipping data, and VNPAY/COD payment flows.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide icons
- Nginx production container

## Environment

Create a local env file when running outside Docker:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Variables:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPER_ADMIN_EMAIL=admin@petcare.com
```

For Docker builds, these values are passed as build args from the root `docker-compose.yml`.

## Run With Docker

From the repository root:

```bash
docker compose up -d --build frontend
```

Open:

- App: http://localhost:5173

The production Docker image builds static assets with Vite and serves them through Nginx.

## Run Locally

```bash
npm install
npm run dev
```

The dev server uses `VITE_API_BASE_URL` to reach the backend.

## Build

```bash
npm run build
```

The build output is written to `dist/`.

## Project Layout

```text
src/
  App.tsx
  main.tsx
  routes.tsx
  components/          Shared UI and app components
  contexts/            Auth context
  layouts/             App layout and navigation
  pages/               Route pages
  services/            API clients and shared types
  styles/              Global styles and theme fixes
  utils/               Formatting, image, error, and export helpers
```

## Notes

- Admin users default to the reports page.
- Product orders and service orders are displayed separately.
- Users can pay VNPAY orders during checkout/booking or later from their order page.
- Admins manage fulfillment/service status but do not use `Pay now`.
- Checkout address province/district/ward options come from GHN APIs through the backend.

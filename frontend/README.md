
# PetCare Frontend (UI Only)

This frontend is applied from the Untitled design template and is currently configured as UI-only.

## What this means

- Pages, layouts, navigation, and components are ready.
- Most screens use local/mock UI data directly in page components.
- The API module is a placeholder and does not call any real backend yet.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Replace API later

When your backend is ready, replace placeholder methods in:

- `src/app/utils/api.ts`

Keep the current export names (`authAPI`, `petAPI`, `serviceAPI`, etc.) to avoid changing UI code.
  
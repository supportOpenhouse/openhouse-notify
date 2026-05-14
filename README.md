# Notification platform

Monorepo for a notification management product: an **Express** API and workers (`backend`) and a **Next.js** admin panel (`frontend`). Both apps share the same **PostgreSQL** database (Prisma schema lives in `backend`).

## Repository layout

| Directory | Description |
|-----------|-------------|
| `backend/` | Express API, Prisma, Redis/BullMQ, migrations, `npm run db:*` |
| `frontend/` | Next.js 16 app, NextAuth (Auth.js), shadcn/ui |

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL (e.g. Neon) — pooled + direct URLs
- Redis (e.g. Upstash) — for queues / cache

## Quick start

### 1. Environment

1. Copy env templates and fill in secrets (never commit real `.env` files).

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. Use the **same** `DATABASE_URL` / `DATABASE_URL_UNPOOLED` (and compatible auth secrets) in both apps where documented in each `.env.example`.

3. **NextAuth:** `AUTH_SECRET` must match exactly between `backend/.env` and `frontend/.env.local`.

### 2. Database (from `backend/`)

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate:dev
```

Optional seed (see `backend/prisma/seed.ts`; optional `ADMIN_SEED_PASSWORD` in `backend/.env` for bcrypt credentials):

```bash
npm run db:seed
```

### 3. Run apps

**API** (default port `4000`):

```bash
cd backend
npm run dev
```

**Panel** (default port `3000`):

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign in via Google and/or email + password depending on your seed and NextAuth config.

### 4. Firebase / FCM (optional)

From `backend/`, set either `GOOGLE_APPLICATION_CREDENTIALS` (path to the service account JSON) or `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` as in [backend/.env.example](backend/.env.example). On API boot, Firebase initialises when those vars are present.

Test a device token:

```bash
cd backend
npm run fcm:test -- "<your-fcm-registration-token>"
```

## Documentation

- Backend architecture and scripts: [backend/README.md](backend/README.md)
- Panel stack (Next.js / shadcn): [frontend/README.md](frontend/README.md)

## Conventions

- Run **Prisma migrations** only from `backend/`, not from the panel.
- Authenticated API calls from the browser should use `credentials: 'include'` so the NextAuth session cookie is sent to the Express API (see panel `services/api/`).

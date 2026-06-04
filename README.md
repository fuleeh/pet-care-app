# Pet Care Reminder

Track medications, vet visits, and recurring care tasks for your pets. Built with NestJS + Next.js + PostgreSQL.

## Stack

| Layer | Tech |
|-------|------|
| Backend | NestJS 11, Prisma 7, PostgreSQL (Supabase), Passport JWT, Swagger |
| Frontend | Next.js 16, MUI, React Query, Zustand, React Hook Form, Zod |
| Infra | Docker Compose, Railway (backend), Vercel (frontend), GitHub Actions CI |

## Structure

```
pet-care-app/
├── backend/         # NestJS API (:4000)
├── frontend/        # Next.js app (:3000)
├── shared/          # Shared TypeScript types (@pet-care/shared)
├── docs/            # Documentation
└── .github/workflows/  # CI pipeline
```

## Quick start

```sh
# Copy env and edit
cp .env.example .env

# Start DB + services
docker compose up -d

# Apply migrations
cd backend && npx prisma migrate deploy

# Backend: http://localhost:4000 (Swagger: /api)
# Frontend: http://localhost:3000
```

## Status

| Phase | Status |
|-------|--------|
| 0 — Scaffold | ✅ Done |
| 1 — Auth | ✅ Done |
| 2 — Pets CRUD | ⏳ Next |
| 3 — Medications & Logs | ❌ |
| 4 — Dashboard & Timeline | ❌ |
| 5 — Notifications | ❌ |
| 6 — Polish & Deploy | ❌ |

See [`PLAN.md`](PLAN.md) for full project plan.

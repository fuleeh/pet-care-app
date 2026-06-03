# 🐾 Pet Care Reminder App — Full Build Plan

## Overview

A full-stack application for pet owners to track medications, vet visits, and recurring care tasks. Automatic email/in-app reminders when a task is due or overdue.

**Stack:** NestJS + PostgreSQL + Next.js + Docker + Swagger

**Status:**
| Phase | Status |
|-------|--------|
| 0 – Scaffold | ✅ Complete |
| 1 – Auth | ⏳ Pending |
| 2 – Pets | ⏳ Pending |
| 3 – Medications | ⏳ Pending |
| 4 – Dashboard | ⏳ Pending |
| 5 – Notifications | ⏳ Pending |
| 6 – Polish & Deploy | ⏳ Pending |

**Documentation philosophy:** Every ticket produces a doc file in `docs/` explaining what we did, how it works, and why we chose that approach. Frontend patterns get extra context since this project doubles as a frontend learning resource.

**Progress tracking:** This plan is updated after every move. If this session is lost, a new one can pick up here.


---

## Architecture

```
pet-care-app/
├── package.json          # Root: Yarn workspaces config
├── .yarnrc               # Yarn Classic config
├── backend/              # NestJS API → package name: @pet-care/backend
│   ├── src/
│   │   ├── auth/         # JWT auth (register, login, refresh)
│   │   ├── users/        # User profile
│   │   ├── pets/         # Pet CRUD
│   │   ├── medications/  # Medication/task CRUD + recurrence logic
│   │   ├── logs/         # Administration logs
│   │   ├── notifications/# In-app + email notifications
│   │   ├── dashboard/    # Summary/aggregation endpoint
│   │   ├── common/       # Guards, decorators, filters, DTOs
│   │   └── scheduler/    # Cron jobs for reminders
│   ├── prisma/           # Schema + migrations
│   └── test/
├── frontend/             # Next.js 15 (App Router) → package name: @pet-care/frontend
│   ├── app/
│   │   ├── (auth)/       # login, register
│   │   ├── (dashboard)/  # dashboard, pets, medications
│   │   └── api/          # Next.js API routes (proxies if needed)
│   ├── components/       # MUI components, shared UI pieces
│   ├── lib/              # API client, React Query hooks, Zod schemas
│   └── store/            # Zustand stores (client state)
├── shared/               # Shared TypeScript types → package name: @pet-care/shared
│   ├── package.json
│   └── types/
├── docker-compose.yml    # PostgreSQL + backend + frontend
├── docs/                 # Architecture decisions, setup guide
└── PLAN.md               # ← this file
```

---

## Phases & Tickets

### Phase 0 — Project Scaffold

| # | Ticket | Description | Doc | Status |
|---|--------|-------------|-----|--------|
| 0.1 | Init NestJS backend | `nest new backend`, configure ESM, add Prisma, Swagger, validation | `docs/DOCUMENTATION.md` | ✅ |
| 0.2 | Init Next.js frontend | `create-next-app frontend`, install MUI, React Query, Zustand, React Hook Form, Zod | `docs/DOCUMENTATION.md` | ✅ |
| 0.3 | Docker setup | `docker-compose.yml` with backend + frontend (DB uses Supabase, not local Postgres) | `docs/DOCUMENTATION.md` | ✅ |
| 0.4 | Shared types package | Create `shared/types/` with interfaces matching Prisma models | `docs/DOCUMENTATION.md` | ✅ |
| 0.5 | Prisma schema + migrations | Define all entities, run initial migration | `docs/DOCUMENTATION.md` | ✅ |
| 0.6 | CI/CD (GitHub Actions) | Lint, test, build on push | `docs/DOCUMENTATION.md` | ✅ |

### Phase 1 — Authentication

| # | Ticket | Description |
|---|--------|-------------|
| 1.1 | User module | `POST /auth/register`, password hashing (bcrypt) |
| 1.2 | Login + JWT | `POST /auth/login`, access + refresh tokens |
| 1.3 | Guard + decorator | `@CurrentUser()`, `JwtAuthGuard` |
| 1.4 | Frontend auth pages | Login + register forms, token storage, auth context |
| 1.5 | Swagger docs for auth | Document all auth endpoints |

### Phase 2 — Pets CRUD

| # | Ticket | Description |
|---|--------|-------------|
| 2.1 | Pets module | `GET/POST /pets`, `GET/PUT/DELETE /pets/:id` |
| 2.2 | Pet photo upload | Multer/S3 upload for pet images |
| 2.3 | Frontend pets pages | List, create, edit, detail pages |
| 2.4 | Swagger docs | Document pet endpoints |

### Phase 3 — Medications & Tasks

| # | Ticket | Description |
|---|--------|-------------|
| 3.1 | Medications module | CRUD for medications/tasks linked to a pet |
| 3.2 | Recurrence logic | Calculate next due date from frequency (days/weeks/months) |
| 3.3 | Administration logs | `POST /medications/:id/log` to record when given |
| 3.4 | Frontend medications | Add/edit/log medications, status badges (due, upcoming, overdue) |
| 3.5 | Swagger docs | Document medication + log endpoints |

### Phase 4 — Dashboard & Visualizations

| # | Ticket | Description | Doc |
|---|--------|-------------|-----|
| 4.1 | Dashboard endpoint | Aggregated stats: upcoming, overdue, overdue counts | `docs/dashboard-api.md` |
| 4.2 | Frontend dashboard | Pet mood indicator (happy if all good, sad if overdue), countdown rings for each med, quick-action buttons | `docs/dashboard-ui.md` |
| 4.3 | Pet progress timeline | Horizontal timeline on pet detail page — animal character walks from past → present → future. Medication events plotted as markers along the timeline | `docs/pet-timeline.md` |
| 4.4 | Last given tracker | Big clear date display per medication showing "Last given: X months ago" | `docs/dashboard-ui.md` |
| 4.5 | Swagger docs | Document dashboard endpoint | `docs/swagger-dashboard.md` |

### Phase 5 — Notifications

| # | Ticket | Description |
|---|--------|-------------|
| 5.1 | Notification schema | In-app notification table (type, message, read_at) |
| 5.2 | Cron scheduler | Daily check: find due/overdue medications, create notifications |
| 5.3 | Email service | Nodemailer + SMTP (or Resend/SendGrid) for email reminders |
| 5.4 | Frontend notifications | Bell icon, dropdown, notification center page |
| 5.5 | Swagger docs | Document notification endpoints |

### Phase 6 — Polish & Deployment

| # | Ticket | Description |
|---|--------|-------------|
| 6.1 | Error handling | Global exception filter, user-friendly error pages |
| 6.2 | Loading states | Skeleton screens, optimistic updates |
| 6.3 | Responsive design | Mobile-friendly layout |
| 6.4 | Tests | Backend e2e tests (Jest/Supertest), frontend component tests |
| 6.5 | Deployment | Deploy backend to Railway, frontend to Vercel (auto-deploy from GitHub) |
| 6.6 | Final review | Code cleanup, README, demo script |

---

## Database Schema (Prisma)

```prisma
enum Species {
  DOG
  CAT
  BIRD
  OTHER
}

enum FrequencyUnit {
  DAY
  WEEK
  MONTH
  YEAR
}

model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  pets          Pet[]
  notifications Notification[]
}

model Pet {
  id        String   @id @default(uuid())
  userId    String
  name      String
  species   Species
  breed     String?
  birthDate DateTime?
  photoUrl  String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  medications  Medication[]
}

model Medication {
  id             String        @id @default(uuid())
  petId          String
  name           String
  dosage         String?
  frequencyValue Int           // e.g. 3
  frequencyUnit  FrequencyUnit // e.g. MONTH
  startDate      DateTime
  endDate        DateTime?
  notes          String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  pet        Pet              @relation(fields: [petId], references: [id], onDelete: Cascade)
  logs       MedicationLog[]
}

model MedicationLog {
  id           String   @id @default(uuid())
  medicationId String
  administeredAt DateTime @default(now())
  notes        String?

  medication   Medication @relation(fields: [medicationId], references: [id], onDelete: Cascade)
}

model Notification {
  id        String    @id @default(uuid())
  userId    String
  type      String    // "MEDICATION_DUE", "MEDICATION_OVERDUE"
  title     String
  message   String
  readAt    DateTime?
  sentAt    DateTime?
  createdAt DateTime  @default(now())

  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## API Endpoints Summary

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Login, returns tokens |
| POST | /auth/refresh | Refresh access token |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | /users/me | Get current user |
| PATCH | /users/me | Update profile |

### Pets
| Method | Path | Description |
|--------|------|-------------|
| GET | /pets | List user's pets |
| POST | /pets | Create pet |
| GET | /pets/:id | Get pet detail |
| PUT | /pets/:id | Update pet |
| DELETE | /pets/:id | Delete pet |

### Medications
| Method | Path | Description |
|--------|------|-------------|
| GET | /pets/:petId/medications | List medications for a pet |
| POST | /pets/:petId/medications | Create medication |
| GET | /medications/:id | Get medication detail |
| PUT | /medications/:id | Update medication |
| DELETE | /medications/:id | Delete medication |

### Logs
| Method | Path | Description |
|--------|------|-------------|
| GET | /medications/:id/logs | List administration logs |
| POST | /medications/:id/logs | Log an administration |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | /notifications | List user's notifications |
| PATCH | /notifications/:id/read | Mark as read |
| POST | /notifications/read-all | Mark all as read |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | /dashboard/summary | Upcoming, overdue counts, compliance |

---

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| / | Landing | Public landing page |
| /login | Login | Sign in form |
| /register | Register | Sign up form |
| /dashboard | Dashboard | Overview cards, upcoming reminders |
| /pets | Pet list | All user's pets |
| /pets/new | Create pet | Add a new pet |
| /pets/:id | Pet detail | Pet info + medication list |
| /pets/:id/medications/new | Add medication | New medication form |
| /medications/:id/edit | Edit medication | Edit medication form |
| /medications/:id | Medication detail | History + log button |
| /notifications | Notification center | All notifications |
| /settings | Settings | Email prefs, profile |

---

## Tech Decisions

| Decision | Choice | Why |
|----------|--------|------|
| ORM | Prisma | Type-safe, great migrations, popular in NestJS ecosystem |
| Backend validation | class-validator + class-transformer | Native NestJS integration, decorator-based DTOs |
| Frontend validation | Zod | Works seamlessly with React Hook Form, great TypeScript inference |
| Auth | JWT (access + refresh) | Stateless, widely used, easy to explain in interviews |
| Database | Supabase (PostgreSQL) | Free 500MB, includes auth + storage, huge ecosystem |
| Scheduling | @nestjs/schedule | Native NestJS, cron-based |
| UI library | MUI (Material UI) | Mature ecosystem, professional look, great for portfolios |
| Forms | React Hook Form + Zod | Type-safe forms with MUI components via adapter |
| Server state | TanStack React Query | Caching, background refetch, optimistic updates |
| Client state | Zustand | Minimal boilerplate, works outside React components |
| API client | Custom fetch wrapper (type-safe) | Lightweight, no extra dependency, uses shared types |
| Shared types | `shared/types/` | Single source of truth for DTOs, prevents drift between frontend and backend |
| Testing | Jest + Supertest (backend), Vitest + Testing Library (frontend) | Standard choices |
| Docker | Multi-stage builds | Smaller images, faster deploys |

---

## Type Safety Strategy

```
┌─────────────────────────────────────────────────┐
│                  Prisma Schema                   │
│  (single source of truth for data models)        │
└────────────┬───────────────────────┬────────────┘
             │                       │
             ▼                       ▼
┌──────────────────────┐  ┌────────────────────────┐
│  Backend (NestJS)    │  │  Frontend (Next.js)     │
│  ─────────────────   │  │  ─────────────────      │
│  Prisma Client       │  │  Shared types (manual)  │
│  class-validator     │  │  Zod schemas (mirror)   │
│  DTOs                │  │  React Hook Form        │
└──────────────────────┘  └────────────────────────┘
```

**How type safety flows through the stack:**
1. **Prisma schema** defines the database models → generates `Prisma.Client` types
2. **Backend DTOs** use `class-validator` decorators for runtime validation + Swagger generation
3. **Shared `types/` package** contains TypeScript interfaces that mirror the API contracts (request/response shapes)
4. **Frontend Zod schemas** validate form input at runtime and infer TypeScript types
5. **API client** in the frontend uses the shared types for request/response typing, giving end-to-end type safety

---

## Order of Implementation

The phases should be followed sequentially. Within each phase, tickets can be done in any order.

```
Phase 0 ─► Phase 1 ─► Phase 2 ─► Phase 3 ─► Phase 4 ─► Phase 5 ─► Phase 6
(scaffold)  (auth)      (pets)      (meds)      (dashboard) (notify)    (polish)
```

Each phase builds on the previous one. No phase should be started before the prior phase is complete.

---

## Getting Started (once Phase 0 is done)

```sh
git clone <repo>
cd pet-care-app
cp .env.example .env     # Fill in Supabase credentials
docker compose up -d
# Backend at http://localhost:4000
# Swagger at http://localhost:4000/api
# Frontend at http://localhost:3000
```

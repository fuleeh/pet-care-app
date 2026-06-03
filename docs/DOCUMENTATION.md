# Pet Care Reminder — Full Code Documentation

This document explains every source file in the project, line by line. Each section shows the exact code and then describes what it does and why it was written that way.

---

# PHASE 0 — Project Scaffold

---

## 0.1 Root Workspace Config

### `package.json` (root)

```json
{
  "name": "pet-care-app",
  "private": true,
  "workspaces": [
    "backend",
    "frontend",
    "shared"
  ]
}
```

**What it does:** This is a Yarn workspaces monorepo. The `workspaces` array tells Yarn that `backend/`, `frontend/`, and `shared/` are separate packages. Running `yarn install` at the root installs all dependencies for all three packages into a single root `node_modules/`, hoisting shared dependencies.

**Why workspaces?** It lets us share the `@pet-care/shared` types package between backend and frontend without publishing to npm. Both backend and frontend can `import { PetDto } from '@pet-care/shared'` and get the same types from `shared/types/index.ts`.

---

### `shared/package.json`

```json
{
  "name": "@pet-care/shared",
  "version": "1.0.0",
  "private": true,
  "main": "types/index.ts",
  "types": "types/index.ts"
}
```

**What it does:** Declares the shared package. `main` and `types` both point to `types/index.ts`, so any import of `@pet-care/shared` resolves directly to the TypeScript source file. No build step needed for shared types — they're compiled as part of whatever package imports them.

---

## 0.2 Backend Scaffold (NestJS 11 + ESM)

### `backend/package.json`

```json
{
  "name": "@pet-care/backend",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.4",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/swagger": "^11.4.4",
    "@prisma/adapter-pg": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "bcrypt": "^6.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.15.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/bcrypt": "^6.0.0",
    "@types/express": "^5.0.0",
    "@types/passport-jwt": "^4.0.1",
    "prisma": "^7.8.0",
    "typescript": "^5.7.3"
  }
}
```

**`"type": "module"`** — This tells Node.js to treat `.js` files as ES modules (ESM) instead of CommonJS. Why? Because Prisma 7's generated client is ESM-only. Every local import in this package must end with `.js` (e.g., `'./app.module.js'`), even though the source files are `.ts`. The NestJS compiler outputs `.js` files, so those import paths match the compiled output.

**Dependencies breakdown:**
| Package | Purpose |
|---------|---------|
| `@nestjs/common`, `core`, `platform-express` | NestJS framework core |
| `@nestjs/config` | Reads `.env` files, provides `ConfigService` everywhere |
| `@nestjs/jwt` | JWT creation and verification (wraps `jsonwebtoken`) |
| `@nestjs/passport` | NestJS integration for Passport authentication |
| `passport`, `passport-jwt` | Passport strategy for JWT Bearer tokens |
| `@nestjs/swagger` | Auto-generates Swagger UI from decorators |
| `@prisma/adapter-pg` | Prisma 7 driver adapter for PostgreSQL |
| `@prisma/client` | Generated type-safe database client |
| `bcrypt` | Password hashing (bcrypt algorithm) |
| `class-validator`, `class-transformer` | Decorator-based DTO validation |
| `prisma` (dev) | Prisma CLI for migrations, generation |

### `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "esModuleInterop": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "ES2023",
    "outDir": "./dist",
    "strictNullChecks": true,
    "skipLibCheck": true
  }
}
```

**Key settings:**
- `"module": "nodenext"` — Required by Prisma 7's ESM client. This tells TypeScript to use Node.js's native ESM resolution algorithm.
- `"moduleResolution": "nodenext"` — Works with `nodenext` module. TypeScript will resolve bare specifiers (`'@nestjs/common'`) to `node_modules` and relative paths with `.js` extensions.
- `"emitDecoratorMetadata": true` + `"experimentalDecorators": true` — Required by NestJS's decorator-based dependency injection system.
- `"strictNullChecks": true` — Prevents null/undefined bugs at compile time. We intentionally didn't enable `strict: true` because `noImplicitAny: false` (default) reduces friction with some NestJS patterns.

---

### `backend/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pet_care_dev"
JWT_SECRET="dev-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
PORT=4000
```

**What it does:** Environment variables loaded by `@nestjs/config` at startup. `DATABASE_URL` points to a local PostgreSQL (Docker). `JWT_SECRET` is used to sign and verify JWT tokens. The `JWT_REFRESH_SECRET` is currently unused — both access and refresh tokens use the same secret (acceptable for this app's complexity).

---

### `backend/src/main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Pet Care Reminder API')
    .setDescription('API for managing pets, medications, and reminders')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
```

**Line-by-line:**
- **`NestFactory.create(AppModule)`** — Bootstraps the NestJS application by creating the root module and resolving all dependency injection.
- **`useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`** — Applies validation to every incoming request globally. `whitelist: true` strips any properties that don't have decorators on the DTO. `transform: true` auto-converts plain objects to DTO class instances.
- **`DocumentBuilder().addBearerAuth()`** — Configures Swagger to show an "Authorize" button that accepts a Bearer token. All documented endpoints that require auth will show a lock icon.
- **`SwaggerModule.setup('api', app, document)`** — Serves Swagger UI at `http://localhost:4000/api`.
- **`app.listen(process.env.PORT ?? 4000)`** — Starts the HTTP server on port 4000 (or whatever `PORT` env var says).

---

### `backend/src/app.module.ts`

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**What it does:** The root module that wires everything together.
- **`ConfigModule.forRoot({ isGlobal: true })`** — Loads `.env` file and makes `ConfigService` available everywhere without re-importing. `isGlobal` means any service/controller can inject `ConfigService` directly.
- **`PrismaModule`** — Global module that provides `PrismaService` everywhere.
- **`AuthModule`** — Contains auth controller, service, JWT strategy, and guards.

---

### `backend/src/app.controller.ts` / `backend/src/app.service.ts`

```ts
// app.controller.ts
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

// app.service.ts
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

**What it does:** A simple health-check endpoint at `GET /` that returns `"Hello World!"`. This was auto-generated by the NestJS CLI and is useful for verifying the server is running before any other routes exist.

---

## 0.3 Prisma Service & Module

### `backend/src/prisma/prisma.service.ts`

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    const adapter = new PrismaPg({ connectionString: config.get('DATABASE_URL') });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**What it does:** Creates a singleton Prisma client that connects to PostgreSQL using the driver adapter pattern.

**Why the adapter pattern?** Prisma 7 uses "driver adapters" instead of the old `datasourceUrl` approach. `PrismaPg` from `@prisma/adapter-pg` wraps the `pg` driver (although we don't install `pg` directly — Prisma handles it). The adapter is instantiated with the connection string from `DATABASE_URL` env var.

**`extends PrismaClient`** — By extending `PrismaClient`, this service inherits all the generated CRUD methods (`user.findUnique()`, `pet.create()`, etc.) and we can inject it via NestJS DI instead of creating `new PrismaClient()` everywhere.

**`OnModuleInit` / `OnModuleDestroy`** — NestJS lifecycle hooks. `$connect()` is called when the module starts (connects to the database). `$disconnect()` is called when the application shuts down (cleans up the connection pool).

The import path `'./generated/client.js'` points to `src/prisma/generated/client.js` — the Prisma-generated client, which is inside `src/` so NestJS compiles it along with the rest of the source.

---

### `backend/src/prisma/prisma.module.ts`

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**What it does:** Declares `PrismaService` as a provider and marks the module as `@Global()`. This means any service in any module can inject `PrismaService` without importing `PrismaModule` — NestJS automatically makes it available everywhere.

---

## 0.4 Prisma Schema & Database

### `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/prisma/generated"
}

datasource db {
  provider = "postgresql"
}
```

**Generator block:** Tells Prisma to generate the type-safe client into `src/prisma/generated/` (inside the source tree so NestJS compiles it). The provider `"prisma-client"` generates the modern ESM client.

**Datasource block:** Specifies PostgreSQL. No `url` here because it's provided via `prisma.config.ts` (separate config file required by Prisma 7).

---

```prisma
enum Role {
  PET_PARENT
  ADMIN
}

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
```

**PostgreSQL enums.** These are stored in the database as actual enum types (not strings), which means invalid values are rejected at the database level. Prisma maps them to TypeScript string enums automatically.

---

```prisma
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(PET_PARENT)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  pets          Pet[]
  notifications Notification[]
}
```

**Fields:**
- `id` — UUID primary key. Generated by Prisma (`@default(uuid())`), not by the database. This means the application generates the UUID before inserting.
- `email` — Marked `@unique` so the database enforces no duplicate emails. This is checked at insert time.
- `passwordHash` — Stores the bcrypt hash, never the plaintext password.
- `role` — Defaults to `PET_PARENT`. `ADMIN` exists for future admin panel use.
- `pets` / `notifications` — Virtual fields representing the one-to-many relationships. Prisma automatically generates these as arrays of the related model.

---

```prisma
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

  @@index([userId])
}
```

**`@relation`** — Defines the foreign key relationship. `fields: [userId]` says "the `userId` field is the foreign key". `references: [id]` says "it references the `id` field on `User`". `onDelete: Cascade` means deleting a User automatically deletes all their Pets.

**`@@index([userId])`** — Creates a database index on `userId`. Without this, querying "all pets for user X" would be a full table scan.

---

```prisma
model Medication {
  id             String        @id @default(uuid())
  petId          String
  name           String
  dosage         String?
  frequencyValue Int
  frequencyUnit  FrequencyUnit
  startDate      DateTime
  endDate        DateTime?
  notes          String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  pet  Pet              @relation(fields: [petId], references: [id], onDelete: Cascade)
  logs MedicationLog[]

  @@index([petId])
}
```

**Medication model** — Tracks a prescription or recurring medication for a pet. `frequencyValue` + `frequencyUnit` together define the recurrence (e.g., `2 DAY` = every 2 days, `1 WEEK` = weekly). `endDate` is nullable because some medications are ongoing.

---

```prisma
model MedicationLog {
  id             String   @id @default(uuid())
  medicationId   String
  administeredAt DateTime @default(now())
  notes          String?

  medication Medication @relation(fields: [medicationId], references: [id], onDelete: Cascade)

  @@index([medicationId])
}
```

**MedicationLog model** — Records each time a medication is given. `administeredAt` defaults to `now()` (the timestamp of the log entry) but can be overridden for back-dating.

---

```prisma
model Notification {
  id        String    @id @default(uuid())
  userId    String
  type      String
  title     String
  message   String
  readAt    DateTime?
  sentAt    DateTime?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Notification model** — For future in-app and email notifications. `readAt` tracks when the user viewed it (null = unread). `sentAt` tracks when the email was sent (null = not yet sent). `type` is a string (e.g., `'MEDICATION_REMINDER'`, `'VET_VISIT'`) for filtering in the UI.

---

### `backend/prisma.config.ts`

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

**What it does:** Prisma 7 requires a separate config file (not embedded in `schema.prisma`). This file loads the `DATABASE_URL` from the environment and tells Prisma where to find the schema and migrations. It's used by `prisma migrate`, `prisma generate`, etc.

---

## 0.5 Shared Types Package

### `shared/types/index.ts`

```ts
export enum Role {
  PET_PARENT = 'PET_PARENT',
  ADMIN = 'ADMIN',
}

export enum Species {
  DOG = 'DOG',
  CAT = 'CAT',
  BIRD = 'BIRD',
  OTHER = 'OTHER',
}

export enum FrequencyUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}
```

**Enums** — String-valued enums that match the PostgreSQL enums exactly. Using string values (`'DOG'` instead of `0`) means they serialize naturally in JSON API responses.

---

```ts
export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}
```

**`UserDto`** — The public shape of a User returned by the API. Notice that `passwordHash` is NOT included — we never expose the password hash to the client.

---

```ts
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
```

**Request/Response DTOs** — These define the contract between frontend and backend. Both sides import the same interfaces, ensuring they stay in sync. When the backend changes a field name, TypeScript will flag the frontend code as an error.

---

```ts
export interface CreatePetRequest {
  name: string;
  species: Species;
  breed?: string;
  birthDate?: string;
  notes?: string;
}

export interface CreateMedicationRequest {
  name: string;
  dosage?: string;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface CreateLogRequest {
  administeredAt?: string;
  notes?: string;
}
```

**`CreatePetRequest`** — Note `breed?`, `birthDate?`, `notes?` are optional (marked with `?`). These will be `undefined` if not provided, and the backend DTO validation will handle the conversion to `null` for the database.

**`CreateMedicationRequest`** — `frequencyValue` + `frequencyUnit` define the recurrence. The backend will use these to compute next-due dates and schedule reminders.

---

```ts
export interface PetDto {
  id: string;
  userId: string;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MedicationDto {
  id: string;
  petId: string;
  name: string;
  dosage: string | null;
  frequencyValue: number;
  frequencyUnit: FrequencyUnit;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MedicationLogDto {
  id: string;
  medicationId: string;
  administeredAt: string;
  notes: string | null;
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}
```

**Response DTOs** — These mirror the Prisma models but use `string` for dates (JSON serializes dates as strings) and use `| null` for nullable fields. In the request DTOs, optional fields use `?` (can be `undefined`), but in response DTOs, they use `| null` because the database returns `null`, not `undefined`.

---

```ts
export interface DashboardSummary {
  totalPets: number;
  upcomingMedications: number;
  overdueMedications: number;
  complianceRate: number;
}
```

**DashboardSummary** — Placeholder for the Phase 4 dashboard aggregation endpoint. `complianceRate` is a percentage (0-100) of medications given on time.

---

## 0.6 Frontend Scaffold (Next.js 16 + App Router)

### `frontend/package.json`

```json
{
  "name": "@pet-care/frontend",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@hookform/resolvers": "^5.4.0",
    "@mui/icons-material": "^9.0.1",
    "@mui/material": "^9.0.1",
    "@tanstack/react-query": "^5.101.0",
    "next": "16.2.7",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.77.0",
    "zod": "^4.4.3",
    "zustand": "^5.0.14"
  }
}
```

**Dependencies breakdown:**

| Package | Role |
|---------|------|
| `@mui/material` | Component library (buttons, inputs, containers, typography, alerts) |
| `@emotion/react` + `@emotion/styled` | CSS-in-JS engine required by MUI |
| `@tanstack/react-query` | Server state management — caches API responses, auto-refetches, handles loading/error states |
| `zustand` | Client state — auth tokens, UI preferences |
| `react-hook-form` | Form state management — uncontrolled inputs for performance |
| `@hookform/resolvers` | Bridges React Hook Form with Zod validation |
| `zod` | Schema validation library with TypeScript inference |

---

### `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Key settings:**
- `"strict": true` — Full strict mode on the frontend (unlike backend). Catches more bugs at compile time.
- `"moduleResolution": "bundler"` — Modern resolution algorithm used by Next.js/Turbopack. Allows imports without `.js` extensions.
- `"paths": { "@/*": ["./*"] }` — Enables imports like `import { api } from '@/lib/api'` (alias for `frontend/lib/api`). We don't use this consistently yet but it's available.

---

### `frontend/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Pet Care Reminder",
  description: "Track medications and care tasks for your pets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**What it does:** The root layout is a **Server Component** (no `'use client'` directive). It wraps all pages in the `Providers` component. `metadata` is a Next.js API for setting the `<title>` and `<meta>` tags — only works in Server Components.

---

### `frontend/app/providers.tsx`

```tsx
'use client';

import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const theme = createTheme({
  palette: {
    primary: { main: '#5C6BC0' },
    secondary: { main: '#FF8A65' },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

**`'use client'`** — This is a **Client Component** (it uses React hooks like `useState`). In Next.js App Router, components are Server Components by default. You add `'use client'` at the top of any file that needs interactivity.

**`useState(() => new QueryClient())`** — Creates a `QueryClient` once per component mount. The lazy initializer (`() => new QueryClient()`) ensures it's only created once, not on every render. This is the standard React Query setup pattern.

**`QueryClientProvider`** — Makes React Query's cache and hooks (`useQuery`, `useMutation`) available to all child components.

**`ThemeProvider` + `CssBaseline`** — MUI's theme engine. `CssBaseline` applies a CSS reset (normalizes browser defaults). The theme defines primary (indigo) and secondary (deep orange) colors used across all MUI components.

---

### `frontend/app/page.tsx`

```tsx
import { Container, Typography, Button, Box } from '@mui/material';
import Link from 'next/link';

export default function Home() {
  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        🐾 Pet Care Reminder
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track medications, vet visits, and care tasks for your pets.
        Never miss a dose again.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button href="/register" variant="contained" size="large">
          Get Started
        </Button>
        <Button href="/login" variant="outlined" size="large">
          Sign In
        </Button>
      </Box>
    </Container>
  );
}
```

**What it does:** Landing page (Server Component) with a hero heading and two CTAs. `Button` with `href` in Next.js works like an `<a>` tag — it's a client-side navigation using Next.js Link under the hood. The buttons navigate to `/register` and `/login`.

---

## 0.7 Docker Compose

### `docker-compose.yml`

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: pet-care-backend
    env_file:
      - .env
    ports:
      - "4000:4000"
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: pet-care-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000

  db:
    image: postgres:16-alpine
    container_name: pet-care-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: pet_care_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d pet_care_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**Three services:**
- **`backend`** — Builds from the workspace root (`context: .`), so Docker has access to `backend/`, `frontend/`, `shared/`, and the root `package.json` for Yarn workspaces. Depends on `db` being healthy (checks with `pg_isready`) before starting.
- **`frontend`** — Builds from workspace root, sets `NEXT_PUBLIC_API_URL` so the frontend knows where the backend is.
- **`db`** — PostgreSQL 16 Alpine. Named volume `pgdata` persists data across container restarts. Health check ensures the backend doesn't start before the DB is ready.

**Why `context: .`?** Yarn workspaces need the root `package.json` and all workspace `package.json` files to resolve correctly. By building from root, all workspace packages are available.

---

### `backend/Dockerfile`

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock .yarnrc ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY shared/package.json shared/

RUN yarn install --frozen-lockfile

COPY . .

WORKDIR /app/backend
RUN yarn build

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
```

**Multi-stage-ish (single stage):** Copies `package.json` files first (to leverage Docker layer caching — `yarn install` only re-runs if dependencies change), then the rest of the code, then builds. The `CMD` runs the compiled `main.js` directly (not through `nest start`) for production.

---

### `frontend/Dockerfile`

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock .yarnrc ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY shared/package.json shared/

RUN yarn install --frozen-lockfile

COPY . .

WORKDIR /app/frontend
RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]
```

Same pattern. The frontend uses `yarn start` (which runs `next start`) instead of `node` directly.

---

## 0.8 CI Pipeline

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        workspace: [backend, frontend]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'yarn'

      - run: yarn install --frozen-lockfile
      - run: yarn --cwd ${{ matrix.workspace }} lint
      - run: yarn --cwd ${{ matrix.workspace }} build

  prisma-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: npx prisma validate
        working-directory: backend
```

**What it does:** On every push/PR to `main`, runs:
1. **lint-and-build** — matrix over backend + frontend (ESLint + TypeScript compile)
2. **prisma-validate** — validates `schema.prisma` syntax and model definitions (no DB needed)

`yarn install --frozen-lockfile` fails if `yarn.lock` is out of date (ensures reproducible builds). The `cache: 'yarn'` action caches `node_modules` for faster subsequent runs.

**TODO:** Add `yarn --cwd backend test` and `yarn --cwd frontend test` once tests exist.

---

# PHASE 1 — Authentication

---

## 1.1 Auth Module (NestJS Backend)

### `backend/src/auth/auth.module.ts`

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**What it does:** Groups all auth-related code into a single module.

**`PassportModule.register({ defaultStrategy: 'jwt' })`** — Registers Passport with JWT as the default auth strategy. When a route uses `AuthGuard()` (from `@nestjs/passport`), it automatically uses the `'jwt'` strategy unless told otherwise.

**`JwtModule.registerAsync()`** — Configures the JWT module asynchronously (needs `ConfigService` to read the secret). The `useFactory` receives `ConfigService` and returns the configuration:
- `secret` — The signing key from `JWT_SECRET` env var.
- `signOptions: { expiresIn: '15m' }` — Default token expiry. This is the default for `this.jwt.sign()`, but the `AuthService` overrides it per-token type.

**Why `registerAsync` and not `register`?** Because `JWT_SECRET` is in `.env` and loaded by `ConfigService` at runtime. `register()` is for static config, `registerAsync()` allows dynamic config.

---

### `backend/src/auth/auth.service.ts`

```ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}
```

**Constants:**
- `SALT_ROUNDS = 12` — bcrypt salt rounds. Higher = more secure but slower. 12 is the recommended minimum in 2024+ (takes ~250ms on modern hardware). This makes brute-force attacks economically infeasible.
- `ACCESS_TOKEN_EXPIRY = '15m'` — Short-lived. If stolen, the attacker has limited time to misuse it.
- `REFRESH_TOKEN_EXPIRY = '7d'` — Long-lived. Used to get new access tokens without re-entering credentials.

**Constructor injection:**
- `PrismaService` — For database queries.
- `JwtService` — For signing and verifying JWT tokens.

---

```ts
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
    });

    return this.generateTokens(user.id, user.email);
  }
```

**Register flow:**
1. **Check for existing user** — `findUnique` with the email. If found, throw `ConflictException` (HTTP 409). The `@unique` constraint in Prisma schema also prevents duplicates at the DB level, but we check early for a better error message.
2. **Hash password** — `bcrypt.hash()` with 12 salt rounds. This is CPU-intensive by design (makes cracking passwords slow).
3. **Create user** — Inserts into the database. Notice we never store the plaintext password.
4. **Return tokens** — Immediately issues access + refresh tokens so the user is logged in right after registering (no separate login step).

---

```ts
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email);
  }
```

**Login flow:**
1. **Find user by email** — If not found, throw `UnauthorizedException` (HTTP 401).
2. **Verify password** — `bcrypt.compare()` hashes the input and compares to the stored hash. We use the same error message ("Invalid credentials") for both "user not found" and "wrong password" to prevent email enumeration attacks.
3. **Return tokens** — Same as register.

---

```ts
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify<{ sub: string; email: string }>(refreshToken);
      return this.generateTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
```

**Refresh flow:**
1. **Verify the refresh token** — `jwt.verify()` checks the signature and expiry. If the token is expired or tampered with, it throws.
2. **Issue new tokens** — We don't check if the user still exists in the DB (the token is self-contained proof). This is a trade-off: faster but doesn't revoke access for deleted users immediately.
3. **Error handling** — Any verification failure produces the same generic error message.

---

```ts
  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    return {
      accessToken: this.jwt.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRY }),
      refreshToken: this.jwt.sign(payload, { expiresIn: REFRESH_TOKEN_EXPIRY }),
    };
  }
```

**Token structure:** The JWT payload contains:
- `sub` (subject) — The user's UUID. Pronounced "sub," this is the standard JWT claim for identifying the principal.
- `email` — Included for convenience (avoids a DB lookup to display the user's email).
- `iat` (issued at) — Auto-added by `jsonwebtoken`.
- `exp` (expiry) — Set by `expiresIn`.

Both tokens contain the same payload but with different expiry times. The refresh token is essentially a long-lived access token — this is a simplified approach. More secure systems use opaque refresh tokens stored server-side.

---

### `backend/src/auth/dto/register.dto.ts`

```ts
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
```

**What it does:** Defines the expected shape of the registration request body.

**Validation decorators:** Each decorator adds a rule that NestJS's `ValidationPipe` checks automatically when this DTO is used as a controller parameter.

- **`@IsString()`** — Rejects non-string values (numbers, arrays, null).
- **`@MinLength(2)` / `@MaxLength(100)`** — Name constraints. `MinLength(2)` prevents single-character names like "A".
- **`@IsEmail()`** — Validates email format. Uses validator.js's email validator internally.
- **`@MinLength(8)`** — Minimum password length. 8 is the OWASP recommended minimum.
- **`@MaxLength(72)`** — bcrypt has a 72-character input limit. Longer passwords are silently truncated, so we reject them early.

**`@ApiProperty({ example: '...' })`** — Swagger decorator. Without this, the DTO fields wouldn't appear in the Swagger UI request body schema. The `example` provides a sample value for the "Try it out" feature.

---

### `backend/src/auth/dto/login.dto.ts`

```ts
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  password: string;
}
```

**What it does:** Login DTO — simpler than register (no `name` or length constraints on password, though the login endpoint also accepts the shorter password from the register form).

---

### `backend/src/auth/auth.controller.ts`

```ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create a new account' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.auth.refresh(refreshToken);
  }
}
```

**`@ApiTags('Auth')`** — Groups all auth endpoints under an "Auth" section in Swagger UI.

**`@Controller('auth')`** — All routes in this controller are prefixed with `/auth`. So `@Post('register')` becomes `POST /auth/register`.

**`@HttpCode(HttpStatus.OK)`** — By default, `@Post()` returns 201 (Created). For login and refresh, 200 is more appropriate since we're not creating a resource.

**`@Body() dto: RegisterDto`** — The `ValidationPipe` from `main.ts` automatically validates the body against the decorators in `RegisterDto`. If validation fails, NestJS returns a 400 error with the validation errors before the controller method is ever called.

**`@Body('refreshToken')`** — Extracts a single field from the request body (`{ refreshToken: "..." }`) instead of using a full DTO class. Simpler for a single-field request.

---

### `backend/src/auth/strategies/jwt.strategy.ts`

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { JwtPayload } from '../decorators/current-user.decorator.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.getOrThrow<string>('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    return { sub: user.id, email: user.email };
  }
}
```

**What it does:** This is the Passport JWT strategy that validates every incoming request with a Bearer token.

**Constructor:**
- **`config.getOrThrow<string>('JWT_SECRET')`** — Reads the secret from environment. `getOrThrow` throws if the variable is missing (vs `get` which returns `undefined`). This ensures the server fails fast on misconfiguration.
- **`super({...})`** — Configures passport-jwt:
  - `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()` — Reads the token from the `Authorization: Bearer <token>` header.
  - `ignoreExpiration: false` — Reject expired tokens (throws `TokenExpiredError`).
  - `secretOrKey: secret` — The key used to verify the token signature.

**`validate(payload)`:** Called by passport after the token is verified. This is where we do additional checks:
1. Look up the user in the database by `payload.sub` (user ID).
2. If the user was deleted or doesn't exist, throw `UnauthorizedException`.
3. Return the user info that gets attached to `request.user`. Only `sub` and `email` are returned — never the password hash.

---

### `backend/src/auth/guards/jwt-auth.guard.ts`

```ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

**What it does:** Extends the default Passport JWT guard with support for the `@Public()` decorator.

**How `@Public()` works:**
1. `reflector.getAllAndOverride('isPublic', [handler, class])` — Checks if either the specific route handler or the controller class has a `@Public()` decorator.
2. If `isPublic` is true, skip authentication entirely (`return true`).
3. Otherwise, call `super.canActivate()` which runs the standard JWT validation.

This allows us to protect entire controllers by default and selectively opt out individual routes:

```ts
@UseGuards(JwtAuthGuard)  // All routes require auth by default
@Controller('pets')
export class PetsController {
  @Public()              // Except this one
  @Get('public')
  getPublicInfo() {}
}
```

---

### `backend/src/auth/decorators/current-user.decorator.ts`

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
```

**What it does:** A custom parameter decorator that extracts the authenticated user from the request.

**Usage:**
```ts
// Get full user object
@Get('profile')
getProfile(@CurrentUser() user: JwtPayload) {
  return user; // { sub: 'uuid', email: 'test@test.com' }
}

// Get only email
@Get('email')
getEmail(@CurrentUser('email') email: string) {
  return email; // 'test@test.com'
}
```

**How it works:**
1. `createParamDecorator` is NestJS's API for creating custom decorators that can inject values into route handler parameters.
2. `ctx.switchToHttp().getRequest()` gets the Express/NestJS request object.
3. `request.user` is set by Passport after successful JWT validation (from `JwtStrategy.validate()`).
4. If `data` is provided (e.g., `'email'`), it returns just that field. Otherwise returns the whole user object.

---

### `backend/src/auth/decorators/public.decorator.ts`

```ts
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);
```

**What it does:** Sets the metadata key `isPublic` to `true` on the decorated route handler or controller. The `JwtAuthGuard` reads this metadata via the `Reflector` and skips authentication when it's present.

---

## 1.2 Frontend Auth

### `frontend/lib/api.ts`

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || 'Request failed');
  }

  return res.json();
}
```

**What it does:** A thin wrapper around `fetch` that:
1. **Picks the API URL** — From environment variable or defaults to `http://localhost:4000`.
2. **Reads the auth token** — From `localStorage` (set by `useAuthStore`). The `typeof window !== 'undefined'` check is needed because this code runs during SSR (Server-Side Rendering), where `localStorage` doesn't exist. On the server, `token` will be `null`.
3. **Attaches the Bearer header** — If a token exists, adds `Authorization: Bearer <token>` to every request.
4. **Parses errors** — On non-OK responses, tries to parse the error body as JSON and throws a descriptive error. This lets React Query and form handlers catch and display the error message.

**Limitation:** Currently reads from `localStorage` directly rather than from the Zustand store. This is a simplification — in a more robust setup, we'd read from the store. But since the store also persists to localStorage via `persist` middleware, the data is in the same place.

---

### `frontend/lib/auth-store.ts`

```ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens } from '@pet-care/shared';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens: AuthTokens) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,

      setTokens: (tokens: AuthTokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),

      clear: () => set({ accessToken: null, refreshToken: null }),

      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'pet-care-auth' },
  ),
);
```

**What it does:** A Zustand store with `persist` middleware that saves auth tokens to localStorage.

**Zustand basics:** Zustand is a tiny state manager. `create()` returns a React hook (`useAuthStore`) that components call to read state and get setter functions.

**`persist()` middleware:** Automatically saves the store state to localStorage under the key `'pet-care-auth'`. When the page loads, it hydrates the store from localStorage, so the user stays logged in across page refreshes.

**Store actions:**
- `setTokens(tokens)` — Called after login/register to store the JWT tokens.
- `clear()` — Called on logout to remove tokens.
- `isAuthenticated()` — Returns `true` if an access token exists. Used by protected pages to check auth state.

**Security note:** Storing JWTs in localStorage means they're accessible to any JavaScript running on the same origin (including XSS attacks). For this project, that's acceptable. In production, you'd use httpOnly cookies (not accessible via JS) for refresh tokens and keep access tokens in memory.

---

### `frontend/app/login/page.tsx`

```tsx
'use client';

import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import Link from 'next/link';
import type { AuthTokens, LoginRequest } from '@pet-care/shared';
```

**Imports breakdown:**
- `useForm`, `zodResolver` — React Hook Form with Zod integration.
- `z` — Zod schema builder (creates validation schemas).
- `useRouter` — Next.js navigation hook (client-side routing).
- `api` — Our fetch wrapper for API calls.
- `useAuthStore` — Zustand store for token management.
- `AuthTokens`, `LoginRequest` — Types from shared package.

---

```tsx
const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
```

**Zod validation schema:**
- `email` must be a valid email format. If invalid, the error message is `'Invalid email address'`.
- `password` must have at least 1 character. This is intentionally loose (we already validated password rules during registration).

Zod infers the TypeScript type from the schema. We pass `LoginRequest` as the generic type parameter to `useForm`, which adds type safety — if we try to access a non-existent field, TypeScript catches it.

---

```tsx
export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({ resolver: zodResolver(schema) });
```

**`useForm<LoginRequest>({ resolver: zodResolver(schema) })`:**
- Generic `<LoginRequest>` — TypeScript checks that field names match `LoginRequest` interface.
- `resolver: zodResolver(schema)` — Connects Zod validation to React Hook Form. On each input change or form submit, React Hook Form runs the schema validation and maps errors back to the form state.
- Returns `register` (binds inputs), `handleSubmit` (wraps onSubmit), `errors` (validation errors), `isSubmitting` (true during async submit).

**`useAuthStore((s) => s.setTokens)`:** Zustand selector — subscribes only to `setTokens`, so the component doesn't re-render when other parts of the store change.

---

```tsx
  const onSubmit = async (data: LoginRequest) => {
    setError(null);
    try {
      const tokens = await api<AuthTokens>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setTokens(tokens);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  };
```

**Form submission flow:**
1. **Clear previous errors** — `setError(null)`.
2. **Call API** — `api<AuthTokens>('/auth/login', { method: 'POST', body: JSON.stringify(data) })`. The `api` function adds the `Content-Type: application/json` header automatically.
3. **Store tokens** — `setTokens(tokens)` saves to Zustand (and thus localStorage).
4. **Redirect** — `router.push('/dashboard')` navigates client-side (no full page reload).
5. **Error handling** — If the API throws (e.g., 401 "Invalid credentials"), we display the error message. TypeScript's `instanceof Error` check handles the case where `catch` receives a non-Error value.

---

```tsx
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Sign In
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
        <TextField label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </Box>

      <Typography align="center" sx={{ mt: 2 }}>
        Don&apos;t have an account? <Link href="/register">Register</Link>
      </Typography>
    </Container>
  );
```

**JSX breakdown:**
- **`Container maxWidth="xs"`** — MUI container with "extra small" max width (centers the form, keeps it narrow).
- **`Box component="form"`** — Renders a `<form>` element with flexbox column layout.
- **`handleSubmit(onSubmit)`** — React Hook Form's wrapper. Calls `onSubmit` only if validation passes. If validation fails, `onSubmit` is not called and the UI shows errors.
- **`{...register('email')}`** — Spreads the input props: `value`, `onChange`, `onBlur`, `name`, and `ref`. This is React Hook Form's "uncontrolled" mode — the input manages its own state internally (better performance than controlled with `useState`).
- **`error={!!errors.email}`** — MUI TextField shows red border when `error` is true.
- **`helperText={errors.email?.message}`** — Shows the Zod error message below the input.
- **`isSubmitting ? 'Signing in...' : 'Sign In'`** — Shows loading state on the button while the request is in flight.

---

### `frontend/app/register/page.tsx`

```tsx
'use client';

import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth-store';
import Link from 'next/link';
import type { AuthTokens, RegisterRequest } from '@pet-care/shared';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
```

**Register schema — key differences from Login:**
- **`name`** — `min(2)` matches the backend's `@MinLength(2)`.
- **`password`** — `min(8)` matches the backend's `@MinLength(8)`. This catches mistakes before the API call.

---

```tsx
  const onSubmit = async (data: RegisterRequest) => {
    setError(null);
    try {
      const tokens = await api<AuthTokens>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setTokens(tokens);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    }
  };
```

Same pattern as Login but calls `/auth/register` instead. After successful registration, the user is automatically redirected to the dashboard (no separate login step).

**Why auto-login after registration?** It's a common UX pattern — the user just created an account, making them sign in again would be friction. The backend returns tokens immediately upon registration for exactly this reason.

---

```tsx
  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Create Account
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField label="Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
        <TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
        <TextField label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </Box>

      <Typography align="center" sx={{ mt: 2 }}>
        Already have an account? <Link href="/login">Sign In</Link>
      </Typography>
    </Container>
  );
```

Three fields instead of two: Name, Email, Password. The `Link` at the bottom navigates to Login instead.

---

### `frontend/app/dashboard/page.tsx`

```tsx
'use client';

import { Container, Typography, Button, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth-store';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, clear } = useAuthStore();

  useEffect(() => {
    if (!accessToken) router.push('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button variant="outlined" color="error" onClick={() => { clear(); router.push('/'); }}>
          Sign Out
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary">
        Welcome to your pet care dashboard. Coming soon.
      </Typography>
    </Container>
  );
}
```

**Auth guard pattern:**
1. **Check auth on mount** — `useEffect` runs after the component renders. If no `accessToken`, redirect to `/login`.
2. **Return null on first render** — `if (!accessToken) return null;` prevents a flash of the dashboard content before the redirect fires. This is necessary because `useEffect` runs after the render.
3. **Sign Out** — Calls `clear()` (removes tokens from Zustand + localStorage) and navigates to the landing page.

**Limitation:** This is a client-side check only. The backend still protects API routes via `JwtAuthGuard`. A determined user could manipulate the frontend code, but they couldn't access protected data without a valid token.

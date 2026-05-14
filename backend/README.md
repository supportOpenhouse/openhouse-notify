# Notification Platform — Backend

Enterprise-grade SaaS notification management platform backend. Built as a **modular monolith** using **DDD (Domain-Driven Design)** and **clean architecture**, designed to support future migration to microservices.

---

## Architecture

```
backend/
├── src/
│   ├── app/               # Express bootstrap, server, graceful shutdown
│   ├── config/            # Zod-validated env config (app, db, redis, queue)
│   ├── shared/            # Shared kernel (DDD base classes + errors + types)
│   │   ├── kernel/        # Entity, AggregateRoot, ValueObject, DomainEvent, IRepository
│   │   ├── errors/        # AppError, DomainError, HTTP error subclasses
│   │   └── types/         # ApiResponse, PaginationMeta, PaginatedResponse
│   ├── infrastructure/    # Framework adapters (Prisma, Redis, BullMQ, Winston)
│   ├── modules/           # Feature modules (DDD bounded contexts)
│   ├── queue/             # Queue jobs, processors, workers
│   ├── websocket/         # Socket.IO gateway, events, namespaces
│   ├── workers/           # Retry workers, scheduled workers
│   ├── middlewares/       # error, request-context, not-found
│   ├── routes/            # Versioned API router (/api/v1/*)
│   ├── events/            # In-process domain event bus
│   ├── providers/         # External provider adapters (Firebase, etc.)
│   ├── utils/             # asyncHandler, response helpers
│   ├── constants/         # App + HTTP constants
│   └── types/             # Global TypeScript augmentations
├── prisma/                # Prisma schema and migrations
├── logs/                  # Winston log output (production)
└── scripts/               # One-off migration/seeding scripts
```

---

## DDD Module Structure

Every feature module follows an identical layered structure:

```
modules/
└── campaigns/
    ├── domain/            # Entities, value objects, repository INTERFACES
    │   ├── entities/
    │   ├── value-objects/
    │   └── repositories/
    ├── application/       # Use cases, commands, queries (CQRS)
    │   ├── use-cases/
    │   ├── commands/
    │   └── queries/
    ├── infrastructure/    # Repository implementations (Prisma)
    │   └── repositories/
    ├── presentation/      # HTTP layer (controllers + Express routes)
    │   ├── controllers/
    │   └── routes/
    ├── contracts/         # Public interfaces exposed to other modules
    ├── dto/               # Request/response DTOs (Zod schemas)
    ├── mapper/            # Domain entity <-> Prisma model <-> DTO
    ├── events/            # Domain events for this bounded context
    ├── types/             # Module-local TypeScript types
    └── constants/         # Module-local constants
```

### Modules implemented (skeleton)

| Module | Bounded Context |
|---|---|
| `campaigns` | Campaign lifecycle: create, schedule, launch, pause, complete |
| `notifications` | Individual notification delivery and status tracking |
| `audiences` | User segmentation and targeting rules |
| `templates` | Reusable notification templates with variable interpolation |
| `analytics` | Delivery metrics: sent, delivered, opened, failed |
| `queue-monitor` | Real-time BullMQ queue visibility |
| `test-notifications` | One-off device test push for QA |
| `settings` | Platform-wide configuration |
| `users` | End-user profiles and opt-out state |
| `devices` | Device registrations (iOS/Android/Web) |
| `fcm-tokens` | FCM push token lifecycle |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 (strict mode) |
| HTTP | Express 4 |
| ORM | Prisma 5 + PostgreSQL |
| Queue | BullMQ + Redis (ioredis) |
| WebSocket | Socket.IO 4 |
| Validation | Zod |
| Logging | Winston |
| Dev server | tsx + nodemon |
| Formatting | Prettier + ESLint + Husky |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and REDIS_* values
```

### 3. Generate Prisma client

```bash
npm run db:generate
```

### 4. Run migrations

```bash
npm run db:migrate:dev
```

### 5. Start dev server

```bash
npm run dev
```

Server starts on `http://localhost:4000`. Health check: `GET /api/v1/health`

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Start compiled production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run type-check` | TypeScript type checking (no emit) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate:dev` | Create + apply migration (development) |
| `npm run db:migrate:prod` | Apply pending migrations (production) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run worker:dev` | Start worker process with hot reload |
| `npm run queue:dev` | Start queue process with hot reload |

---

## Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:

| Alias | Maps to |
|---|---|
| `@app/*` | `src/app/*` |
| `@config/*` | `src/config/*` |
| `@shared/*` | `src/shared/*` |
| `@infrastructure/*` | `src/infrastructure/*` |
| `@modules/*` | `src/modules/*` |
| `@queue/*` | `src/queue/*` |
| `@websocket/*` | `src/websocket/*` |
| `@workers/*` | `src/workers/*` |
| `@middlewares/*` | `src/middlewares/*` |
| `@routes/*` | `src/routes/*` |
| `@events/*` | `src/events/*` |
| `@utils/*` | `src/utils/*` |
| `@constants/*` | `src/constants/*` |
| `@providers/*` | `src/providers/*` |

---

## Architecture Decisions

**Modular monolith over microservices (Phase 1)**
Each module has hard boundaries and owns its own data access. This allows splitting into microservices later without large refactors — just extract the module directory.

**DDD shared kernel**
`Entity`, `AggregateRoot`, `ValueObject`, `DomainEvent`, and `IRepository` are in `shared/kernel`. All modules extend these — a uniform base across bounded contexts.

**CQRS-ready application layer**
Each module separates commands (writes) and queries (reads) from day one, even though a full CQRS bus is not yet wired. This makes future event sourcing additions non-breaking.

**BullMQ over raw Redis pub/sub**
BullMQ provides job persistence, retries, backoff, and queue observability. All async work (FCM sends, analytics ingestion) will run through named queues in `QUEUE_NAMES`.

**Infrastructure adapters, not leaking Prisma**
The `domain/repositories/` folder defines interfaces. The `infrastructure/repositories/` folder holds Prisma implementations. Domain code never imports from `@prisma/client`.

**Zod for environment validation at startup**
`src/config/env.ts` parses and validates all environment variables on boot. The process exits with a clear error if required vars are missing or malformed — no silent failures.

---

## Next Phase

- Wire up module routes in `src/routes/v1/index.ts`
- Implement domain entities and repository interfaces per module
- Wire BullMQ queue processors for FCM delivery
- Implement Socket.IO gateway into the HTTP server
- Add Firebase Admin SDK provider under `src/providers/`
- Expand Prisma schema with full relations and indexes

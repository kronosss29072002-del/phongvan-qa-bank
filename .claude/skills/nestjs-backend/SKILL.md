---
name: nestjs-backend
description: "Build NestJS 11 backends with Prisma ORM: modular TS architecture (modules, controllers, services, providers), REST/GraphQL API design, class-validator DTOs, Prisma schema design/migrations, testing (unit/integration/e2e with Jest + supertest). Use when scaffolding NestJS APIs, designing Prisma schemas/migrations, implementing modules/DI/guards/interceptors/exception filters, adding Swagger/OpenAPI docs, health checks, or writing NestJS tests."
license: MIT
version: 1.0.0
---

# NestJS Backend Skill

NestJS 11 + Prisma ORM — modular TypeScript backend architecture, API design, testing, and deployment.

## When to Use

- Scaffolding a new NestJS project or adding a feature module to an existing one
- Designing Prisma schemas, relations, and migrations
- Implementing REST or GraphQL APIs with DTO validation
- Wiring guards, interceptors, pipes, exception filters, middleware
- Writing unit/integration/e2e tests for NestJS apps
- Adding Swagger/OpenAPI docs, health checks, rate limiting, API versioning

## Architecture Overview

```
Request → Guards (auth) → Interceptors (logging/transform) → Pipes (validation)
       → Controller (route) → Service (business logic) → PrismaService → PostgreSQL
       → Interceptors (response map) → ExceptionFilter (errors → HTTP status)
```

- **Modules** scope providers per feature — one module per domain (users, orders)
- **Controllers** own HTTP routes + DTOs; never business logic
- **Services** hold business logic, inject PrismaService; testable in isolation
- **AppModule** root-anchored; feature modules export only their public API

## Quick Start

```bash
# NestJS 11 + Prisma 7 — one-shot scaffold
npx @nestjs/cli new api --package-manager npm --strict
cd api && npm i prisma @prisma/client class-validator class-transformer @nestjs/config
npx prisma init          # creates prisma/schema.prisma + .env
# define models → npx prisma migrate dev --name init
```

Minimal wiring (do this before writing features):

```ts
// main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
// PrismaModule root module: @Global() with PrismaService extending PrismaClient
```

## Reference Navigation

- `references/nestjs-patterns.md` — modules, DI, guards/interceptors/pipes, exception filters, DTOs, ConfigModule, health checks, Swagger
- `references/prisma-patterns.md` — schema design, migrations, CRUD, transactions, N+1 prevention, pooling, soft delete, audit trails
- `references/api-design.md` — REST conventions, status codes, pagination, error shapes, rate limiting, CORS, versioning, OpenAPI
- `references/testing-patterns.md` — Jest unit tests, supertest e2e, Prisma mocking, fixtures, CI pipeline, coverage

## Best Practices (non-negotiables)

- **Validation:** DTOs are classes with class-validator decorators; global pipe `whitelist + forbidNonWhitelisted + transform`; `ParseIntPipe` for route params
- **Errors:** only built-in HttpException subclasses with `HttpStatus` enum; one global catch-all filter mapping Prisma P2002→409, P2025→404
- **Transactions:** callback-style `prisma.$transaction(async (tx) => ...)`; keep short; encapsulate creation in a narrow factory
- **Data access:** `include`/`select` over lazy queries — never N+1; atomic `+1/-1` updates; no `any`
- **Concurrency:** write paths that can collide get optimistic locking (version field) or explicit row locking
- **Config:** `@nestjs/config` + env validation at startup; no secrets in code
- **Ops:** `/health` + `/ready` endpoints, structured logging, rate limit auth + write endpoints
- **Migrations:** never `sync`/`autoLoadModels` in production; expand-contract, nullable-before-required

## Decision Matrix

| Decision | Option A | Option B | When |
|----------|----------|----------|------|
| HTTP engine | Express (default) | Fastify | Express for ecosystem/team familiarity; Fastify for throughput-critical APIs (2-3x req/s) |
| API style | REST | GraphQL | REST for simple/public APIs, caching, versioning; GraphQL for client-driven queries, aggregating multiple sources |
| ORM | Prisma | TypeORM / Drizzle | Prisma for schema-first DX, type safety, migrations; TypeORM for decorator-first + raw SQL heavy; Drizzle for SQL-kit + max performance |
| Validation | class-validator (sync) | zod/joi at boundary | class-validator integrates with Nest pipes + Swagger; zod as source-of-truth when sharing types with frontend |
| Auth | JWT (@nestjs/jwt + passport) | Session (express-session) | JWT for stateless API/mobile; sessions for server-side revocation needs |

## Implementation Sequence

1. Scaffold + ConfigModule + global ValidationPipe
2. Prisma schema → migrate → seed
3. Feature module: DTO → controller → service → module registration
4. Exception filter + Swagger + health checks
5. Tests: service unit spec → controller spec → e2e spec
6. CI: lint --no-fix, typecheck, seed-transform audit, test pipeline
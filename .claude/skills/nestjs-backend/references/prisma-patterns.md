# Prisma Patterns — Schema, Migrations, Queries, Transactions

Prisma 7 + PostgreSQL (repo stack). Schema-first: `prisma/schema.prisma` is the single source of truth; client is generated from it.

## Schema Design

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  version   Int      @default(0)          // optimistic locking
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id       String  @id @default(uuid())
  authorId String
  author   User    @relation(fields: [authorId], references: [id])
  title    String
  @@index([authorId, createdAt(sort: Desc)])  // composite index for list queries
}
```

- IDs: uuid/cuid over auto-increment for distributed safety; `String @id @default(uuid())`
- Relations: explicit FK field + relation field; always `onDelete: Cascade` / `SetNull` decided per relation (Prisma 7 requires explicit referential actions — default is now `Restrict`)
- Enums: `enum Role { USER ADMIN }` — native PG `enum` via `@db.` when preview needed; plain Prisma enum otherwise
- Composite keys: `@@id([orgId, slug])` — use when a natural pair is the identity
- Indexes: add `@@index` for every filter/sort pattern in queries; composite index order matters (leftmost prefix rule)

## Migrations Strategy

```bash
npx prisma migrate dev --name add_posts   # dev: generate + apply + regenerate client
npx prisma migrate deploy                 # prod/staging: apply only, never generate
```

- Never `prisma db push` in production; never `sync`/`autoLoadModels` — schema changes are migration files, reviewed like code
- **Expand-contract:** add column nullable → deploy → backfill → set NOT NULL — never drop columns online
- Migration SQL is reviewable: `prisma migrate diff` to inspect; a migration that drops data = review blocker
- Lockfile: commit `package-lock.json` (or pnpm-lock) — supply-chain hygiene is a CI gate

## CRUD Patterns

```ts
// one-to-one: create nested
prisma.user.create({ data: { email, profile: { create: { bio } } } });
// update with atomic number ops — no read-modify-write race
prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });
// upsert for idempotent writes
prisma.user.upsert({ where: { email }, create, update });
```

## N+1 Prevention (mandatory)

- `include` related records in the same query; `select` to shape payloads and skip unused columns
- `omit: { password: true }` (global or per-query) — never leak sensitive fields
- Rule: any loop calling Prisma per row is a bug — use `include`, `findMany` + in-memory join, or `groupBy`

## Transactions

- **Interactive (callback) preferred for multi-step logic:**

```ts
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data });
  await tx.stock.update({ where: { id: productId }, data: { qty: { decrement: 1 } } });
});
```

- **Batch (`$transaction([...])`)** — array of independent writes, all-or-nothing, no read-then-write dependencies
- Timeouts: default maxWait 2s / timeout 5s; keep transactions short — no external HTTP calls inside
- Testability: encapsulate in a narrow factory (`TransactionRunner`-style) so services depend on an interface, not `PrismaClient` directly
- **Concurrency:** two transactions updating the same row collide — guard with a `version` field (optimistic: check `version` in `where`, bump on write, retry on P2034/P2025) or `SELECT FOR UPDATE`

## Raw SQL & Pooling

- `prisma.$queryRaw` / `$executeRaw` tagged templates — parameterized, injection-safe; use for analytical queries JSON/grouping can't express
- Never string-concatenate user input into raw SQL
- Pooling: single PrismaClient instance (NestJS global module reuses one connection pool); in serverless, `prisma generate --no-engine` + driver adapters (`@prisma/adapter-pg`) instead of the binary engine; set `connection_limit` per deployment

## Seeding, Soft Delete, Audit

- Seed via `prisma/seed.ts` (tsx + `prisma db seed`), idempotent upserts, env-driven count
- **Soft delete:** `deletedAt DateTime?` + `@@index([deletedAt])`; all queries filter `deletedAt: null` by default; hard-delete joins/cascade at the edges. Where used, do it in one helper/scope so no query forgets the filter
- **Audit trail:** separate `AuditLog` model (actorId, action, entityType, entityId, before/after JSON) written in the same transaction as the mutation — never duplicated into every service; consider a Prisma client extension (`$extends`) to centralize hooks

## Prisma Client Extension (7.x)

```ts
const xprisma = prisma.$extends({
  query: { user: { findMany: async ({ args, query }) => query({ ...args, where: { ...args.where, deletedAt: null } }) } },
});
```

Centralize soft-delete, audit, and tenant scoping in extensions — keeps services lean and consistent.
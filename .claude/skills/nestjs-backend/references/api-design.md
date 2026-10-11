# API Design — REST Conventions, Errors, Ops

NestJS REST APIs. Consistent conventions beat cleverness; every rule below exists so clients and tooling can rely on shape.

## Resource Naming & Methods

- Nouns plural: `/users`, `/users/:id/posts` — never verbs (`/getUsers`)
- Sub-resources only when the child is meaningless alone; otherwise top-level with query (`/posts?authorId=`)
- Methods carry semantics:
  - `GET` — read, idempotent, cacheable
  - `POST` — create / non-idempotent action; returns `201` + created resource
  - `PUT` — full replace, idempotent
  - `PATCH` — partial update (`PartialType(CreateDto)`)
  - `DELETE` — `204` no body or `200` with confirmation resource
- RPC-ish actions on a resource are a smell — model them as sub-resources (`POST /orders/:id/cancel`) or state transitions with validation

## Status Codes (HttpStatus enum — never raw numbers)

| Code | Use |
|------|-----|
| 200 | success (GET, PATCH, DELETE-with-body) |
| 201 | created (POST) |
| 204 | no content (DELETE) |
| 400 | malformed input — validation pipe rejection |
| 401 | unauthenticated |
| 403 | authenticated but forbidden (RBAC guard) |
| 404 | not found on resource / relation |
| 409 | conflict — Prisma P2002 unique violation |
| 422 | semantic validation (state transition invalid) |
| 429 | rate limited |
| 500 | unexpected — never leak internals in body |

## Error Response Shape (one global filter)

```json
{ "statusCode": 404, "message": "User 42 not found", "error": "Not Found" }
```

- Every error passes through the one catch-all filter; it maps Prisma codes (P2002→409, P2025→404, P2034→retry) and logs with request id
- `throw new NotFoundException('User 42 not found', { cause: err })` — enrich, never swallow
- Never return raw `Error` messages to clients; never include stack traces

## Pagination (limit/offset — repo convention)

```
GET /users?limit=20&offset=0
Response: { data: [...], meta: { total, limit, offset, hasMore } }
```

- `limit` capped (`max 100`), validated via DTO (`@IsInt() @Min(1) @Max(100)`); default 20
- Keyset/cursor (`?cursor=`) preferred for large, append-heavy tables — stable under inserts
- Count in the same response is an extra query — accept it, or move to headers (`X-Total-Count`) when the table is huge

## Response Envelopes

- Collections: `{ data: [...], meta: {...} }` — keeps room for meta without breaking list shape
- Single resources: return the resource directly (no `{ data: ... }` wrapper) unless frontend needs version/meta — pick one rule and keep it repo-wide
- Slice/transform via `SerializerInterceptor`/`@Exclude` when hiding fields; don't hand-roll per endpoint

## Rate Limiting & CORS

- `@nestjs/throttler` — global `ThrottlerGuard` (TimeToLive-based, storage-backed in multi-instance: Redis); **auth + write endpoints get tighter limits** than reads
- 429 responses must include `Retry-After`
- CORS: explicit origin allowlist from config in prod; never `*` with credentials; `credentials: true` + `Vary: Origin` header

## API Versioning

- URL prefix (`/v1/users`) — visible, cache-friendly, simplest (repo convention)
- Header (`X-API-Version`) or media type for internal/contract-sensitive APIs
- Policy: deprecate with `Deprecation` + `Sunset` headers; keep one version alive at least N months; document the deprecation schedule in the OpenAPI description

## HATEOAS (apply sparingly)

- Add `_links` only where navigation genuinely helps: `{ "self": "...", "next": "...", "related": "..." }` — place on paginated collections and state-machine resources
- Don't wrap every response with links just to claim HATEOAS

## OpenAPI Schema Validation

- Swagger module generates the spec from decorators/DTOs — the DTO is the schema, update both together
- CI gate: run `swagger-cli validate` (or `@apidevtools/swagger-parser`) on the emitted JSON; contract tests hit status codes + shapes, not implementation
- If frontend types are shared, generate them from the OpenAPI spec (`openapi-typescript`) or keep a zod schema as single source of truth — never hand-maintain two copies

## Security Basics

- `helmet` middleware; CSRF for cookie-auth endpoints; auth before data access in every guard-protected route
- Never log bodies containing tokens/credentials; redact in the logging interceptor
# Testing Patterns — Jest, supertest, Prisma Mocks

Repo stack: Jest + TestingModule (unit), supertest (e2e), CI pipeline in `.github/workflows/ci.yml`. Spec naming: `*.spec.ts` beside source, `*.e2e-spec.ts` in `test/`.

## Unit Tests — Service in Isolation

```ts
const moduleRef = await Test.createTestingModule({ providers: [UsersService] }).compile();
service = moduleRef.get(UsersService);
```

- **Mock PrismaService by token**, never by connection:

```ts
const prismaMock = { user: { findMany: jest.fn(), create: jest.fn() } };
providers: [UsersService, { provide: PrismaService, useValue: prismaMock }]
```

- Assert: service calls Prisma with the right args (`expect(prismaMock.user.create).toHaveBeenCalledWith(...)`) and transforms results — not that Prisma behaves
- Global enhancers (`APP_GUARD/APP_PIPE/APP_INTERCEPTOR`) are overridable at registration site — override rather than duplicate the guard logic
- Request-scoped providers: `await moduleRef.resolve(T)` — unique instance per call

## e2e Tests — supertest

```ts
// test/app.e2e-spec.ts
beforeAll(async () => {
  app = await createTestApp();               // like main.ts: pipes, filters, versioning
  await app.init();
});
afterAll(async () => await app.close());

it('GET /users returns 200 + shape', async () => {
  await request(app.getHttpServer()).get('/users').expect(200).expect((res) => {
    expect(res.body.data).toBeInstanceOf(Array);
  });
});
```

- Create the app the same way main.ts does (same global pipe/filter) — e2e must test the real wiring
- Test the DB against a disposable schema (per-run `migrate deploy` + truncate between suites), not shared local data
- Assert status codes + response shapes; chained `.expect(200).expect({...})` for stable payloads
- Never `waitForTimeout`-style sleeps — use `app.getHttpServer()` + real awaits; the HTTP server has no fake timers

## Prisma Mocking Strategies

| Level | Approach | Use for |
|-------|----------|---------|
| 1 — unit | `useValue` mock with `jest.fn()` per method | service logic, arg assertions (fastest) |
| 2 — integration | real PrismaClient against test DB (docker `mc-postgres`, `DATABASE_URL` per env) | transactions, relation queries, constraint behavior |
| 3 — e2e | real app + seeded test DB; rollback via transactions or truncate | full HTTP path, auth, filters |

- For level 1, keep the mock shape mirrored to the client (`{ user: { findMany }, post: {...} }`) — a flat mock breaks when you add nested calls
- Mock transaction flow: `prisma.$transaction.mockImplementation(async (fn) => fn(prismaMock))` — passes the same mock as `tx` so callback code runs against recorded calls

## Test Fixtures & Factories

- Data factory with faker + overrides (`createUserData({ role: 'ADMIN' })`) — unique + traceable (prefix + timestamp + uuid)
- Vitest/Jest `beforeEach` resets mocks (`jest.clearAllMocks()`); `afterEach` for cleanup
- Fixtures live in `test/fixtures/` or `test/factories/` — not scattered in specs
- Transaction test validity: **write the regression test BEFORE the fix** (bug-fix protocol) — it must fail on the buggy code

## CI Test Pipeline (mirrors repo ci.yml)

```yaml
- name: Backend unit tests
  run: npm run test -- --coverage
- name: Backend e2e
  run: npm run test:e2e          # needs DATABASE_URL (service container postgres)
- run: npm run lint -- --no-fix
- run: npm run typecheck          # 3-stage: src, test, e2e
```

- Lint with `--no-fix` — formatting is a human gate (auroris rule: no silent auto-format during review)
- Seed-transform audit: verify seed scripts against schema on CI, so renamed fields surface before deploy

## Coverage Targets & Snapshot Testing

- Targets: lines ≥ 80% overall; services ≥ 85%; every controller covered via e2e happy + error path
- CI fails on regression (onlycompare — never lower thresholds to pass)
- **API snapshot testing:** keep for stable response shapes only — re-shape events, timestamps, and ids must be normalized (replace uuid/date with placeholders) before snapshotting, or the snapshot churns on every run
- Prefer targeted `toMatchObject` assertions over whole-body snapshots for endpoints under active development

## Common Traps

- Forgetting `app.close()` in `afterAll` — Jest hangs on open handles
- Mocking `PrismaService` methods the service never calls — mocks should be minimal and driven by the code under test
- e2e asserting implementation details (internal DI tokens) instead of HTTP behavior
- Never accept mass test updates from an AI refactor silently — audit every changed assertion (swe_conventions §5)
- Do not rely on detector tools for review evidence; verify by running the suite
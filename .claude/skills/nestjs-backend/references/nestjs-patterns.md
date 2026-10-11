# NestJS Patterns — Modules, DI, Lifecycle, Docs

NestJS 11. TypeScript-first; reflect-metadata + decorators. Everything below is the standard shape used in this repo stack.

## Module Architecture

- **Feature modules** — one per domain (users, orders, auth). Each declares its controllers + providers, imports what it needs, exports only public API (typically service).
- **Shared modules** — plain module re-exported via `imports`; never register the same provider in two modules.
- **Global modules** — `@Global()` + `@Module({})`; register once at root (PrismaModule is the repo's only global). Minimize.
- **Dynamic modules** — `forRoot/forFeature` naming contract; use `ConfigurableModuleBuilder` instead of hand-written `registerAsync`.

```ts
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## DI Patterns

- Constructor injection everywhere; `@Injectable()` on providers.
- Tokens: `@Inject('CACHE')` with `{ provide: 'CACHE', useValue: ... }`; `useFactory` for async config.
- Module classes can inject providers but never be injected as providers.
- Request-scoped: `@Injectable({ scope: Scope.REQUEST })` + `moduleRef.resolve(T)` — unique instance per call; only when you need per-request state.

## Request Lifecycle

```
middleware → guards → interceptors(pre) → pipes → controller → service → interceptors(post) → exception filter
```

- **Guards** — auth/roles, run before handler. `CanActivate`, return boolean; attach via `@UseGuards(AuthGuard)` or global `APP_GUARD`.
- **Interceptors** — transform responses, add logging/timing, `map` result via `tap(observable)`.
- **Pipes** — validation/transformation. Global `ValidationPipe` (see SKILL.md); `ParseIntPipe` for `@Param('id')`; custom pipes for domain transforms.
- **Exception filters** — `@Catch()` + `extends BaseExceptionFilter`, resolve `HttpAdapterHost` in `catch()`; exactly ONE registered via `APP_FILTER`. Map Prisma errors there: P2002→409 Conflict, P2025→404 NotFound, P2034→retry.
- **Middleware** — `NestModule.configure(consumer)`; raw request-level (logging, CORS headers).

## Custom Decorators

```ts
// param decorator factory
export const CurrentUser = createParamDecorator((data, ctx: ExecutionContext) =>
  ctx.switchToHttp().getRequest().user);
```

## DTOs & Validation (mandatory)

- DTOs are **classes** with class-validator decorators — interfaces have no TS metadata at runtime.
- PATCH → `PartialType(CreateDto)` from `@nestjs/mapped-types`; array body → `ParseArrayPipe({ items: CreateDto })`.
- Global pipe must be `{ whitelist: true, forbidNonWhitelisted: true, transform: true }` — strips unknown props (API hardening) and coerces types.
- class-validator + class-transformer are runtime deps, not devDeps.

## ConfigModule & Env Validation

```ts
// app.module.ts
ConfigModule.forRoot({ isGlobal: true, validate: validateEnv });
// validateEnv: Joi or Envalid schema; fail fast at startup on missing/typed-wrong vars
```

Never read `process.env` directly in services — inject `ConfigService`.

## Health Checks & Ops

- `@nestjs/terminus` — `/health` (liveness) + `/ready` (readiness: DB ping via PrismaHealthIndicator).
- Structured logging (pino-http / nestjs-pino) with correlation ID middleware; log errors with context, not silent catches.

## Swagger / OpenAPI

```ts
// main.ts
const config = new DocumentBuilder().setTitle('API').setVersion('1.0').addBearerAuth().build();
SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
```

- Decorators `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty` on DTOs — keep DTO + schema in one place.
- Global pipe `transform: true` must stay on: Swagger generates example payloads from DTO metadata.

## Common Traps

- Registering a controller without its module's providers → resolution errors at boot, not runtime — check `providers` array.
- Multiple `APP_*` for the same concern (two global filters) — exactly one each.
- Decorator order in handlers (`@UseGuards` before `@UseInterceptors` matters only for readability).
- `app.listen` port from `ConfigService`, never hardcoded; `app.enableCors` explicit origin lists in prod.
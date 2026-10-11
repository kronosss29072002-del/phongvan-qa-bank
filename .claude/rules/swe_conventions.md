# 🛡️ SWE CONVENTIONS — Code + UI không giống AI làm, backend best practices

> **Áp dụng cho:** mọi session/subagent viết code trong project này (nestjs-api-architect, frontend-react, prisma-db-specialist, rest-api-designer, playwright-qa-automation, và mọi agent code).
> **Nguyên tắc vàng:** Code tốt không phải "do AI hay người viết" — nó tuân theo convention repo, ít ẩn ý, dễ đọc, có lý do tồn tại. AI-tell không phải "có comment" hay "lạm dụng pattern" — nó là code viết cho máy đọc mà không ai đọc lại, hoặc polish bề ngoài che giấu thiếu reasoning.
> **Cách dùng:** Quét khi review code (flag, không tự sửa máy móc — auroris rule). Đánh dấu [FP] khi false positive.
> **Trạng thái:** v1.0.0 draft — calibrate 2 tuần trước khi bật gate/CI.

---

## 1. TIER 1 — KILL ON SIGHT (cấm tuyệt đối)

### Naming & structure
| Pattern | Thay bằng |
|---|---|
| Biến vô nghĩa: `foo`, `bar`, `data`, `temp`, `result` | Tên mô tả hành vi thật (`userCount`, `sortedRows`) |
| Identifier self-consistency: cùng file dùng 2 tên cho 1 thứ (`userList` + `userRows`) | Một tên, giữ xuyên suốt file |
| Comment giải thích "what", không "why" | Code tự nói what; comment giữ why (Jeff Atwood: Code Tells You How, Comments Tell You Why) |
| Empty catch / `.catch(() => {})` | Catch → enrich → rethrow |
| Magic number/string lặp 2+ lần | Hằng số có tên |
| `any` không lý do | Type cụ thể, narrow properly |
| Comment lấp lửng: "should work hopefully", "might break" | Xóa — hedge là dấu hiệu chưa verify |

### Control flow & correctness
| Pattern | Thay bằng |
|---|---|
| Mutable default argument (`def f(items=[])`) | Immutable default + None guard (block-class finding) |
| `except:` / `catch {}` trần nuốt SystemExit/KeyboardInterrupt | Bắt exception cụ thể |
| Empty collection làm sentinel cho nhiều state ("[] = not found AND empty") | Phân biệt rõ 2 state bằng null/undefined vs empty |
| `pass` / `...` stub, unreachable code, early-return đánh dấu chưa xong | Xóa hoặc implement đầy đủ |
| Deep nesting > 4 levels | Early return / guard clauses |
| Foreign-idiom tell: integer return codes thay vì exceptions, `.push(` trong Python | Dùng idiom của ngôn ngữ đang viết |

---

## 2. TIER 2 — SUSPICIOUS IN CLUSTERS (3+ cùng lúc = phải review kỹ)

- Comment density đồng đều bất thường (mọi hàm đều được comment "what" 1 cách máy móc)
- Snippet length đồng đều: mọi hàm/đoạn đều ~cùng độ dài (human code VARIES aggressively)
- AST nesting depth + function-length phân bố quá đều (detectable bằng heuristic)
- Import block lạ mà không chạy thử được — verify package tồn tại trong installed env
- Xử lý 1 data nhỏ bằng generator/async-iterator phức tạp
- Class wrap function đơn giản (`__init__/__iter__/__next__` chỉ wrap list) — hỏi "function có đủ không?"
- Row-by-row loop nơi vectorized op tồn tại (pandas/numpy)

---

## 3. BACKEND BEST PRACTICES (NestJS 11 + Prisma 7 — repo stack)

### Validation (bắt buộc theo vị trí repo)
- Global pipe: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`
- DTO là **class** với class-validator decorators (interface không có TS metadata)
- PATCH → `PartialType(CreateDto)`, array body → `ParseArrayPipe({ items: CreateDto })`
- Route params: `@Param('id', ParseIntPipe)` hoặc `Number(id)` trước khi query (Prisma typed inputs)
- class-validator + class-transformer là runtime deps bắt buộc

### Errors & Exceptions
- Chỉ throw built-in HttpException subclasses (BadRequest/NotFound/Conflict...)
- Dùng `HttpStatus` enum, không hardcode số
- Re-throw: `throw new BadRequestException(err.message, { cause: err })` — giữ original
- Đúng 1 global catch-all filter qua `APP_FILTER`, `@Catch()` extends BaseExceptionFilter, resolve HttpAdapterHost trong catch()
- Map lỗi Prisma → HTTP: P2002→409, P2025→404, P2034→retry loop
- Đừng giả định lỗi được log — built-in exceptions là normal flow, log riêng

### Modules & DI
- Encapsulate: chỉ export public API thật; không register cùng service ở 2 module
- @Global() tối thiểu, root-anchored (PrismaModule @Global() OK như repo)
- Dynamic module: naming contract forRoot/forFeature; dùng ConfigurableModuleBuilder thay registerAsync viết tay
- Module class có thể inject provider nhưng không được inject như provider

### Transactions & Data
- Callback-style auto transaction: `prisma.$transaction(async (tx) => ...)`
- Encapsulate transaction creation trong factory narrow (TransactionRunner-style) cho testability
- Keep transactions short; biết isolationLevel/maxWait/timeout defaults (5s/2s)
- Tránh N+1: dùng include/select/omit; atomic number ops (+1/-1)
- NEVER enable synchronize/autoLoadModels trong production — schema qua migration
- **Concurrency:** write paths có thể collide → optimistic locking / version fields / SELECT FOR UPDATE — đừng giả định các transaction không đụng nhau
- **CacheInterceptor** chỉ cho GET read-only, không có @Res(), luôn TTL tường minh; compression chỉ 1 trong app/reverse-proxy, không cả hai

### Observability, API hygiene, infra (critic bổ sung — senior gates)
- Structured logging (Pino/Winston + correlation IDs), request-scoped context propagation; error-tracking (Sentry/Datadog) khi có budget
- API versioning/deprecation policy khi có external consumers (URL prefix, header, sunset headers)
- Migration safety: expand-contract, nullable-before-required, online DDL — migration SQL drop column / NOT NULL không default = review blocker
- /health + /ready endpoints cho orchestrator/load balancer
- Rate limiting trên auth + write endpoints
- Frontend: React Error Boundaries + global error handler + fallback UI — blank screen không có diagnostic = bug
- E2E type safety: Zod schema làm single source of truth cho DTO + frontend types (chống drift)
- Lockfile commit, no-shrinkwrap, npm audit/Dependabot/Socket.dev — supply-chain hygiene là CI gate
- Env validation tại startup (joi/Envalid); secrets không vào code/config; check-token-leak.sh chạy mỗi push
- Performance budgets: bundle size thresholds, API response SLOs — không có gate thì regression vô hình
- Dead code & feature-flag cleanup: xóa flag sau rollout, prune unused deps

### Testing (NestJS)
- Unit-test service trong isolation: `Test.createTestingModule({ providers: [XService] }).compile()`
- Mock PrismaService **by token** (`overrideProvider(PrismaService)`), không by connection
- Global enhancers overridable tại registration site (APP_GUARD/APP_PIPE/APP_INTERCEPTOR)
- e2e: createNestApplication + app.init() trong beforeAll, supertest bound app.getHttpServer(); `.expect(200).expect({...})` chained
- Request-scoped: `await moduleRef.resolve(T)` (unique instance mỗi call)
- Unit specs `.spec.ts` cạnh source; e2e `.e2e-spec.ts` trong test/
- Transaction test hợp lệ: viết regression test FAIL trước khi fix bug (bug-fix protocol)

---

## 4. UI/UX — Anti AI-fingerprint (áp dụng khi thiết kế/review)

### Design tokens & visual
| Pattern | Thay bằng |
|---|---|
| Inter/system-sans mặc định không lý do | Ít nhất 1 typecast quyết định chủ đích (google fonts, có fallback stack) |
| Purple-to-indigo gradient hero, `bg-gradient-to-br from-blue-600 to-purple-500` | Bỏ hoặc dùng gradient có chủ đích + tokens |
| Icon-topped feature grid 3-4 cột đồng nhất | Layout asymmetric, varied count |
| Lucide five (Sparkles, Zap, Shield, Check, BarChart3) + ArrowRight mọi CTA | Chọn icon theo nghĩa thực, không lặp 5 con quen thuộc |
| Badge-above-H1 hero formula | Mở thẳng luận điểm |
| Numbered step markers 01/02/03 (đồ trang trí) | Chỉ khi numbering mang thông tin thật |
| Fake terminal hero + macOS traffic-light dots (product non-dev) | Bỏ |
| Emoji làm feature icons | SVG icon chuẩn project |
| Hyperglossy: saturation đẩy quá default, mọi thứ "shiny polished" | Giữ imperfection, specific detail |

### Design systems discipline
- Một hue giả vờ là hai: primary vs accent delta <20° trong OKLCH = cùng 1 màu → tách job thực
- Hover/focus/press states phải derive từ system, không invent per-component (>5 distinct hover colors = smell)
- Text phải pass WCAG AA (4.5:1) dark mode; không dùng grey #888-#999 cho body text
- Font: shipped font phải match declared font (kiểm tra `--font-sans` đầu tiên)
- Comment claim phải được audit bằng rendered output (screenshot component, check 2 colors được nói)
- Mọi section band đồng nhất visual weight → designate 1 element "oversized moment"
- Motion: respect `prefers-reduced-motion`

### Accessibility = fingerprint gate (không chỉ là bug)
- Heading hierarchy đúng cấp, landmarks semantic, không div soup
- Alt text, form labels, focus states, keyboard nav
- Review rendered HTML, không chỉ screenshot
- Mobile 320-375px test rõ ràng (AI sites chỉ đúng preview width)

---

## 5. REVIEW & PROCESS — cách review code AI-assisted

- **Chesterton's Fence:** trước khi xóa/sửa code đang chạy, viết 1 câu: "cái này làm gì, tại sao nó ở đây". Không có câu trả lời → chưa được xóa. AI giải thích code = hypothesis, KO bao giờ là intent được khôi phục (This Fence Has No Farmer).
- **Comprehension Debt gate:** merge chỉ khi "tôi hiểu cái này và tại sao", không chỉ "tests passed". Review reasoning của AI diff, không phải polish.
- **Defer factoring:** không abstraction ở occurrence 1-2; đến lần 3 hoặc khi đau thật mới extract.
- **Bug-fix protocol:** bug report → viết regression test fail → fix → green.
- **Test mix:** integration tests là sweet spot; e2e suite nhỏ, chạy religiously.
- **Small green refactors:** mỗi bước refactor phải leave build+tests passing.
- **Decompose conditionals:** 1-line điều kiện phức tạp → named intermediate variables ("EASIER DEBUG").
- **Never silently accept mass test updates từ AI refactor:** audit từng thay đổi test.
- **Passing-off test:** code/comments "mostly-or-completely model-generated without disclosure" = passing off — không ship.
- **Không cầu viện detector AI-code làm evidence:** cross-language detection ~chance (43-51%); NL text detectors (GPTZero...) không dùng trong review gate.
- **PR body:** người viết đánh giá riêng (why this matters, what was verified) — không để AI tự khen.
- **Never verbatim-publish LLM output** trong docs/blog/UI copy/commit prose — edit tới khi mang giọng người.

---

## 6. CHECKLIST — TRƯỚC KHI BÁO CÁO / COMMIT

### Code
- [ ] 0 biến `foo/bar/data/temp`; 0 magic number lặp
- [ ] 0 empty catch; 0 `.catch(() => {})`; 0 exception trần
- [ ] 0 mutable default arg; 0 `pass`/stub/unreachable
- [ ] Identifier self-consistency trong mỗi file
- [ ] Commentary varies (not every function commented the same way); function sizes vary
- [ ] 0 hedge comments ("should work hopefully", "probably fine") — verify by running, then delete/fix

### Backend (NestJS/Prisma)
- [ ] DTO class + validation pipe (`whitelist:true, forbidNonWhitelisted:true, transform:true`); ParseIntPipe route params
- [ ] Status codes qua HttpStatus enum; đúng ngữ nghĩa; raw numeric literals = blocker
- [ ] P2002→409 / P2025→404 mapping qua 1 global catch-all filter
- [ ] Transaction callback-style; short; encapsulation factory
- [ ] Concurrency control khi có write path có thể collide (version field / optimistic locking)
- [ ] CacheInterceptor chỉ GET read-only với explicit TTL; compression 1 chỗ
- [ ] Mock PrismaService by token; unit specs cạnh source; app.close() trong afterAll
- [ ] Structured logging (Pino/Winston + correlation IDs) khi có feature mới
- [ ] Migration safety: nullable-before-required, expand-contract, không drop column online
- [ ] /health, /ready endpoints; rate limit auth + write endpoints
- [ ] Lockfile committed; env validated at startup; no secrets in code
- [ ] Import block verified against installed packages (audit dépense ~1/5 hallucinated)

### Frontend
- [ ] UI: 0 purple-gradient verbatim; font chủ đích; icon theo nghĩa thực
- [ ] Primary vs accent không trùng hue (OKLCH delta ≥20°); state derive từ system token
- [ ] WCAG AA dark mode (≥4.5:1); reduced-motion respected
- [ ] Heading hierarchy + landmarks đúng; alt/label đủ; keyboard navigable
- [ ] Mobile 320-375px test on rendered HTML, không chỉ screenshot
- [ ] React Error Boundary; global error handler; fallback UI
- [ ] Performance budgets: bundle size, Lighthouse thresholds

### Review & Process
- [ ] Chesterton's Fence trước khi xóa code; regression test trước fix
- [ ] PR body do người viết (1-3 câu: what + why + implicit decisions); disclosure AI-assisted
- [ ] Mass test updates từ AI refactor được audit từng thay đổi
- [ ] No hedge/slop: identifiable imports verified; identifier consistency enforced

---

## 7. NGUỒN (verify qua research workflow wf_7ce25f8c-713, 2026-09-15)

Google eng-practices (code review canon); Conventional Commits v1.0.0; Chris Beams commit rules; Fowler CodeAsDocumentation + Refactoring Catalog; Jeff Atwood comments-why; Uncle Bob Three Laws of TDD; Dan Abramov Goodbye Clean Code; Sandi Metz Wrong Abstraction; Carson Gross Grug Brained Developer; Adam Greenough This Fence Has No Farmer; Ben Congdon AI Slop; Neil Alexander OSS slop PRs; febbhav Signs of AI Design; adriankrebs.ch 1,590 Show HN pages slop study; TailThemes 5 quality gates; SiteBlob 131 sites structural residue; Fast Company gen-AI aesthetic (2023) + design convergence (2020); sloppylint taxonomy; Suh et al. ICSE 2025 empirical AI-code detection; Multilingual Code Stylometry (arXiv:2412.14611); LLM-AuthorBench stylometry (arXiv:2506.17323); HN 541-point LLM code tells; Addy Osmani Comprehension Debt; NestJS 11 official docs (modules/exception-filters/validation/testing/sql/recipes); Prisma 7 official (upgrade/best-practices/transactions/errors); Prisma blog NestJS error handling.

**Critic (completeness review 2026-09-15):** Fold các gates missing vào §3: concurrency control, observability/correlation IDs, API versioning/deprecation, migration safety (expand-contract), health/ready, rate limiting, React Error Boundaries, Zod e2e type safety, lockfile/supply-chain, env validation, performance budgets, dead-code/flag cleanup. **Dedup:** hedging comments, identifier self-consistency, bug-fix protocol, merge-comprehension gate, mass-test-update audit, AI-explanation-as-hypothesis, empty-sentinel each xuất hiện 2-3 lần giữa các themes — consolidate tại §5, cross-reference thay vì duplicate.

---
**Version:** 1.0.1 (2026-09-15) | **Maintainer:** dev (kronosss2002) | Calibrate 2 tuần trên repo trước khi bật gate. Wordlist/checklist chung có thể tách JSON khi hook hóa (kiểu slop-wordlist.json).
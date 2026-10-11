---
name: qa-full
description: Chạy full QA workflow A-Z: data seeding → functional → visual regression → API contract → performance → whitebox/cross-branch → report. Tự động hóa toàn bộ quy trình QA cho project Playwright+SvelteKit.
---

# 🚀 QA FULL WORKFLOW — Test Từ A-Z

> Chạy toàn bộ pipeline QA tự động, theo thứ tự các phase.
> Portable: chạy được ở bất kỳ project Playwright+SvelteKit nào.

## Quy trình tổng quan

```
PHASE 0: Pre-flight          → check env, auth, config
PHASE 1: Data Seeding        → tạo data qua factory/API
PHASE 2: Functional Tests    → chạy Playwright test suite
PHASE 3: Visual Regression   → so sánh screenshot với baseline
PHASE 4: API Contract        → validate response theo OpenAPI spec
PHASE 5: Performance         → đo LCP/CLS/FID/TTFB
PHASE 6: Whitebox            → audit source giữa các branch
PHASE 7: Report              → tổng hợp kết quả + export
```

---

## PHASE 0: Pre-flight

Kiểm tra môi trường trước khi chạy:

```bash
# 1. Check auth state tồn tại
test -f automation_test/user.json && echo "✅ Auth OK" || echo "❌ Thiếu auth — chạy save-auth.js"

# 2. Check env config
node -e "require('./automation_test/config/config-loader')"

# 3. Check dependencies
npm ls @playwright/test @faker-js/faker
```

> Nếu thiếu auth → chạy: `node automation_test/save-auth.js` (login + lưu storageState)

---

## PHASE 1: Data Seeding

Tạo test data trước khi chạy test (nếu test dùng data tĩnh):

```js
// Tham khảo: automation_test/utils/data-factories.js
const { resourceFactory } = require('./automation_test/utils/data-factories');
const data = resourceFactory.batch(5);
```

- Nếu test **tự seed data** trong `beforeEach` → skip phase này
- Nếu cần data tĩnh → dùng `global-setup` seed qua API

---

## PHASE 2: Functional Tests

Chạy toàn bộ Playwright test suite:

```bash
cd automation_test && npx playwright test
```

Options:
```bash
# Chạy 1 module
npx playwright test tests/resources/

# Chạy có trace khi fail
npx playwright test --trace=on-first-retry

# Headed mode debug
npx playwright test --headed
```

---

## PHASE 3: Visual Regression

So sánh UI với baseline. Baseline lưu trong `automation_test/snapshots/`:

```bash
# Tạo/update baseline
cd automation_test && npx playwright test --update-snapshots

# Chạy visual regression tests
npx playwright test --grep "@visual"
```

> **Rule:** Dùng `visual-regression.js` helper — tự mask dynamic data (timestamp, counter).

---

## PHASE 4: API Contract

Validate response theo OpenAPI spec. Spec từ `api/openapi.json`:

```bash
# Chạy contract tests (skip-safe nếu chưa có spec)
cd automation_test && npx playwright test --grep "@contract"

# Detect breaking changes giữa 2 branch
npx oasdiff -breaking api/openapi.json <branch-spec>
```

---

## PHASE 5: Performance

Đo Core Web Vitals trên các trang chính:

```bash
# Chạy performance tests
cd automation_test && npx playwright test --grep "@performance"
```

Output: `automation_test/test-results/performance-report.json`

---

## PHASE 6: Whitebox / Cross-Branch

Kiểm tra source code giữa các branch (không checkout — dùng git show/diff):

```bash
# Audit API routes thay đổi giữa main và nhánh hiện tại
node -e "
  const { diffBranchStats } = require('./automation_test/utils/branch-audit');
  diffBranchStats('main', 'HEAD').then(r => console.log(JSON.stringify(r, null, 2)));
"
```

> **Rule:** Chỉ dùng `git show`/`git diff` (read-only) — TUYỆT ĐỐI không checkout/pull.

---

## PHASE 7: Report

Tổng hợp kết quả và xuất báo cáo:

```bash
# Playwright HTML report
cd automation_test && npx playwright show-report

# JUnit XML (để import Xray)
npx playwright test --reporter=junit
```

---

## One-Liner Toàn Bộ

Chạy tất cả bằng 1 lệnh:

```bash
cd automation_test && \
  npx playwright test && \
  npx playwright test --grep "@visual" && \
  npx playwright test --grep "@contract" && \
  npx playwright test --grep "@performance"
```

---

## 📋 Checklist QA

- [ ] Pre-flight: auth OK, config OK
- [ ] Data seeding: test data sẵn sàng
- [ ] Functional: toàn bộ test PASS
- [ ] Visual: không có diff ngoài baseline
- [ ] API contract: response đúng spec
- [ ] Performance: LCP < 2.5s, CLS < 0.1
- [ ] Whitebox: không breaking change giữa branches
- [ ] Report: HTML + JUnit sẵn sàng
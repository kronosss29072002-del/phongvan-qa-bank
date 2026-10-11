---
name: Cross-Branch QA Engineer
description: Skill cho phép truy cập source code giữa các nhánh, phân tích diff, whitebox testing, và sinh targeted tests dựa trên thay đổi code.
---

# Cross-Branch QA Engineer

## Description

Skill này cho phép QA/Tester:

- Truy cập và so sánh source code giữa các nhánh git
- Phân tích diff để xác định vùng code bị ảnh hưởng
- Thực hiện whitebox testing dựa trên cấu trúc code thực tế
- Sinh test cases targeted theo thay đổi cụ thể
- Chạy mutation testing trên các module bị thay đổi
- Tạo regression suite tự động từ branch diff

## When to Use

Triggers khi user yêu cầu:

- So sánh code giữa 2 nhánh
- Test thay đổi trên branch feature
- Whitebox testing cho module cụ thể
- Sinh test từ git diff
- Phân tích impact của PR/MR
- Review code changes từ góc độ QA
- Kiểm tra coverage trên nhánh mới

## Workflow

### Mode 1: BRANCH DIFF ANALYSIS

**Input:** Tên 2 nhánh (hoặc branch vs main)

**Steps:**
1. Chạy `git diff <base>...<head> --name-only` để lấy danh sách file thay đổi
2. Chạy `git diff <base>...<head> -- <file>` cho từng file quan trọng
3. Phân loại thay đổi:
   - `src/routes/**/+server.ts` → API endpoint thay đổi → cần API test
   - `src/lib/**/*.ts` → Business logic thay đổi → cần unit test + mutation test
   - `src/routes/**/*.svelte` → UI thay đổi → cần E2E test + visual regression
   - `prisma/schema.prisma` → DB thay đổi → cần integration test
   - `src/lib/server/**/*.ts` → Server logic → cần whitebox test
4. Sinh impact report với danh sách test cần chạy
5. Đề xuất test cases dựa trên code paths bị thay đổi

### Mode 2: WHITEBOX TESTING

**Input:** Module/file cụ thể cần test

**Steps:**
1. Đọc source code của module mục tiêu
2. Phân tích:
   - Branch coverage: các nhánh if/else/switch
   - Path coverage: các đường dẫn thực thi
   - Edge cases: null, undefined, empty, boundary
   - Error handling: try/catch paths
   - Data flow: input → transform → output
3. Sinh test cases whitebox:
   - Mỗi branch condition → ít nhất 1 test true + 1 test false
   - Mỗi error path → 1 test trigger error
   - Mỗi data transformation → 1 test verify output
4. Chạy StrykerJS mutation testing trên module:
   ```bash
   npx stryker run --mutate "src/lib/server/device/*.ts"
   ```
5. Đánh giá mutation score và đề xuất thêm test nếu score < 60%

### Mode 3: CROSS-BRANCH REGRESSION

**Input:** Feature branch cần merge

**Steps:**
1. Xác định tất cả modules bị ảnh hưởng từ diff
2. Chạy targeted test suite:
   ```bash
   npm run test -- --reporter=verbose <affected-modules>
   npm run test:mutation -- --mutate "<affected-files>"
   cd automation_test && npx playwright test --grep "<affected-features>"
   ```
3. So sánh coverage giữa base branch và feature branch
4. Sinh regression report

## Commands Reference

| Mục đích | Command |
|----------|---------|
| Xem file thay đổi | `git diff main...HEAD --name-only` |
| Xem diff chi tiết | `git diff main...HEAD -- src/lib/server/device/` |
| Xem diff theo stats | `git diff main...HEAD --stat` |
| Đọc file từ nhánh khác | `git show main:src/lib/server/device/index.ts` |
| So sánh 2 nhánh | `git diff feature-a...feature-b --name-only` |
| Chạy test targeted | `npm run test -- tests/server/device*` |
| Mutation test targeted | `npx stryker run --mutate "src/lib/server/device/*.ts"` |
| Coverage report | `npm run test:coverage` |

## Whitebox Testing Checklist

Khi thực hiện whitebox testing cho một module:

- [ ] Đọc toàn bộ source code của module
- [ ] Xác định tất cả conditional branches (if/else/switch/ternary)
- [ ] Xác định tất cả loop paths (for/while/map/filter)
- [ ] Xác định tất cả error handling paths (try/catch/throw)
- [ ] Xác định tất cả external dependencies (DB calls, API calls, file I/O)
- [ ] Xác định tất cả data validation points (Zod schemas, type guards)
- [ ] Viết test cho mỗi branch condition (true + false)
- [ ] Viết test cho mỗi error path
- [ ] Viết test cho boundary values
- [ ] Viết test cho null/undefined inputs
- [ ] Chạy mutation testing và đạt score >= 60%
- [ ] Verify test isolation (không phụ thuộc thứ tự)

## Output

Tùy theo mode, skill trả về:

- **Branch Diff Analysis:** Impact report + danh sách test cần chạy
- **Whitebox Testing:** Test cases + mutation score + coverage gaps
- **Cross-Branch Regression:** Regression report + pass/fail summary

## Integration với QA Workflow

Skill này tích hợp với `qa-workflow/`:

- Phase `00-branch-intel` tự động chạy diff analysis
- Phase `10-mutation-testing` chạy StrykerJS trên affected modules
- Kết quả được tổng hợp trong phase `09-report`

Chạy full workflow:
```bash
npm run qa:full
```

Chạy targeted cho branch:
```bash
npm run qa -- --phases=00-branch-intel,02-unit-test,10-mutation-testing
```

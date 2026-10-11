---
description: Điều phối toàn bộ flow QA/QC 6 phase (Strategy → Plan/Design → Execution → Bug Lifecycle → Metrics → Release Gate) — hybrid manual + Playwright, project-agnostic. Dùng `--one-shot` để chạy hết không dừng.
skills:
  - qa_flow_orchestrator
---

> **BẮT BUỘC (MANDATORY SKILL):** Nạp và đọc kỹ `.claude/skills/qa_flow_orchestrator/SKILL.md` trước khi thực hiện. Full walkthrough: `QA Flow Blueprint` tại `qa-flow-blueprint.md` (6 phase, metrics verified).

# Workflow: /qa-flow — QA/QC End-to-End Orchestrator

## Input

```
/qa-flow [PROJECT_PATH] [--one-shot] [PHASE_START..PHASE_END]
```

- `PROJECT_PATH`: đường dẫn dự án cần test. Mặc định = thư mục hiện tại (project-agnostic).
- `--one-shot`: chạy hết 6 phase không dừng checkpoint (chỉ khi user yêu cầu rõ).
- `PHASE_START..PHASE_END`: ví dụ `1..3` để chạy riêng thiết kế → execution. Mặc định `0..5`.

## Modes

| Mode | Hành vi |
|---|---|
| **FLEX** (mặc định) | Sau mỗi phase dừng lại, trình bày artifact + checkpoint, chờ user xác nhận |
| **ONE-SHOT** | Chạy liền mạch 0→5 (chỉ dùng khi user chủ động yêu cầu; vẫn báo cáo từng phase) |

## Các phase

### Phase 0 — Chiến lược
- Tạo `00_test-strategy.md` (1 trang): phạm vi, rủi ro, level test (unit/service/UI theo **Test Pyramid**), danh mục **Agile Testing Quadrants** (Q1–Q4, KHÔNG theo trình tự), quyết định module nào test thủ công vs automation.
- Tham khảo blueprint §2 (verified: pyramid không có tỷ lệ số chính thức; quadrant là taxonomy).

### Phase 1 — Plan & Design
- Chọn generator theo input (bảng "Quyết định chọn generator" trong skill):
  - Requirement doc → `analyze_requirement_document` → `generate_manual_testcases_rbt`
  - Website → `generate_requirements_from_website` → `generate_application_test_plan`
  - Swagger → `generate_api_tests_from_swagger`
- Output: `01_test-plan.md` + `02_test-cases.md`. Áp dụng kỹ thuật ISTQB (EP, BVA 3-value, Decision Table, State Transition) — lưu ý: không dùng thuật ngữ `on-point/off-point` (không có trong ISTQB glossary); pairwise không thuộc CTFL.

### Phase 2 — Execution
- **Manual scripted:** chạy test cases trong `02_test-cases.md`, ghi kết quả từng TC vào `03_sessions/` hoặc TMS nếu có.
- **Exploratory/SBTM:** mở charter + session theo skill `sbtm_exploratory`. Session 90 phút, debrief CHARTED/UNCHARTED.
- **Automation:** nếu project có Playwright suite: chạy regression (tham khảo `qa-full` nếu phù hợp); nếu chưa có: `generate_automation_from_testcases` cho các TC có rủi ro cao. Nhắc đọc `.claude/rules/playwright_rules.md` + `locator_strategy.md`.
- **Bug phát hiện trong execution:** MỞ ngay `/report-bug` (không chờ hết phase).

### Phase 3 — Bug Lifecycle
- Mọi bug đi qua `/report-bug` (chuẩn good-bug-report: repro steps, error nguyên văn, version, env).
- Triage: QA Lead + 1 dev + 1 PM, 2–3 lần/tuần. Severity (Critical/Major/Minor/Trivial) ≠ Priority (P0–P4). Status flow: `NEW → TRIAGED → IN PROGRESS → FIXED → VERIFIED → CLOSED` (kèm REJECTED/DUPLICATE/WON'T FIX).
- Lưu bug vào `04_bugs/`.

### Phase 4 — Metrics
- Tính metrics — nhập counts (testing defects, production defects, escaped, flaky) → tính DRE, defect density, escaped rate, flaky ratio, DORA lite (change fail rate).
- Lưu `05_metrics.md` + xuất bảng dashboard.

### Phase 5 — Release Gate
- Tổng hợp: test runs pass/fail, bugs còn mở theo priority, DRE (mục tiêu ≥90%), escaped trend, flaky ratio.
- Kết luận: **GO / NO-GO** (kèm điều kiện). Lưu `06_release-gate.md`.

## Quy ước output

- Artifact dưới: `<PROJECT_PATH>/qa_artifacts/<run_id>/` · `run_id = yyyymmdd-<module-slug>`
- Tên file cố định (khớp skill): `00_test-strategy.md`, `01_test-plan.md`, `02_test-cases.md`, `03_sessions/`, `04_bugs/`, `05_metrics.md`, `06_release-gate.md`
- Mọi output bằng **Tiếng Việt**.

## Ràng buộc

- Không dùng Bash để đọc `.git/` diff hoặc path `node_modules/dist/build` (hook scout-block).
- Không sửa settings/hooks. Nếu cần thêm quyền, hỏi user.
- `fetch_jira_requirements`/`import_test_results_xray` chỉ dùng khi Jira integration payload đã được setup (đang thiếu — xem ghi chú stale trong skill).

## Checklist trước khi kết thúc phiên

- [ ] Mọi artifact có trong `qa_artifacts/<run_id>/` với tên chuẩn
- [ ] Bug nào phát hiện đã có bug report (04_bugs/)
- [ ] Metrics đã tính + giải thích ngưỡng (DRE <50 red flag, 50–80 moderate, ~100 tốt)
- [ ] Release gate có kết luận rõ GO/NO-GO
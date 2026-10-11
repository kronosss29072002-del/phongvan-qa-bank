---
name: QA Flow Orchestrator
description: Skill điều phối toàn bộ flow QA/QC 6 phase (Strategy → Plan/Design → Execution → Bug Lifecycle → Metrics → Release Gate) cho team 3-10 người, sản phẩm Web + Mobile, hybrid manual + automation. Là lớp orchestration tổ hợp các command/skill QA hiện có thành một chuỗi hoàn chỉnh.
---

# QA Flow Orchestrator

## Description

Skill này là **lớp điều phối (orchestration)** cho toàn bộ vòng đời QA/QC — nối các công cụ tác giả đã có (requirement analysis, test plan, RBT test cases, automation, flaky fixing, Jira/Xray) với các công cụ vận hành mới (SBTM/exploratory, bug reporting, metrics) thành **một flow chạy được A-Z**.

Là companion skill của command `/qa-flow` (`.claude/commands/qa-flow.md`).

## When to Use

- Bắt đầu một chu kỳ QA/QC cho 1 feature/release/module.
- Cần lên kế hoạch test, sinh test cases, chạy manual/exploratory, báo bug, đo metrics theo một chuẩn thống nhất.
- Team muốn biết "đang ở đâu" trong flow và "làm gì tiếp theo".

## Flow 6 Phase (khớp blueprint `qa-flow-blueprint.md`)

| Phase | Tên | Command hiện có | Artifact output |
|---|---|---|---|
| **0** | Chiến lược & Frameworks | *(doc tham khảo: blueprint §2 — Quadrants, Test Pyramid)* | Test Strategy 1 trang |
| **1** | Test Planning & Test Design | `analyze_requirement_document` (hoặc `generate_requirements_from_website`/`fetch_jira_requirements`), `generate_application_test_plan`, `generate_testcases_from_requirements` (QUICK) / `generate_manual_testcases_rbt` (FULL) | Test Plan, Test Cases, Risk Register |
| **2** | Test Execution — Manual + Exploratory | chạy test cases thủ công; **SBTM/exploratory: skill `sbtm_exploratory`** (charter + session report); automation khi có scripts | Test Run Results, Session Reports, Bug Reports |
| **3** | Bug Lifecycle | **`/report-bug`** (tạo bug report chuẩn), triage theo severity/priority | Bug Reports, triage minutes |
| **4** | Metrics & Reporting | tính metrics trực tiếp (DRE, defect density, escaped, flaky, DORA lite) | Dashboard markdown |
| **5** | Release Gate | tổng hợp exit criteria từ metrics + test runs | Exit criteria report |

> Ghi chú: `qa-full` (của hệ thống cũ) là execution pipeline cho automation đã build sẵn (grep tags) — orchestrator này **bao quát** nó ở Phase 2 nếu project có Playwright suite chạy được, nhưng không bắt buộc.

## Nguyên tắc vận hành

1. **Human-in-the-loop mặc định (FLEX mode):** sau mỗi phase, dừng lại trình bày artifact + checkpoint cho user: xác nhận / sửa / bỏ. `--one-shot` chạy hết không dừng (chỉ khi user yêu cầu).
2. **Project-agnostic:** nhận `PROJECT_PATH` làm input; mặc định = thư mục hiện tại. Không hardcode bất kỳ path project nào.
3. **Artifacts traceable:** lưu vào `<PROJECT_PATH>/qa_artifacts/<run_id>/` với `run_id = yyyymmdd-<module-slug>` — khớp tinh thần "data traceable" của rules. Tên file theo quy ước:
   - `00_test-strategy.md` · `01_test-plan.md` · `02_test-cases.md` · `03_sessions/` (session reports) · `04_bugs/` (bug reports) · `05_metrics.md`
4. **Tôn trọng rules:** khi vào phase automation, nhắc user đọc `.claude/rules/playwright_rules.md` + `locator_strategy.md` (bắt buộc trong hệ thống).
5. **Ràng buộc kỹ thuật:** không dùng Bash để đọc `.git/` diff hoặc path chứa `node_modules/dist/build` (hook scout-block chặn) — dùng Read/Glob khi cần.

## Quyết định chọn generator theo input (Phase 1)

| Input user có | Command dùng |
|---|---|
| Requirement doc / user stories | `analyze_requirement_document` → `generate_manual_testcases_rbt` |
| Trang web / UI hiện có | `generate_requirements_from_website` → `generate_application_test_plan` |
| Ticket Jira | `fetch_jira_requirements` (cần `jira_integration` skill scripts đã setup: `SKILL.md` → `scripts/integrations/jira/*.js`) |
| Swagger / OpenAPI | `generate_api_tests_from_swagger` |
| Test cases sẵn có | `generate_automation_from_testcases` (phase 2) |

## Checkpoint mẫu (cuối mỗi phase)

```
✅ Phase <n> hoàn thành — artifacts tại qa_artifacts/<run_id>/
   ● <danh sách file>
   ● Điểm cần bạn xác nhận: <1-3 câu hỏi>
   ● Tiếp theo: <phase sau> / Điều chỉnh / Dừng
```

## Stale indexes (fix sau — đừng dùng)

- `cross_branch_qa` tham chiếu `qa-workflow/` + `npm run qa:full` — không tồn tại.
- `qa-full.md` thiếu frontmatter `skills:` và phụ thuộc grep tags của project cụ thể.
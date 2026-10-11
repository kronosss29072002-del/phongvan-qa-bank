---
name: report-bug
description: Tạo bug report chuẩn "good bug report" (repro steps, error nguyên văn, version/env, evidence). Dùng khi phát hiện bug trong manual testing, exploratory testing, automation fail, hoặc bất kỳ lúc nào cần log defect.
skills:
  - bug_report
---

# /report-bug — Tạo Bug Report

> **BẮT BUỘC (MANDATORY SKILL):** Nạp và đọc kỹ `.claude/skills/bug_report/SKILL.md` trước khi bắt đầu. Template tại `.claude/skills/bug_report/references/bug-report-template.md`.

## Khi nào dùng

- Phát hiện bug khi chạy manual hoặc exploratory testing
- Automation test fail nhiều lần (không phải flaky)
- User hoặc PM báo cáo lỗi
- Trước khi mở ticket Jira/GitHub Issues

## Workflow

### 1. Thu thập thông tin

Hỏi user (hoặc lấy từ context hiện tại):

| Thông tin | Bắt buộc | Ghi chú |
|---|---|---|
| Mô tả lỗi | Có | Mô tả cái thấy sai, không phải nguyên nhân đoán |
| Steps to reproduce | Có | Từ trạng thái sạch, từng bước rõ ràng |
| Error message nguyên văn | Có | Copy đúng chữ/số, không paraphrase |
| Version / build | Có | App version + environment |
| OS / browser / device | Có | Machine-specific hay reproducible trên nhiều env? |
| Evidence | Có | Screenshot, console log, HAR, screen recording |
| Severity | Đề xuất | Tester quyết định: Critical / Major / Minor / Trivial |

### 2. Tạo bug report

- Dùng template `references/bug-report-template.md` làm scaffold.
- Kiểm tra đủ **4 trụ cột** (repro steps, error message, version/env, evidence). Nếu thiếu bất kỳ trụ cột nào, hỏi lại user, KHÔNG tạo bug mù.

### 3. Severity vs Priority

| | Quy ước | Ai quyết định |
|---|---|---|
| **Severity** (tác động) | Critical / Major / Minor / Trivial | Tester khi log bug |
| **Priority** (khẩn cấp) | P0 / P1 / P2 / P3 / P4 | Triage (QA Lead + 1 dev + 1 PM) |

**SLA triage đề xuất (theo SKILL.md):**
- P0: phản hồi 1h, fix trong 1 ngày
- P1: cùng sprint
- P2: quy hoạch
- P3/P4: backlog

### 4. Lưu artifact

Lưu vào `<PROJECT_PATH>/qa_artifacts/<run_id>/04_bugs/BUG-<seq>-<slug>.md`.
Đồng thời link defect ID vào test case nếu đang chạy automation (traceability).

### 5. Bug lifecycle

Status flow: `NEW -> TRIAGED -> IN PROGRESS -> FIXED -> VERIFIED -> CLOSED`

Trạng thái phụ: DUPLICATE, NOT A BUG, REJECTED, WON'T FIX.

Quy tắc: dev KHÔNG tự đóng bug mình. QA verify trên môi trường đúng rồi mới CLOSED.

## Kết nối với QA Flow

- Phát hiện bug trong Phase 2 (Execution) → mở `/report-bug` ngay, không chờ hết phase.
- Phase 3 (Bug Lifecycle) trong `/qa-flow` gọi `/report-bug` làm tool chính.
- Xem full pipeline: `/qa-flow`.

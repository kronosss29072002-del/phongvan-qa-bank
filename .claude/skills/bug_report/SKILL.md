---
name: Bug Report
description: Skill tạo bug report chuẩn "good bug report" — mục đích để developer tái hiện được lỗi ngay trước mặt họ. Chuẩn hóa severity (tác động) ≠ priority (khẩn cấp, P0-P4), repro steps, error message nguyên văn, version/OS/môi trường, evidence. Kèm hướng dẫn triage + bug lifecycle.
---

# Bug Report

## Description

Tạo **bug report chuẩn** theo tiêu chuẩn "How to Report Bugs Effectively" (Simon Tatham — essay kinh điển, verified 3-0, được Mozilla/Atlassian/GitLab trích dẫn):

> *"The aim of a bug report is to enable the programmer to see the program failing in front of them."*

**Mục đích tối thượng:** developer phải **tái hiện được** lỗi, không cần hỏi lại. Mọi field trong report phục vụ mục tiêu đó.

## When to Use

- Phát hiện bug khi chạy manual/exploratory (Phase 2–3 của `/qa-flow`), khi verify, khi automation fail nhiều lần.
- Bất kỳ ai (QA, dev, PM, user) log bug — skill chuẩn hoá đầu vào.
- Trước khi mở bug Jira/GitHub Issues: dùng skill này để soạn nội dung, sau đó người dùng tự tạo ticket (không tự gọi API bug tracker).

## 4 trụ cột của "good bug report" (verified)

| Trụ cột | Yêu cầu |
|---|---|
| **1. Repro steps** | Hướng dẫn từng bước, từ trạng thái sạch, đủ chi tiết để dev lặp lại trước mặt họ |
| **2. Error message nguyên văn** | Con số/chữ trong lỗi là *"dấu vân tay tại hiện trường vụ án"* — GHI Y NGUYÊN, không paraphrase, không cắt |
| **3. Version + Môi trường** | Version program + OS + browser/device + resolution (ví dụ lỗi chỉ xảy ra 800×600 ≠ 1024×768) → phân biệt machine-specific với intermittent thật |
| **4. Evidence** | Screenshot, screen recording, HAR, console log, network trace |

## Severity vs Priority (KHÔNG gộp — verified ISTQB)

| Khái niệm | Định nghĩa ISTQB | Quy ước dùng |
|---|---|---|
| **Severity** (tác động) | *"Mức độ ảnh hưởng của defect lên development/testing/operation"* | `Critical / Major / Minor / Trivial` |
| **Priority** (khẩn cấp) | *"Mức độ quan trọng gán cho task theo tiêu chí"* | `P0 / P1 / P2 / P3 / P4` (chuẩn Google, P2 = mặc định) |

> ⚠️ Không có thang chuẩn ISTQB — đây là quy ước vendor (Google/Atlassian). Simplify cho team nhỏ: severity = QA quyết định khi log · priority = TRIAGE quyết định (QA Lead + 1 dev + 1 PM, 2–3 lần/tuần).

**SLA triage đề xuất:** P0: phản hồi 1h / fix trong 1 ngày · P1: cùng sprint · P2: quy hoạch · P3/P4: backlog.

## Bug Lifecycle (status flow chuẩn)

```
NEW → TRIAGED → IN PROGRESS → FIXED → VERIFIED → CLOSED
  │       │          │           │
  ▼       ▼          ▼           ▼
DUPLICATE  NOT A BUG   WON'T FIX   REOPENED
           REJECTED

Won't fix có 4 lý do chuẩn (Google): Infeasible · Not reproducible · Obsolete · Intended behavior
```

**Quy tắc: dev không tự đóng bug mình** — QA verify trên môi trường đúng rồi mới CLOSED.

## Quy trình tạo bug report

1. **Walk qua template** (`references/bug-report-template.md`) với tester — hỏi từng field.
2. **Kiểm tra đủ 4 trụ cột** — nếu thiếu error message/version/env, về hỏi lại, KHÔNG tạo bug mù.
3. **Severity đề xuất** (tester) + **Priority đề xuất** (để triage quyết định sau).
4. **Xuất report** ra màn hình; nếu user muốn, lưu vào `qa_artifacts/<run_id>/04_bugs/BUG-<seq>-<slug>.md`.
5. Link defect ID vào test case (traceability — theo rules automation).

## Viết tiêu đề bug

- **Ngắn, hành vi mong đợi bị sai:** "Checkout lỗi khi chọn COD trên mobile" — KHÔNG "Bug trang thanh toán".
- Mô tả cái người dùng nhìn thấy sai, không phải nguyên nhân đoán mò.

## Liên kết

- Command: `/report-bug` (`.claude/commands/report-bug.md`)
- Triage + SLA: mục "Severity vs Priority" trong skill này (quy ước severity/priority + SLA triage self-contained)
- Orchestration: `/qa-flow` Phase 3
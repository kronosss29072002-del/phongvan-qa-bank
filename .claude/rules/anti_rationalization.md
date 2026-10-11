# 🛡️ Anti-Rationalization Tables — Bảng chống bào chữa

> **Áp dụng cho:** mọi agent và subagent khi đối mặt với quyết định bỏ qua verification, defer quality, hoặc skip step.
> **Nguồn cảm hứng:** addyosmani/agent-skills (95.9k★) — anti-rationalization pattern.
> **Cách dùng:** Khi nhận ra mình đang nghĩ một trong các "lý do" bên trái, dừng lại, đọc cột phải, và làm đúng.

---

## Bảng chung (mọi agent)

| Lý do thường gặp | Phản biện |
|---|---|
| "Chỗ này nhỏ, không cần validation/DTO" | Mọi input đều cần validation. "Nhỏ" hôm nay = "exploit" ngày mai. |
| "Test này flaky do môi trường, bỏ qua" | Flaky = defect. Fix root cause, không disable. |
| "CI sẽ bắt nếu sai" | CI là backstop, không phải thay thế verification local. Chạy test trước khi push. |
| "Refactor sau, giờ deadline" | Technical debt không tự giảm. Nếu không refactor bây giờ, ghi issue cụ thể với owner + deadline. |
| "Agent khác sẽ xử lý phần đó" | Mỗi agent chịu trách nhiệm phần mình được giao. "Không phải việc tôi" = bug. |
| "Tạm thời disable hook/guard" | `scout-block` chặn thật (PreToolUse, exit 2) và `check_budget` là Stop hook — không disable. Nếu hook báo sai, fix hook. |
| "Đã có integration test, không cần unit" | Unit test cho coverage nhanh + isolation. Integration test không thay thế. |
| "Viết docs sau" | Docs đi kèm code. Defer docs = defer understanding. |
| "Không chắc, nhưng chắc là đúng" | Không chắc = verify. Check bằng tool, không đoán. |
| "Người dùng không cần tính năng này" | Người dùng yêu cầu = cần. Nếu nghi ngờ requirement, hỏi lại, không tự quyết định bỏ. |

---

## Bảng riêng theo domain

### QA / Testing (playwright-qa-automation, tester, ui-testing-coverage)

| Lý do | Phản biện |
|---|---|
| "Test này chạy chậm, skip" | Slow test = cần optimize, không phải skip. Parallelize hoặc cache. |
| "Locator này dynamic, không tìm được" | Dùng data-testid, aria-label, hoặc role. Không fallback XPath random. |
| "Flaky do network, retry là đủ" | Retry che giấu bug. Fix race condition hoặc wait đúng. |
| "Coverage 80% là đủ" | Coverage là metric, không phải mục tiêu. Critical path cần 100%. |

### Backend / API (nestjs-api-architect, rest-api-designer, prisma-db-specialist)

| Lý do | Phản biện |
|---|---|
| "Endpoint này internal, không cần auth" | Internal ≠ trusted. Auth + validation mọi endpoint. |
| "Migration này nhỏ, không cần review" | Migration = schema change = risk. Mọi migration cần review. |
| "Query này nhanh, không cần index" | "Nhanh" bây giờ = "chậm" khi data x10. Add index nếu có filter/sort. |
| "Error message này đủ rõ" | Error message cần actionable: gì sai, ở đâu, sửa thế nào. |

### Content / Docs (ai-content-eng, seo-content-analyst, copywriter)

| Lý do | Phản biện |
|---|---|
| "Đoạn này AI-slop nhưng ý đúng" | Slop = không đọc lại. Rewrite cho rõ, không chấp nhận. |
| "SEO keyword này hơi forced" | Forced keyword = giảm readability. Rewrite natural. |
| "Metadata này không quan trọng" | Metadata = discoverability. Điền đầy đủ, chính xác. |

---

## Quy tắc áp dụng

1. **Khi nhận ra mình đang bào chữa** → dừng, đọc bảng, làm đúng.
2. **Nếu tình huống không trong bảng** → hỏi: "Nếu người khác đọc commit này, họ sẽ hỏi gì?" Trả lời trước khi commit.
3. **Nếu thực sự cần defer** → ghi issue/TODO với owner + deadline cụ thể, không "sau này".
4. **Nếu hook/guard flag** → fix root cause, không disable hook.

---

**Version:** 1.0.0 (2026-09-18) | **Nguồn:** adopt-now implement pass 3 (anti-rationalization pattern từ addyosmani/agent-skills)

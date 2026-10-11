---
name: SBTM Exploratory Testing
description: Skill vận hành Exploratory Testing theo chuẩn Session-Based Test Management (SBTM) — charter, session 90 phút time-boxed, debrief CHARTED/UNCHARTED, bug bashing, mind maps. Dùng khi cần tìm bug sâu ngoài scripted tests.
---

# SBTM Exploratory Testing

## Description

Exploratory testing = *"test approach trong đó tests được thiết kế VÀ thực thi động, dựa trên knowledge + exploration + previous test results"* (ISTQB Glossary — verified). Skill này đóng gói **Session-Based Test Management (SBTM)** — khung vận hành do James & Jon Bach tạo (HP, 2000) để exploratory testing có **accountability** đo lường được.

Bổ trợ cho Phase 2 của flow `/qa-flow`. Templates tham chiếu: `references/charter-template.md`, `references/session-report-template.md`.

## When to Use

- Cần tìm bug **sâu** mà scripted tests bỏ lọt (logic biên, state phức tạp, race conditions).
- Kiểm tra tính năng mới chưa có test case hoặc requirement mơ hồ.
- Bug bashing định kỳ (ISTQB: *"informal, collaborative cross-functional test session để phát hiện defect"*).
- Trước release: quét rủi ro vùng ít coverage.

> KHÔNG dùng để thay thế scripted regression — đây là lớp **bổ sung** trong hybrid flow.

## Nguyên tắc cốt lõi (lịch sử verified)

- Thuật ngữ do **Cem Kaner** đặt (1980s); hiệp ước Bach–Kaner 2001: ET = *"bất kỳ testing nào trong đó tester chủ động điều khiển thiết kế test khi đang thực hiện, dùng thông tin thu được để thiết kế test mới tốt hơn"* — là chuyện **theo mức độ**, không phải yes/no.
- RST (Rapid Software Testing, Bach): testing = *"quá trình học về sản phẩm qua exploration và experimentation"*; scripting chỉ là một kỹ thuật.
- Khi explore, tester **thiết kế + thực thi + học ĐỒNG THỜI** (interleaved) — không tách bạch.

## Quy trình vận hành

### Bước 1 — Viết CHARTER (1–3 câu, mission statement)

Công thức: `Explore <mục tiêu> để tìm <loại bug sâu>, dùng <kỹ thuật/heuristic>, chú ý <yếu tố rủi ro>`

```
Ví dụ charter:
"Khám phá luồng thanh toán (web) để tìm bug về trạng thái đơn hàng khi
 mạng chậm/ngắt giữa chừng, dùng BVA + state-transition thinking,
 chú ý nút Back/Refresh và double-click."
```

Charter **tốt**: đủ cụ thể để biết đã xong chưa · **không** phải danh sách steps. Xem template: `references/charter-template.md`.

### Bước 2 — Chạy SESSION (time-boxed ~90 phút, 3 khối ~25 phút + break)

| Khối | Nội dung |
|---|---|
| 1 (0–25') | Test design + execution (đồng thời): explore tính năng, ghi chú, screenshot |
| 2 (25–50') | Đào sâu: biến thể, edge cases, kết nối hệ thống, dừng ở các "cạnh" |
| 3 (50–90') | Gom kết quả: ghi bug, notes, xác định vùng còn chưa chạm |

**Heuristic gợi ý khi explore** (error guessing — ISTQB: dựa vào kinh nghiệm failure modes):
- **Input:** chuỗi rỗng / null / siêu dài / ký tự đặc biệt / unicode / SQL-injection-like / XSS payload
- **State:** refresh, back/forward, double-click, tab chuyển giữa chừng, mất mạng giữa request, hết session
- **Data:** nhiều trang, sort thay đổi giữa chừng, xóa trong khi load, trùng dữ liệu
- **Cross:** permission khác nhau, 2 tab cùng lúc, device khác (mobile/desktop)

### Bước 3 — DEBRIEF (bắt buộc, 5–10 phút)

- **CHARTED time:** phần làm việc đúng charter.
- **UNCHARTED time:** phần lạc đề có giá trị (bug tìm được ngoài charter) — báo cáo riêng, KHÔNG bỏ qua, KHÔNG tính vào charted.
- Xuất **Session Report** theo `references/session-report-template.md`.

### Bước 4 — Bug bashing (định kỳ)

- Tổ chức **1 buổi/ sprint** hoặc trước release: toàn team (QA + Dev + PM), thời gian cố định, mỗi người 1 charter ngắn, gom findings.
- Dùng **mind map** tính năng → tô vùng rủi ro → phân charter theo vùng.
- Mọi bug tìm được → `/report-bug` ngay (không để cuối buổi).

## Liên kết

- Bug report: `.claude/skills/bug_report/SKILL.md` + command `/report-bug`
- Orchestration: `.claude/skills/qa_flow_orchestrator/SKILL.md` + command `/qa-flow`
- Inspect UI live khi cần: skill `ui_debug_agent` (yêu cầu Playwright MCP — tuân thủ trình tự navigate → resize 1920×1080 → wait → snapshot).
- Chuẩn tham chiếu: `qa-flow-blueprint.md` §4.2 (verified lịch sử SBTM), Appendix B template.
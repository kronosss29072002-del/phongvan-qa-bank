# Test Charter

> Mission statement hướng dẫn một exploratory test session (ISTQB — verified). Viết xong trong 2 phút, dùng để bắt đầu session.

## Charter

```
Explore <mục tiêu / feature / module> để tìm <loại bug sâu cần tìm>,
dùng <kỹ thuật / heuristic: BVA, state-transition, error guessing...>,
chú ý <yếu tố rủi ro cụ thể: mạng chậm, refresh, phân quyền, race condition>.
```

**Charter TỐT:** đủ cụ thể để biết session đã hoàn thành chưa. KHÔNG phải danh sách steps.

---

## Metadata

| Field | Giá trị |
|---|---|
| **Session ID** | `SBTM-<run_id>-<seq>` |
| **Date / Tester** | — |
| **Thời lượng dự kiến** | 90 phút (3 khối ~25') |
| **Sản phẩm / Version** | — |
| **Môi trường** | web/mobile · browser/device · resolution |
| **Dữ liệu test** | traceable: `auto_<testName>_<timestamp>` (theo rules) |

---

## Chuẩn bị (2 phút)

1. [ ] Mind map nhanh: feature → vùng rủi ro (tô vùng cần explore)
2. [ ] Xác định 3-5 heuristic sẽ dùng (tham khảo SKILL.md: input/state/data/cross)
3. [ ] Ghi chú vùng CHỈ ĐƯỢC explore (nếu có)

## Ghi chú session (viết tay trong lúc chạy)

```
[0-25'] ...   [25-50'] ...   [50-90'] ...
```

## Sau session — debrief ngay

- CHARTED time: ___ phút · UNCHARTED time: ___ phút
- Bug tìm được → tạo bug report ngay (`/report-bug`), không để cuối ngày.
- Session report đầy đủ → `references/session-report-template.md`.
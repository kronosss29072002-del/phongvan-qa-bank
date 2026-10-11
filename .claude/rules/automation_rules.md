# Quy Tắc Chung cho Playwright Automation

> **Phạm vi:** Các nguyên tắc nền tảng áp dụng cho Playwright Test Automation.
>
> Quy tắc chi tiết xem tại:
> - **Playwright rules:** [playwright_rules.md](playwright_rules.md)
> - **Chiến lược Locator:** [locator_strategy.md](locator_strategy.md)

---

## 📚 HỆ THỐNG TÀI LIỆU

**Tài liệu đã được tái cấu trúc** để dễ tìm kiếm và sử dụng hơn.

### 🚀 BẮT ĐẦU TỪ ĐÂY

**→ [automation/README.md](automation/README.md)** — Navigation hub của toàn bộ hệ thống

### 📖 TÀI LIỆU THEO CẤP ĐỘ

| Level | File | Thời gian | Mô tả |
|-------|------|-----------|-------|
| **Beginner** | [QUICK_START.md](automation/QUICK_START.md) ⚡ | 5 phút | 5 Golden Rules, Locator checklist cơ bản |
| **Essential** | [CHEAT_SHEET.md](automation/CHEAT_SHEET.md) 📋 | 10 phút | **IN RA DÁN LÊN BÀN** - 14 lỗi phổ biến |
| **Core** | [CORE_RULES.md](automation/core/CORE_RULES.md) 📖 | 20 phút | Chi tiết đầy đủ core concepts |
| **Advanced** | [ADVANCED.md](automation/advanced/ADVANCED.md) 🔥 | 30-40 phút | POM Composition, Fixtures, Mocking |
| **Troubleshoot** | [TROUBLESHOOTING.md](automation/troubleshooting/TROUBLESHOOTING.md) 🔧 | As needed | Debug & fix flaky tests |

---

## 1. Kiến Trúc & Framework

- Bắt buộc sử dụng mô hình **Page Object Model (POM)**.
- Phân tách rõ ràng:
  - **Page classes:** Khai báo locators + methods tương tác UI
  - **Test classes:** Chứa logic kiểm thử + assertions
  - **Test data:** Tách riêng khỏi code chức năng (JSON, DataProvider, Utils)
- Assertions chỉ đặt trong Test classes, KHÔNG đặt trong Page classes.

---

## 2. Sinh Dữ Liệu Test (Test Data)

- Tất cả trường yêu cầu unique (Email, Username, Mã KH...) **phải sinh động**, không hardcode.
- Sử dụng UUID, Timestamp hoặc thư viện Faker.
- Dữ liệu phải **traceable** — nhìn vào DB biết ngay test nào tạo ra:
  ```
  Format: [prefix]_[testName]_[timestamp]_[random]
  Ví dụ:  auto_createCustomer_20260402_A3F2@test.com
  ```
- Hỗ trợ chạy parallel: mỗi test method có data riêng biệt, không conflict.

---

## 3. Chất Lượng Code

- Không logic trùng lặp — tạo helper methods cho các hành động lặp đi lặp lại.
- Code phải đơn giản, dễ đọc, dễ bảo trì.
- Trước khi deliver code:
  - Xóa toàn bộ `console.log`, `print()` sinh ra khi debug
  - Xóa code bị comment (`//`, `/* */`)
  - Xóa locator / biến không sử dụng (unused code)

---

## 4. Quản Lý File & Thư Mục

- KHÔNG tự động xóa file source khi chưa xác nhận với user.
- Kiểm tra cấu trúc thư mục hiện có trước khi tạo file mới — tránh duplicate.
- Đặt file đúng thư mục theo kiến trúc project (xem `.claude/skills/qa_automation_engineer/references/PROJECT_CONTEXT.md` để hiểu project structure).

---

## 5. Quy Tắc Đặt Tên

### TypeScript / Playwright

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| Page class | PascalCase + hậu tố `Page` | `LoginPage.ts`, `CartPage.ts` |
| Test file | kebab-case + `.spec.ts` | `login.spec.ts`, `cart.spec.ts` |
| Test block | `test('mô tả hành vi')` | `test('đăng nhập thành công')` |
| Locator biến | lowerCamelCase hoặc readonly | `readonly loginButton` |
| Utils | PascalCase hoặc kebab-case | `DataGenerator.ts`, `data-generator.ts` |

---

## 6. Assertions (Kiểm Tra Kết Quả)

- Mỗi test case **BẮT BUỘC** có ít nhất 1 assertion ở cuối.
- Nên có assertion xen kẽ ở các bước quan trọng.
- Assert phải mô tả rõ expected behavior:

```typescript
await expect(page.getByText('Đăng nhập thành công')).toBeVisible();
await expect(page).toHaveURL(/dashboard/);
```

---

## 7. Tính Độc Lập Của Test (Test Independence)

- Mỗi test case phải **độc lập** — không phụ thuộc kết quả test khác.
- Setup/teardown rõ ràng (`beforeEach/afterEach`).
- Không chia sẻ state giữa các test methods.
- Mỗi test tự tạo data riêng, chạy xong tự cleanup.

**Quy tắc VÀNG:** Test A fail KHÔNG được làm Test B fail. Test B phải pass khi chạy đơn lẻ.

---

## 8. Chiến Lược Chờ Đợi (Wait Strategy)

### Nguyên tắc:
- **NGHIÊM CẤM:** Hard sleep (`waitForTimeout`)
- **BẮT BUỘC:** Smart waits — chờ điều kiện cụ thể của UI hoặc Network

| ❌ Anti-pattern | ✅ Best Practice |
|----------------|------------------|
| `await page.waitForTimeout(2000)` | `await expect(element).toBeVisible()` |
| | `await page.waitForResponse('**/api/data**')` |

---

## 9. Chiến Lược Locator

Chi tiết đầy đủ xem tại: [locator_strategy.md](locator_strategy.md)

### Thứ tự ưu tiên:

| Độ ưu tiên | Playwright |
|------------|-----------|
| **1. Cao nhất** | `getByRole()`, `getByLabel()` |
| **2. Rất tốt** | `getByTestId()` |
| **3. Tốt** | `getByText()`, `getByPlaceholder()` |
| **4. Chấp nhận được** | `locator("css")` |
| **5. Tránh** | `locator("xpath")` |

---

## 10. Code Review Checklist

Trước khi commit code automation, kiểm tra danh sách sau:

### Locator Quality
- [ ] Không có XPath phức tạp hoặc CSS selector dễ gãy
- [ ] Không có `.first()`, `.last()`, `.nth()` trừ khi đã justify lý do
- [ ] Mọi locator đều được verify trên UI thật trước khi code

### Wait Strategy
- [ ] Không có `waitForTimeout` (hard sleep)
- [ ] Sử dụng smart waits (auto-waiting với điều kiện)
- [ ] Đợi Network API khi click trigger AJAX call

### POM Structure
- [ ] Mọi Locator đều khai báo trong Constructor của Page class
- [ ] Không có `expect()` bên trong POM class
- [ ] Test file (.spec.ts) không có locator inline

### Test Data
- [ ] Test data dùng UUID/faker/timestamp, không hardcode
- [ ] Data có prefix traceable (biết test nào tạo)
- [ ] Không dùng chung 1 account/data giữa các parallel tests

### Cleanup
- [ ] Teardown nằm trong `afterEach`/`afterAll` hoặc `try/finally`
- [ ] Cleanup dùng API thay vì UI (nhanh và ổn định hơn)
- [ ] Không để logic cleanup trong thân `test()` (dễ bị bỏ qua khi fail)

### Code Quality
- [ ] Xóa toàn bộ debug logs (`console.log`, `print()`)
- [ ] Xóa code bị comment
- [ ] Xóa locator / biến không sử dụng
- [ ] Không có `click({ force: true })` trừ input file ẩn

### Assertions
- [ ] Mỗi test case có ít nhất 1 assertion
- [ ] Assertion có message mô tả rõ ràng
- [ ] Không bọc assertion trong `try/catch` để nuốt lỗi
- [ ] Không dùng `.catch(() => false)` hoặc `.catch(() => {})`

### Test Independence
- [ ] Test chạy pass khi chạy đơn lẻ (không phụ thuộc test khác)
- [ ] Test không chia sẻ mutable state
- [ ] Mỗi test tự setup data riêng

---

## 11. Tham Khảo Chi Tiết

→ **[automation/README.md](automation/README.md)** — Hệ thống tài liệu đầy đủ
- [QUICK_START.md](automation/QUICK_START.md) — Bắt đầu nhanh 5 phút
- [CHEAT_SHEET.md](automation/CHEAT_SHEET.md) — 14 lỗi phổ biến (in ra dán lên bàn)
- [CORE_RULES.md](automation/core/CORE_RULES.md) — Core concepts chi tiết
- [ADVANCED.md](automation/advanced/ADVANCED.md) — POM Composition, Fixtures, Visual Testing, Network Mocking
- [TROUBLESHOOTING.md](automation/troubleshooting/TROUBLESHOOTING.md) — Debug flaky tests

→ [playwright_rules.md](playwright_rules.md) — Browser setup, MCP workflow, Quality Standards

→ [locator_strategy.md](locator_strategy.md) — Master Priority Map, Stability Rules, Quy trình xác minh

---

## 📌 QUICK LINKS

| Tôi cần... | Đọc tại |
|------------|---------|
| Bắt đầu học Playwright | [QUICK_START.md](automation/QUICK_START.md) |
| Checklist code review | [CHEAT_SHEET.md](automation/CHEAT_SHEET.md) |
| Fix flaky test | [TROUBLESHOOTING.md](automation/troubleshooting/TROUBLESHOOTING.md) |
| Học POM Composition | [ADVANCED.md](automation/advanced/ADVANCED.md#pom-composition) |
| Học Fixtures | [ADVANCED.md](automation/advanced/ADVANCED.md#fixtures--dependency-injection) |
| Debug timeout issues | [TROUBLESHOOTING.md](automation/troubleshooting/TROUBLESHOOTING.md#timeout-issues) |

---

> **💡 Cốt lõi tư duy:** Test sinh ra để **TƯƠNG TÁC** và **KIỂM ĐỊNH**. Thay vì tự code logic kiểm tra (lấy chữ ra → cắt chuỗi → if/else), hãy đẩy gánh nặng đó cho cơ chế assertion auto-retry của Playwright. Code ngắn đi một nửa và ổn định lên gấp nhiều lần.

---

**Version:** 2.1.0 (Playwright-Only)
**Last Updated:** 2026-06-25

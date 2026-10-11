# Quy Tắc Dành Riêng Cho Playwright

> Áp dụng khi thiết lập và chạy automation với Playwright (TypeScript hoặc Java).

## 1. Thiết Lập Browser (BẮT BUỘC)

### 1.1 Viewport & Headed/Headless Mode

- **Viewport debug:** Mọi quá trình debug UI bắt buộc chạy với viewport desktop: **`1920×1080`**.
- **Headed mode:** Bắt buộc mở browser có hiển thị (headed) trong quá trình thiết lập và debug test.
- **Headless mode:** Chỉ được phép sử dụng khi:
  - Test đã debug PASS 100% trên headed mode
  - Hoặc trong CI/CD pipeline mặc định

| Môi trường | Chế độ | Lý do |
|------------|--------|-------|
| **Local Debug** | `headless: false` (headed) | Cần **nhìn thấy** browser để biết chuyện gì đang xảy ra |
| **CI/CD Pipeline** | `headless: true` (headless) | Không có màn hình vật lý, chạy nhanh hơn |
| **Test đã PASS ổn định** | Được phép `headless: true` | Tiết kiệm tài nguyên |

```javascript
// playwright.config.ts
use: {
  viewport: { width: 1920, height: 1080 },
  headless: process.env.CI ? true : false,
}
```

### 1.2 Playwright MCP — Thứ Tự Thao Tác Bắt Buộc

Khi sử dụng Playwright MCP để debug UI, **LUÔN LUÔN** tuân theo thứ tự sau:

```
1. browser_navigate(url)        → Mở trang
2. browser_resize(1920, 1080)   → Set viewport desktop (BẮT BUỘC, không bỏ qua)
3. browser_wait_for(text)       → Đợi trang load xong (verify bằng text hiển thị)
4. browser_snapshot()           → Chụp cây DOM để phân tích
5. browser_take_screenshot()    → Chỉ chụp khi cần lưu bằng chứng fail
```

**NGHIÊM CẤM:**
- Gọi `browser_navigate` lại nếu đã ở đúng trang (tránh reload ngoài ý muốn)
- Bỏ qua bước `browser_resize` — viewport mặc định của MCP thường là mobile
- Chụp `screenshot` tràn lan — chỉ chụp khi fail hoặc milestone quan trọng

### 1.3 Context Isolation — Mỗi Test Một Browser Context Riêng

Mỗi test case chạy trong một Browser Context riêng biệt (Playwright mặc định). Context mới = Storage/Cookies mới = không bị nhiễu state từ test trước.

```javascript
// ❌ SAI — Dùng chung context giữa các test
let sharedContext;
test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
});
test('TC-A', async () => {
    const page = await sharedContext.newPage(); // ← Chung context với TC-B
});
```

Hãy để Playwright tự quản lý — mỗi test nhận `{ page }` riêng từ fixture mặc định.

## 2. Workflow Phát Triển & Tìm Element

- Ưu tiên sử dụng **Playwright MCP** để mở browser và tương tác với trang đích.
- **Inspect DOM thực tế:** Verify và capture selector trực tiếp từ browser DOM.
- **TUYỆT ĐỐI KHÔNG:**
  - Suy đoán locator
  - Copy locator mù quáng từ code cũ mà không verify
  - Dựa trên URL / tài liệu mà không xác nhận sự tồn tại trên UI thật

## 3. Thứ Tự Ưu Tiên Locator Playwright

Playwright cung cấp bộ locator semantic hướng người dùng. Ưu tiên sử dụng thay vì CSS/XPath:

1. `getByRole()` — Tốt nhất cho semantic elements (button, link, heading...)
2. `getByLabel()` — Tốt nhất cho form fields có label
3. `getByPlaceholder()` — Tốt nhất cho inputs có placeholder text
4. `getByText()` — Tốt nhất cho text content
5. `getByTestId()` — Tốt nhất khi element có `data-testid`
6. `locator("css")` — Fallback khi không có lựa chọn tốt hơn

Ví dụ:
```typescript
// Đúng — Semantic locator
page.getByRole('button', { name: 'Đăng nhập' })
page.getByLabel('Email')
page.getByPlaceholder('Nhập mật khẩu')

// Sai — XPath/CSS thô khi có semantic thay thế
page.locator('//button[@class="btn-login"]')
page.locator('.form-input:nth-child(2)')
```

## 4. Chiến Lược Chờ Đợi (Wait Strategy)

**NGHIÊM CẤM:**
- `page.waitForTimeout()` — hard sleep
- `await new Promise(r => setTimeout(r, N))` — tự tạo delay
- Bất kỳ cách nào cố định thời gian chờ

**SỬ DỤNG:**
- Tận dụng auto-waiting mặc định của Playwright
- Web-First Assertions:
  ```typescript
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await expect(locator).toHaveText('Thành công');
  await expect(page).toHaveURL(/dashboard/);
  ```
- Chỉ dùng `waitForSelector()` khi `expect()` không đáp ứng được yêu cầu đặc biệt

## 5. Cấu Trúc Test

```typescript
test.describe('Tên Module', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: navigate, login...
  });

  test('mô tả hành vi cần test', async ({ page }) => {
    // Arrange: khởi tạo page objects, data
    // Act: thực hiện hành động
    // Assert: kiểm tra kết quả
  });
});
```

- Mỗi test block phải có **assertion rõ ràng**
- Sử dụng `test.describe` để nhóm test theo module
- Sử dụng `beforeEach` / `afterEach` để setup / teardown

## 6. Tiêu Chuẩn Chất Lượng & Cross-Browser

### 6.1 Cross-Browser & Device Coverage

Dùng Playwright `projects` để chạy test trên nhiều browsers và devices:

```javascript
// playwright.config.ts
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
  // Mobile (nếu cần)
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] },
  },
]
```
- Ưu tiên Playwright built-in `devices` config objects
- Chỉ cover browsers và device profiles quan trọng nhất cho product
- Không chạy unnecessary combinations (tốn CI resources)

### 6.2 Parallel-Safe Design (Thiết Kế Chạy Song Song An Toàn)

- **Tránh shared mutable state** giữa các workers — mỗi test tự setup data riêng
- **Retries có chủ đích:** `retries: process.env.CI ? 2 : 0` — CI retry để tránh flaky network, local fail ngay để fix
- **Coi flakiness là defect** cần fix, không phải condition bình thường để chấp nhận
- **KHÔNG dùng retries để che giấu flaky tests** — nếu test cần retry để pass local, test đó có bug

### 6.3 Code Quality Checklist cho Test

- Code test tuân thủ project linting và formatting rules
- Mọi async Playwright call đều phải `await`
- File test dễ đọc và structurally consistent — Arrange → Act → Assert rõ ràng
- File, suite, test, helper, fixture có naming explicit và descriptive

### 6.4 Những Điều Phải TRÁNH

- ❌ Dùng brittle selectors khi resilient locator có sẵn
- ❌ Dùng `page.waitForTimeout()` — hard sleep
- ❌ Phụ thuộc test order — Test A fail kéo Test B fail
- ❌ Chia sẻ mutable state giữa tests
- ❌ Overuse hooks cho hidden setup (khó đọc, khó debug)
- ❌ Over-abstract simple tests (Rule 19.8 — test đơn giản nên viết inline)
- ❌ Test implementation details user không quan sát được (CSS classes, internal state)
- ❌ Giữ flaky tests trong suite mà không fix root cause

### 6.5 Tiêu Chuẩn "Playwright Test Tốt"

Một Playwright test tốt trong project này phải:
1. **Mô tả real user behavior** — test những gì user nhìn thấy và tương tác
2. **Dễ đọc** — người mới vào team đọc 1 lần hiểu ngay
3. **Reliable** — pass ổn định ở cả local và CI environments
4. **Safe để chạy parallel** — không conflict data với test khác
5. **Fail với clear diagnostics** — error message chỉ rõ cái gì sai, ở đâu
6. **Tránh unnecessary duplication** — dùng POM, fixtures, helpers hợp lý
7. **Dùng resilient locators** — ưu tiên `getByRole`, `getByLabel`, `getByTestId`
8. **Web-first assertions** — `await expect().toBeVisible()` thay vì check thủ công

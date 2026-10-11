# Troubleshooting Guide - Playwright Automation

> **Mục đích:** Hướng dẫn debug và fix các vấn đề thường gặp
> **Khi nào dùng:** Test fail, flaky, hoặc hành vi bất thường

---

## MỤC LỤC
1. [Flaky Tests](#flaky-tests)
2. [Timeout Issues](#timeout-issues)
3. [Element Not Found](#element-not-found)
4. [Strict Mode Violations](#strict-mode-violations)
5. [Race Conditions](#race-conditions)
6. [Authentication Issues](#authentication-issues)
7. [Screenshot/Visual Diff Failures](#screenshotvisual-diff-failures)
8. [Debugging Tools](#debugging-tools)

---

## FLAKY TESTS

### Dấu hiệu
Test đôi khi Pass, đôi khi Fail dù code không đổi.

### Nguyên nhân phổ biến

#### 1. Hard Sleep (`waitForTimeout`)
```javascript
// ❌ Nguyên nhân flaky
await page.waitForTimeout(2000); // Nếu mạng chậm > 2s → fail
```

**Fix:**
```javascript
// ✅ Đợi API response
await page.waitForResponse('**/api/save**');

// ✅ Đợi UI state
await expect(element).toBeVisible();
```

#### 2. Race Condition với Network
```javascript
// ❌ Click rồi expect ngay - chưa kịp render
await saveButton.click();
await expect(successMessage).toBeVisible(); // ← Có thể fail vì API chậm
```

**Fix:**
```javascript
// ✅ Đợi API trước
const [response] = await Promise.all([
  page.waitForResponse('**/api/save**'),
  saveButton.click()
]);
await expect(successMessage).toBeVisible();
```

#### 3. Timing-dependent Locators
```javascript
// ❌ Dựa vào thứ tự render
await page.locator('.item').first().click(); // ← Thứ tự không đảm bảo
```

**Fix:**
```javascript
// ✅ Xác định cụ thể
await page.locator('.item').filter({ hasText: 'Specific Item' }).click();
```

#### 4. Parallel Test Conflicts
```javascript
// ❌ Nhiều test dùng chung data
const email = "test@example.com"; // ← Conflict khi chạy parallel
```

**Fix:**
```javascript
// ✅ Random data mỗi test
const email = `test_${Date.now()}@example.com`;
```

### Debug Flaky Test Workflow

1. **Chạy nhiều lần để reproduce**
```bash
# Chạy 10 lần để phát hiện flaky
npx playwright test --repeat-each=10 flaky-test.spec.js
```

2. **Enable trace khi fail**
```javascript
// playwright.config.js
use: {
  trace: 'on-first-retry',
  video: 'on-first-retry',
  screenshot: 'only-on-failure'
}
```

3. **Xem trace để tìm race condition**
```bash
npx playwright show-trace trace.zip
```

---

## TIMEOUT ISSUES

### Error: `Timeout 30000ms exceeded`

#### Nguyên nhân 1: Element không bao giờ xuất hiện

**Debug:**
```javascript
// Kiểm tra element có trong DOM không
const count = await page.locator('.my-element').count();
console.log(`Found ${count} elements`); // Nếu 0 → locator sai
```

**Fix:**
- Verify locator đúng bằng Playwright Inspector
- Check element có bị ẩn bởi CSS (`display: none`) không

#### Nguyên nhân 2: API quá chậm

**Debug:**
```javascript
// Log network requests
page.on('response', response => {
  console.log(`${response.status()} ${response.url()}`);
});
```

**Fix:**
- Tăng timeout cho test cụ thể:
```javascript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 giây
});
```

#### Nguyên nhân 3: Đợi sai event

```javascript
// ❌ Đợi networkidle trong SPA - không bao giờ idle
await page.waitForLoadState('networkidle');

// ✅ Đợi element cụ thể
await expect(page.getByText('Dashboard')).toBeVisible();
```

---

## ELEMENT NOT FOUND

### Error: `locator.click: Target closed`

**Nguyên nhân:** Element bị remove khỏi DOM ngay sau khi tìm thấy (ví dụ: redirect, modal đóng).

**Fix:**
```javascript
// ❌ Có thể bị remove giữa chừng
const button = await page.locator('.submit-btn');
await button.click(); // ← Element đã mất

// ✅ Locator tự động re-query
await page.locator('.submit-btn').click();
```

### Error: `Element is not visible`

**Debug:**
```javascript
// Check element state
const button = page.locator('.submit-btn');
console.log('isVisible:', await button.isVisible());
console.log('isHidden:', await button.isHidden());
console.log('count:', await button.count());
```

**Nguyên nhân phổ biến:**
1. Element đang bị overlay che (loading spinner, modal)
2. Element bị CSS `display: none` hoặc `visibility: hidden`
3. Element nằm ngoài viewport (cần scroll)

**Fix:**
```javascript
// Đợi overlay biến mất
await expect(page.locator('.loading-overlay')).toBeHidden();
await button.click();

// Hoặc scroll to view
await button.scrollIntoViewIfNeeded();
await button.click();
```

---

## STRICT MODE VIOLATIONS

### Error: `strict mode violation: locator resolved to X elements`

**Nguyên nhân:** Locator match nhiều elements.

**Debug:**
```javascript
// Đếm số elements match
const count = await page.locator('.button').count();
console.log(`Found ${count} buttons`);

// List tất cả elements
const allTexts = await page.locator('.button').allTextContents();
console.log('Button texts:', allTexts);
```

**Fix - Option 1: Làm locator cụ thể hơn**
```javascript
// ❌ Quá chung
page.locator('.button')

// ✅ Cụ thể hơn
page.getByRole('button', { name: 'Submit' })
```

**Fix - Option 2: Filter**
```javascript
// ✅ Filter theo text/state
page.locator('.button').filter({ hasText: 'Submit' })
page.locator('.button').filter({ has: page.locator('.icon-save') })
```

**Fix - Option 3: Dùng `.first()` CHỈ KHI hợp lệ**
```javascript
// ❌ KHÔNG hợp lệ - che bug UI
page.locator('.submit-btn').first() // Element duplicate = bug

// ✅ Hợp lệ - UI purpose là chọn đầu tiên
page.locator('.star-rating .star').nth(4) // Chọn sao thứ 5
```

---

## RACE CONDITIONS

### Vấn đề: UI update chưa xong đã assert

```javascript
// ❌ Race condition
await page.getByRole('button', { name: 'Refresh' }).click();
const count = await page.locator('.item').count(); // ← Lấy ngay, chưa refresh xong
```

**Fix:**
```javascript
// ✅ Đợi network
await Promise.all([
  page.waitForResponse('**/api/items**'),
  page.getByRole('button', { name: 'Refresh' }).click()
]);
const count = await page.locator('.item').count();
```

### Vấn đề: Assertion trên data động

```javascript
// ❌ Snapshot data, không theo kịp thay đổi
const oldCount = await page.locator('.item').count();
await addButton.click();
await expect(page.locator('.item')).toHaveCount(oldCount + 1); // ← Có thể đếm quá sớm
```

**Fix:**
```javascript
// ✅ Poll continuously
await addButton.click();
await expect.poll(async () => {
  return await page.locator('.item').count();
}).toBeGreaterThan(oldCount);
```

---

## AUTHENTICATION ISSUES

### Test fail với `401 Unauthorized`

**Nguyên nhân:** Auth token hết hạn hoặc không được truyền đúng.

**Debug:**
```javascript
// Check cookies/storage state
page.on('request', request => {
  console.log('Headers:', request.headers());
});
```

**Fix 1: Verify storageState**
```javascript
// playwright.config.js
projects: [
  {
    name: 'authenticated',
    use: {
      storageState: 'auth.json' // File này có tồn tại không?
    }
  }
]
```

**Fix 2: Re-login trong globalSetup nếu cần**
```javascript
// global-setup.js
export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('/login');
  await page.fill('#email', process.env.TEST_USER);
  await page.fill('#password', process.env.TEST_PASSWORD);
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard');
  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}
```

---

## SCREENSHOT/VISUAL DIFF FAILURES

### Screenshot không match baseline

**Nguyên nhân phổ biến:**

#### 1. Dynamic Content
```javascript
// ❌ Timestamp, random avatar thay đổi
await expect(page).toHaveScreenshot('dashboard.png');
```

**Fix:**
```javascript
// ✅ Mask dynamic areas
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [
    page.locator('.timestamp'),
    page.locator('.user-avatar'),
    page.locator('.live-chart')
  ]
});
```

#### 2. Font Rendering khác nhau (OS/Browser)
```javascript
// ✅ Chỉ chụp component, không full page
const loginForm = page.locator('.login-form');
await expect(loginForm).toHaveScreenshot('login-form.png');
```

#### 3. Animation đang chạy
```javascript
// ✅ Disable animations
await expect(page).toHaveScreenshot('modal.png', {
  animations: 'disabled'
});
```

---

## DEBUGGING TOOLS

### 1. Playwright Inspector (UI Mode)

```bash
# Chạy test với UI mode
npx playwright test --ui

# Hoặc debug mode
npx playwright test --debug
```

**Lợi ích:**
- Step through từng action
- Inspect locators realtime
- Xem DOM tree

### 2. Trace Viewer

```bash
# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

**Lợi ích:**
- Xem timeline của mọi action
- Inspect network requests
- Screenshot tại mọi step

### 3. Console Logs

```javascript
// Log locator state
const button = page.locator('.submit-btn');
console.log('Count:', await button.count());
console.log('isVisible:', await button.isVisible());
console.log('Text:', await button.textContent());

// Log network
page.on('response', response => {
  if (response.url().includes('/api/')) {
    console.log(`${response.status()} ${response.url()}`);
  }
});
```

### 4. Pause Execution

```javascript
// Pause để inspect manually
await page.pause();

// Conditional pause
if (process.env.DEBUG) {
  await page.pause();
}
```

### 5. Slow Motion

```javascript
// playwright.config.js
use: {
  launchOptions: {
    slowMo: 1000 // Chậm 1 giây mỗi action
  }
}
```

---

## COMMON FIXES CHECKLIST

Khi test fail, check từng mục này:

- [ ] **Có `waitForTimeout` không?** → Replace bằng smart wait
- [ ] **Locator có unique không?** → Check với `.count()`
- [ ] **Có đợi API response không?** → Dùng `waitForResponse`
- [ ] **Test data có unique không?** → Dùng timestamp/UUID
- [ ] **Có assert trong `if` không?** → Move ra ngoài
- [ ] **Có action trong `expect.poll()` không?** → Tách ra
- [ ] **Có `.catch(() => false)` không?** → Remove
- [ ] **Có force click không?** → Check overlay
- [ ] **Element có trong viewport không?** → Scroll to view
- [ ] **Auth token còn hạn không?** → Re-login

---

## EMERGENCY DEBUG WORKFLOW

Khi test fail và bạn không biết tại sao:

1. **Enable full logging**
```javascript
// playwright.config.js
use: {
  trace: 'on',
  video: 'on',
  screenshot: 'on'
}
```

2. **Run với headed mode**
```bash
npx playwright test --headed --workers=1
```

3. **Add debug logs trước chỗ fail**
```javascript
console.log('=== BEFORE ACTION ===');
console.log('Element count:', await locator.count());
console.log('Element visible:', await locator.isVisible());

await locator.click(); // ← Fail ở đây

console.log('=== AFTER ACTION ==='); // Không chạy tới
```

4. **Xem trace file**
```bash
npx playwright show-trace test-results/.../trace.zip
```

5. **Tìm đúng moment fail** trong trace viewer
- Xem screenshot trước/sau
- Check network requests
- Xem console logs

6. **Isolate vấn đề**
- Comment các bước không liên quan
- Chỉ chạy đoạn code gây lỗi
- Simplify locator

---

### 📊 Phân Loại Lỗi & Hướng Xử Lý Nhanh

| Triệu chứng | Nguyên nhân có khả năng nhất | Fix đầu tiên cần thử |
|-------------|------------------------------|----------------------|
| `Timeout 30000ms exceeded` | Element không bao giờ xuất hiện | Dùng `.count()` check locator; verify DOM thực tế |
| `Element is not visible` | Bị overlay che (loading, modal) | Đợi overlay biến mất: `await expect(overlay).toBeHidden()` |
| `Strict mode violation` | Locator match nhiều elements | Làm locator cụ thể hơn: `getByRole()` hoặc `.filter()` |
| `Target closed` | Element bị remove khỏi DOM giữa chừng | Dùng locator thay vì element handle (locator tự động re-query) |
| `NS_ERROR_NOT_AVAILABLE` | Browser context đã đóng | Check teardown logic, không close context quá sớm |
| Test pass riêng lẻ, fail khi chạy chung | Conflict data / test order | Random test data, check test independence |

---

> 💡 **Rule of Thumb:** Nếu test fail 1 lần trong 10 lần chạy → đó là flaky test, PHẢI fix ngay. Đừng để flaky test tồn tại trong suite.

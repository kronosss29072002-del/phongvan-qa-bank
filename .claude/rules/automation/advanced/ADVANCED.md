# Kỹ Thuật Nâng Cao - Playwright Automation

> **Đối tượng:** QA Engineer đã nắm vững core concepts
> **Yêu cầu:** Đã đọc và hiểu [CORE_RULES.md](../core/CORE_RULES.md)
> **Thời gian đọc:** 30-40 phút

---

## MỤC LỤC
1. [POM Composition](#pom-composition)
2. [Fixtures & Dependency Injection](#fixtures--dependency-injection)
3. [API-Driven Setup/Teardown](#api-driven-setupteardown)
4. [Visual Regression Testing](#visual-regression-testing)
5. [Clock & Time Mocking](#clock--time-mocking)
6. [Network Mocking & Interception](#network-mocking--interception)
7. [Handling Iframes & Multiple Tabs](#handling-iframes--multiple-tabs)
8. [Soft Assertions](#soft-assertions)
9. [XSS & Security Testing](#xss--security-testing)
10. [Code Reuse & DRY](#code-reuse--dry-tái-sử-dụng-code--tránh-lặp)
11. [Playwright Config Tập Trung](#playwright-config-tập-trung)

---

## POM COMPOSITION

### Vấn đề: "God Class" trong POM

Khi một page có quá nhiều components (Header, Sidebar, Footer, Pagination, Modal...), class POM sẽ trở nên khổng lồ và khó maintain.

### Giải pháp: Component-based POM

Tách các UI components dùng chung thành class riêng.

#### Component: PaginationComponent
```javascript
// components/pagination-component.js
class PaginationComponent {
  constructor(page) {
    this.page = page;
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.prevButton = page.getByRole('button', { name: 'Previous' });
    this.currentPageLabel = page.locator('.current-page');
  }

  async goToNextPage() {
    await this.nextButton.click();
  }

  async goToPreviousPage() {
    await this.prevButton.click();
  }

  async getCurrentPage() {
    return await this.currentPageLabel.textContent();
  }
}

module.exports = { PaginationComponent };
```

#### Component: ModalComponent
```javascript
// components/modal-component.js
class ModalComponent {
  constructor(page, modalSelector = '.modal') {
    this.page = page;
    this.modal = page.locator(modalSelector);
    this.closeButton = this.modal.getByRole('button', { name: 'Close' });
    this.confirmButton = this.modal.getByRole('button', { name: 'Confirm' });
    this.cancelButton = this.modal.getByRole('button', { name: 'Cancel' });
  }

  async waitForOpen() {
    await expect(this.modal).toBeVisible();
  }

  async waitForClose() {
    await expect(this.modal).toBeHidden();
  }

  async confirm() {
    await this.confirmButton.click();
    await this.waitForClose();
  }

  async cancel() {
    await this.cancelButton.click();
    await this.waitForClose();
  }
}

module.exports = { ModalComponent };
```

#### Page sử dụng Components
```javascript
// pages/device-profile-page.js
const { PaginationComponent } = require('../components/pagination-component');
const { ModalComponent } = require('../components/modal-component');

class DeviceProfilePage {
  constructor(page) {
    this.page = page;
    
    // Page-specific locators
    this.searchInput = page.getByPlaceholder('Search');
    this.addButton = page.getByRole('button', { name: 'Add Profile' });
    this.table = page.getByRole('table');
    
    // Compose components
    this.pagination = new PaginationComponent(page);
    this.deleteModal = new ModalComponent(page, '.delete-confirmation-modal');
  }

  async searchProfile(name) {
    await this.searchInput.fill(name);
  }

  async deleteProfile(name) {
    const row = this.table.getByRole('row', { name });
    await row.getByRole('button', { name: 'Delete' }).click();
    await this.deleteModal.confirm();
  }
}

module.exports = { DeviceProfilePage };
```

#### Sử dụng trong Test
```javascript
test('navigate through pages', async ({ page }) => {
  const dp = new DeviceProfilePage(page);
  await page.goto('/device-profiles');
  
  // Dùng component pagination
  await dp.pagination.goToNextPage();
  await expect(dp.pagination.currentPageLabel).toHaveText('2');
});
```

---

## FIXTURES & DEPENDENCY INJECTION

### Vấn đề với `beforeEach`

```javascript
// ❌ Anti-pattern - Lặp code khởi tạo
let loginPage;
let profilePage;

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  profilePage = new DeviceProfilePage(page);
  await loginPage.login('user@test.com', 'password');
  await profilePage.goto();
});

test('test 1', async ({ page }) => {
  // Dùng profilePage
});

test('test 2', async ({ page }) => {
  // Dùng profilePage
});
```

### Giải pháp: Custom Fixtures

#### Định nghĩa Fixtures
```javascript
// fixtures/page-fixtures.js
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { DeviceProfilePage } from '../pages/device-profile-page';

export const test = base.extend({
  // Auto-login fixture
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await page.goto('/login');
    await loginPage.login('user@test.com', 'password');
    await use(page);
  },

  // Profile page fixture (với auto-navigation)
  profilePage: async ({ authenticatedPage }, use) => {
    const dp = new DeviceProfilePage(authenticatedPage);
    await dp.goto();
    await use(dp);
    // Code sau use() = teardown
  },
});

export { expect } from '@playwright/test';
```

#### Sử dụng Fixtures trong Test
```javascript
// tests/device-profiles.spec.js
import { test, expect } from '../fixtures/page-fixtures';

// ✅ Cực kỳ gọn - Fixture tự động inject
test('create profile', async ({ profilePage }) => {
  await profilePage.clickAddButton();
  await profilePage.fillName('TestProfile');
  await profilePage.clickSave();
  
  await expect(profilePage.successToast).toBeVisible();
});

test('search profile', async ({ profilePage }) => {
  await profilePage.searchProfile('TestProfile');
  await expect(profilePage.table).toContainText('TestProfile');
});
```

### Fixtures với Cleanup Tự Động

```javascript
// fixtures/test-data-fixtures.js
export const test = base.extend({
  testProfile: async ({ page, request }, use) => {
    // Setup: Tạo profile qua API
    const response = await request.post('/api/device-profiles', {
      data: { name: `TestProfile_${Date.now()}` }
    });
    const profile = await response.json();
    
    // Provide profile cho test
    await use(profile);
    
    // Teardown: Tự động cleanup sau khi test xong
    try {
      await request.delete(`/api/device-profiles/${profile.id}`);
    } catch (e) {
      console.error(`Cleanup failed: ${e.message}`);
    }
  }
});
```

---

## API-DRIVEN SETUP/TEARDOWN

### Nguyên tắc: UI để Test, API để Setup

#### ❌ Anti-pattern: Setup qua UI
```javascript
test('edit profile', async ({ page }) => {
  // Mất 10-15s chỉ để setup data
  await page.goto('/device-profiles');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByLabel('Name').fill('TestProfile');
  await page.getByLabel('Type').selectOption('Sensor');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Success')).toBeVisible();
  
  // Bắt đầu test thật sự
  await page.getByRole('button', { name: 'Edit' }).click();
  // ...
});
```

#### ✅ Best Practice: Setup qua API
```javascript
test('edit profile', async ({ page, request }) => {
  // Setup nhanh (< 1s)
  const response = await request.post('/api/device-profiles', {
    data: {
      name: `TestProfile_${Date.now()}`,
      type: 'Sensor'
    }
  });
  const profile = await response.json();
  
  try {
    // Test UI edit flow
    await page.goto(`/device-profiles/${profile.id}/edit`);
    await page.getByLabel('Name').fill('UpdatedName');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Success')).toBeVisible();
    
  } finally {
    // Cleanup qua API
    await request.delete(`/api/device-profiles/${profile.id}`);
  }
});
```

### API Request Context

```javascript
// playwright.config.js
export default {
  use: {
    baseURL: 'https://dev.example.com',
    extraHTTPHeaders: {
      'Authorization': `Bearer ${process.env.API_TOKEN}`
    }
  }
};
```

---

## VISUAL REGRESSION TESTING

### Rule 1: Mask Dynamic Data

```javascript
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [
    page.locator('.current-time'),
    page.locator('.dynamic-chart'),
    page.locator('.random-avatar')
  ]
});
```

### Rule 2: Target Specific Components

```javascript
// ❌ Chụp cả trang - dễ gãy
await expect(page).toHaveScreenshot('full-page.png');

// ✅ Chụp đúng component
const loginForm = page.locator('.login-form-container');
await expect(loginForm).toHaveScreenshot('login-form.png');
```

### Rule 3: Disable Animations

```javascript
await expect(component).toHaveScreenshot('modal.png', {
  animations: 'disabled'
});
```

---

## CLOCK & TIME MOCKING

### Fast-forward Time (Tua nhanh thời gian)

```javascript
test('OTP resend timer', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  
  const resendButton = page.getByRole('button', { name: 'Resend' });
  await expect(resendButton).toBeDisabled();
  
  // Tua nhanh 60 giây (ngay lập tức)
  await page.clock.fastForward(60000);
  
  await expect(resendButton).toBeEnabled();
});
```

### Freeze Time (Đóng băng thời gian)

```javascript
test.beforeEach(async ({ page }) => {
  // Đóng băng ở 8:00 AM, Jan 1, 2024
  await page.clock.setFixedTime(new Date('2024-01-01T08:00:00Z'));
  await page.goto('/dashboard');
});

test('display today label', async ({ page }) => {
  await expect(page.getByText('Hôm nay: 01/01/2024')).toBeVisible();
});
```

---

## NETWORK MOCKING & INTERCEPTION

### Mock API Response

```javascript
test('display error when API fails', async ({ page }) => {
  // Mock API trả về lỗi 500
  await page.route('**/api/device-profiles', route => {
    route.fulfill({ status: 500, body: 'Internal Server Error' });
  });
  
  await page.goto('/device-profiles');
  await expect(page.getByText('Hệ thống đang bận')).toBeVisible();
});
```

### Mock với Custom Response

```javascript
test('display empty state', async ({ page }) => {
  await page.route('**/api/device-profiles', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], total: 0 })
    });
  });
  
  await page.goto('/device-profiles');
  await expect(page.getByText('No profiles found')).toBeVisible();
});
```

### Intercept & Modify Request

```javascript
test('inject custom headers', async ({ page }) => {
  await page.route('**/api/**', route => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'X-Test-Mode': 'true'
      }
    });
  });
  
  await page.goto('/dashboard');
});
```

---

## HANDLING IFRAMES & MULTIPLE TABS

### Working with Iframes

```javascript
class PaymentPage {
  constructor(page) {
    this.page = page;
    
    // Xuyên vào iframe
    this.paymentIframe = page.frameLocator('#stripe-payment-frame');
    this.cardNumberInput = this.paymentIframe.locator('#card-number');
    this.cvvInput = this.paymentIframe.locator('#cvv');
  }

  async fillCardDetails(cardNumber, cvv) {
    await this.cardNumberInput.fill(cardNumber);
    await this.cvvInput.fill(cvv);
  }
}
```

### Multiple Tabs/Windows

```javascript
test('open report in new tab', async ({ page, context }) => {
  await page.goto('/dashboard');
  
  // Chờ tab mới mở
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'View Report' }).click()
  ]);
  
  // Chờ tab mới load xong
  await newPage.waitForLoadState('networkidle');
  
  // Tương tác với tab mới
  await expect(newPage.getByText('Report Data')).toBeVisible();
  
  // Đóng tab mới
  await newPage.close();
});
```

---

## SOFT ASSERTIONS

### Khi nào dùng Soft Assertions?

Khi bạn muốn kiểm tra nhiều trường mà không muốn dừng test ngay khi 1 trường fail.

```javascript
test('verify device configuration', async ({ page }) => {
  await page.goto('/device/12345/config');
  
  // Soft assertions - test tiếp tục dù có fail
  expect.soft(await termBrightness).toBeCloseTo(expectedBrightness, -1);
  expect.soft(await termVolume).toBe(expectedVolume);
  expect.soft(await termTimezone).toBe('Asia/Ho_Chi_Minh');
  
  // Report sẽ gom tất cả lỗi ở cuối
});
```

### ⚠️ Không lạm dụng

```javascript
// ❌ SAI - Soft assertion cho critical path
expect.soft(loginButton).toBeVisible(); // ← Nếu không có button, test nên fail ngay
await loginButton.click(); // ← Sẽ crash vì button không tồn tại

// ✅ ĐÚNG - Hard assertion cho critical path
await expect(loginButton).toBeVisible();
await loginButton.click();
```

---

## XSS & SECURITY TESTING

### Test XSS Prevention

```javascript
test('prevent XSS in profile name', async ({ page }) => {
  // Lắng nghe dialog (alert/confirm) - nếu bắn lên = hổng XSS
  page.on('dialog', dialog => {
    throw new Error(`XSS VULNERABILITY: ${dialog.message()}`);
  });
  
  const xssPayload = '<script>alert("xss")</script>';
  
  await page.goto('/device-profiles/create');
  await page.getByLabel('Name').fill(xssPayload);
  await page.getByRole('button', { name: 'Save' }).click();
  
  // Chuỗi phải hiển thị nguyên xi (đã được escape)
  await expect(page.getByText(xssPayload)).toBeVisible();
});
```

### Test CSRF Protection

```javascript
test('reject requests without CSRF token', async ({ request }) => {
  const response = await request.post('/api/device-profiles', {
    data: { name: 'Test' },
    headers: {
      // Cố tình bỏ CSRF token
      'X-CSRF-Token': ''
    }
  });
  
  expect(response.status()).toBe(403);
});
```

---

## CODE REUSE & DRY (TÁI SỬ DỤNG CODE & TRÁNH LẶP)

*Lặp code là gốc rễ của mọi rắc rối bảo trì. Sửa 1 logic phải sửa 10 nơi thì chắc chắn sót.*

### 1. Trích Xuất Helper Functions Cho Hành Động Lặp

Khi nhiều test case hoặc POM cùng thực hiện một chuỗi hành động giống nhau, gom thành utility function trong `utils/` hoặc `helpers/`:

```javascript
// utils/search-helper.js
export async function searchAndWait(page, keyword) {
  await page.getByRole('textbox', { name: 'Search' }).fill(keyword);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('Loading')).toBeHidden();
}
```

### 2. Dùng Fixture Để Chia Sẻ Logic Khởi Tạo Chung

Khi nhiều file test cần cùng một bước setup, đừng copy-paste `beforeEach`. Gom vào Custom Fixture:

```javascript
// fixtures.js
export const test = base.extend({
  sidebar: async ({ page }, use) => {
    await use(new SidebarComponent(page));
  }
});

// Mọi test file dùng chung fixture
test.beforeEach(async ({ sidebar }) => {
  await sidebar.clickMenu('Device Profiles');
});
```

### 3. Data Factories Thay Vì Hardcode Từng Test

```javascript
// factories/device.factory.js
import { faker } from '@faker-js/faker';

export function createDeviceData(overrides = {}) {
  return {
    name: `Device_${faker.string.alphanumeric(6)}`,
    type: 'Sensor',
    protocol: 'MQTT',
    ...overrides  // Cho phép override field cụ thể
  };
}

// Sử dụng
const device1 = createDeviceData();
const device2 = createDeviceData({ type: 'Actuator', protocol: 'HTTP' });
```

### 4. Kế Thừa POM Cho Các Trang Có Cấu Trúc Giống Nhau (BaseCrudPage)

Khi nhiều trang chia sẻ cùng layout (bảng + nút Add + search), dùng kế thừa:

```javascript
// base-crud-page.js
class BaseCrudPage {
  constructor(page) {
    this.searchInput = page.getByPlaceholder('Search');
    this.addButton = page.getByRole('button', { name: /add/i });
    this.table = page.getByRole('table');
  }

  async search(keyword) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
  }

  async getRowCount() {
    return await this.table.locator('tbody tr').count();
  }
}

// device-profile-page.js
class DeviceProfilePage extends BaseCrudPage {
  constructor(page) {
    super(page);
    this.deviceTypeSelect = page.getByLabel('Device Type');
  }

  async createDevice(name, type) {
    await this.addButton.click();
    await page.getByLabel('Name').fill(name);
    await this.deviceTypeSelect.selectOption(type);
  }
}
```

### 5. Tái Sử Dụng API Request Helpers Cho Setup/Teardown

```javascript
// api/device-api.js
export class DeviceApi {
  constructor(request) {
    this.request = request;
  }

  async create(data) {
    const response = await this.request.post('/api/devices', { data });
    return response.json();
  }

  async delete(id) {
    await this.request.delete(`/api/devices/${id}`);
  }

  // All-in-one: tạo + tự cleanup
  async createAndCleanup(data) {
    const result = await this.create(data);
    return {
      ...result,
      cleanup: async () => await this.delete(result.id)
    };
  }
}
```

### 6. Nguyên Tắc "Rule of Three" (3 Lần Lặp Thì Trích Xuất)

Không cần trích xuất ngay từ lần đầu viết. Nhưng khi bạn copy-paste cùng một đoạn code **lần thứ 3**, đó là lúc **bắt buộc** phải trích xuất thành function/class dùng chung.

- **Trích xuất quá sớm:** Gây over-engineering, abstraction sai
- **Trích xuất quá muộn:** Tạo nợ kỹ thuật, sửa 1 logic phải sửa 10 nơi
- **"3 lần"** là điểm cân bằng tối ưu

---

## PLAYWRIGHT CONFIG TẬP TRUNG

*Config tập trung = Single Source of Truth. Tránh config rải rác trong từng file test.*

### Cấu Trúc `playwright.config.ts` Chuẩn

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ============ TIMEOUTS ============
  timeout: 60000,              // Timeout tối đa 1 test (60s)
  expect: { timeout: 10000 },  // Timeout assertion (10s)

  // ============ PATHS ============
  testDir: './tests',
  outputDir: './test-results',

  // ============ RETRIES ============
  retries: process.env.CI ? 2 : 0,  // CI: retry 2 lần | Local: 0 (fail ngay để fix)

  // ============ WORKERS ============
  workers: process.env.CI ? 4 : undefined,  // CI: 4 workers | Local: auto
  fullyParallel: true,  // Cho phép chạy song song

  // ============ REPORTERS ============
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
  ],

  // ============ GLOBAL SETUP ============
  globalSetup: './global-setup.js',  // Chạy 1 lần trước toàn bộ test (auth, DB seed)

  // ============ SHARED SETTINGS ============
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    viewport: { width: 1920, height: 1080 },
    headless: process.env.CI ? true : false,
    storageState: 'auth.json',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    testIdAttribute: 'data-testid',
    actionTimeout: 15000,
  },

  // ============ PROJECTS ============
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  // ============ WEB SERVER ============
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Những Config QUAN TRỌNG Nhất

| Config | Giá trị khuyến nghị | Lý do |
|--------|---------------------|-------|
| `testIdAttribute` | `'data-testid'` | Đồng bộ với Frontend — `getByTestId()` dùng attribute này |
| `retries` | `CI ? 2 : 0` | Local fail phải fix ngay. CI retry để tránh flaky network |
| `trace` | `'on-first-retry'` | Chỉ lưu trace khi fail — tiết kiệm disk, đủ thông tin debug |
| `video` | `'on-first-retry'` | Xem lại video lúc fail để hiểu chuyện gì xảy ra |
| `screenshot` | `'only-on-failure'` | Bằng chứng trực quan khi test fail |
| `fullyParallel` | `true` | Tận dụng tối đa CPU, giảm thời gian chạy suite |
| `viewport` | `{ width: 1920, height: 1080 }` | Desktop chuẩn, tránh responsive gây ẩn element |
| `headless` | `CI ? true : false` | Headed local để thấy, headless CI để nhanh |

### KHÔNG Override Config Trong Từng Test File

```javascript
// ❌ SAI — Config rải rác trong test file
test.use({ viewport: { width: 1280, height: 720 } });
test('my test', async ({ page }) => { ... });

// ✅ ĐÚNG — Tạo project riêng trong config
projects: [{ name: 'tablet', use: { ...devices['iPad Pro'] } }]
```
**Ngoại lệ:** Được phép override `test.use()` khi test cần điều kiện đặc biệt không đáng tạo project riêng (ví dụ: test offline mode, test không có auth).

### Dùng Biến Môi Trường Cho Giá Trị Thay Đổi

```javascript
// ❌ SAI — Hardcode URL
baseURL: 'http://localhost:3000',

// ✅ ĐÚNG — Qua biến môi trường
baseURL: process.env.BASE_URL || 'http://localhost:3000',
```

---

## TÀI LIỆU THAM KHẢO

- **[CORE_RULES.md](../core/CORE_RULES.md)** - Quy tắc core
- **[CHEAT_SHEET.md](../CHEAT_SHEET.md)** - 15 lỗi phổ biến
- **[playwright_rules.md](../../playwright_rules.md)** - Chi tiết Playwright

---

> 💡 **Next Level:** Sau khi nắm được các kỹ thuật nâng cao này, xem [TROUBLESHOOTING.md](../troubleshooting/TROUBLESHOOTING.md) để học cách debug flaky tests.

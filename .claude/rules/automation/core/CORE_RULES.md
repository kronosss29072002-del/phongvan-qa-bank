# Quy Tắc Core cho Automation Testing (Playwright)

> **Đối tượng:** Mọi QA Automation Engineer làm việc với Playwright
> **Độ ưu tiên:** BẮT BUỘC tuân thủ
> **Thời gian đọc:** 15-20 phút

---

## MỤC LỤC
1. [Nguyên tắc vàng](#nguyên-tắc-vàng)
2. [Locator Strategy](#locator-strategy)
3. [Wait Strategy](#wait-strategy)
4. [Page Object Model (POM)](#page-object-model-pom)
5. [Assertions](#assertions)
6. [Test Independence](#test-independence)
7. [Test Data](#test-data)
8. [Error Handling](#error-handling)

---

## NGUYÊN TẮC VÀNG

### 1. Không Hard Sleep
```javascript
// ❌ NGHIÊM CẤM
await page.waitForTimeout(2000);

// ✅ ĐÚNG
await page.waitForResponse('**/api/save**');
await expect(element).toBeVisible();
```

### 2. Locators phải User-Facing
```javascript
// ❌ SAI
page.locator('div.container > button.btn-primary')

// ✅ ĐÚNG
page.getByRole('button', { name: 'Submit' })
```

### 3. POM Structure
- Locators khai báo trong Constructor
- Actions trong methods
- Assertions CHỈ trong test files

### 4. Test Independence
Mỗi test tự setup data, tự cleanup, không phụ thuộc test khác.

### 5. Random + Traceable Data
```javascript
const email = `auto_${faker.string.uuid().slice(0,8)}@test.com`;
```

---

## LOCATOR STRATEGY

### Thứ tự ưu tiên (từ TỐT → KÉM)

#### 1. `getByRole()` - TỐT NHẤT
```javascript
page.getByRole('button', { name: 'Submit' })
page.getByRole('textbox', { name: 'Email' })
page.getByRole('heading', { name: 'Dashboard' })
```

**Lý do:** 
- Semantic, gần với cách user tương tác
- Hỗ trợ accessibility
- Ổn định khi UI thay đổi

#### 2. `getByLabel()` - TỐT cho Forms
```javascript
page.getByLabel('Username')
page.getByLabel('Password')
```

#### 3. `getByTestId()` - TỐT cho elements không text
```javascript
page.getByTestId('close-modal-btn')
page.getByTestId('user-avatar')
```

**Best Practice:** Thêm `data-testid` vào source code khi element không có text rõ ràng.

#### 4. `getByText()` / `getByPlaceholder()` - CHẤP NHẬN ĐƯỢC
```javascript
page.getByText('Welcome back')
page.getByPlaceholder('Search...')
```

#### 5. CSS Selector - TRÁNH
```javascript
// Chỉ dùng khi không có lựa chọn tốt hơn
page.locator('button[data-action="save"]')
```

#### 6. XPath - NGHIÊM CẤM
```javascript
// ❌ Tuyệt đối tránh
page.locator('//div[3]/button[2]')
```

### Anti-patterns phải TRÁNH

#### ❌ CSS Class động
```javascript
page.locator('.MuiButton-root-123')  // ← Gãy khi build lại
page.locator('.css-1n2xyz-btn')      // ← Hash thay đổi
```

#### ❌ XPath theo vị trí
```javascript
page.locator('//div[3]/div[2]/form/button')  // ← Gãy khi thêm div
```

#### ❌ nth-child khi có lựa chọn tốt hơn
```javascript
page.locator('.list-item:nth-child(2)')  // ← Gãy khi sort thay đổi
```

### Khi nào dùng `.first()`, `.last()`, `.nth()`?

#### ✅ USE-CASES HỢP LỆ:

**1. Test tính năng Sort/Order**
```javascript
// Verify sort by date descending
await sortButton.click();
const firstRow = page.locator('tbody tr').first();
await expect(firstRow).toContainText('2026-06-11'); // Ngày mới nhất
```

**2. Xử lý UI lặp (Stacked Elements)**
```javascript
// Đóng toast message trên cùng
await page.locator('.toast-close-btn').first().click();
```

**3. UI tĩnh, không đổi (Star Rating, Color Picker)**
```javascript
// Click đánh giá 5 sao
await page.locator('.star-icon').nth(4).click();
```

#### ❌ TUYỆT ĐỐI TRÁNH:

**1. Tương tác với dòng cụ thể trong bảng động**
```javascript
// ❌ SAI - Xóa nhầm nếu data thay đổi thứ tự
await page.locator('tbody tr').first().getByRole('button', { name: 'Delete' }).click();

// ✅ ĐÚNG - Xác định đúng dòng cần xóa
await page.getByRole('row', { name: 'User_A' })
    .getByRole('button', { name: 'Delete' })
    .click();
```

**2. Vượt qua Strict Mode Violation**
```javascript
// ❌ SAI - Che giấu bug UI (element bị duplicate)
await page.locator('.submit-btn').first().click();

// ✅ ĐÚNG - Fix locator hoặc báo bug UI
await page.getByRole('button', { name: 'Submit' }).click();
```

**3. Loop với `.nth(i)` - Hiệu năng cực kém**
```javascript
// ❌ SAI - Chậm chạp
const count = await list.count();
for (let i = 0; i < count; i++) {
    const text = await list.nth(i).textContent(); // ← Gọi lại từ Node → Browser mỗi vòng
}

// ✅ ĐÚNG - Bulk extract
const allTexts = await list.allTextContents(); // ← 1 lần gọi
```

---

## WAIT STRATEGY

### Nguyên tắc: Đợi TRẠNG THÁI, không đợi THỜI GIAN

#### 1. Đợi API Response (Ưu tiên cao nhất khi có API call)
```javascript
const [response] = await Promise.all([
  page.waitForResponse(res => res.url().includes('/api/save') && res.status() === 200),
  saveButton.click()
]);
```

**Khi nào dùng:**
- Click button trigger API (Save, Delete, Load)
- Submit form
- Refresh data

#### 2. Đợi UI State Change
```javascript
// Đợi element hiển thị
await expect(successMessage).toBeVisible();

// Đợi loading biến mất
await expect(page.locator('.loading-spinner')).toBeHidden();

// Đợi button enabled
await expect(submitButton).toBeEnabled();
```

#### 3. Tin tưởng Auto-waiting của Playwright

Khi gọi action, Playwright tự động chờ:
- Element attached to DOM
- Element visible
- Element stable (không animation)
- Element enabled

```javascript
// ✅ ĐÚNG - Đừng thêm wait thừa
await button.click();  // Playwright tự động chờ button ready

// ❌ SAI - Thừa thãi
await button.waitFor({ state: 'visible' });
await button.click();
```

### Framework Comparison

| Tình huống | ❌ Anti-pattern | ✅ Best Practice |
|------------|-----------------|------------------|
| Đợi element | `await page.waitForTimeout(1000)` | `await expect(el).toBeVisible()` |
| Sau click Save | `await page.waitForTimeout(2000)` | `await page.waitForResponse('**/api/save**')` |
| Đợi loading | `await page.waitForTimeout(3000)` | `await expect(loading).toBeHidden()` |

---

## PAGE OBJECT MODEL (POM)

### Cấu trúc BẮT BUỘC

```javascript
// pages/login-page.js
class LoginPage {
  constructor(page) {
    this.page = page;
    
    // ✅ BẮT BUỘC: Khai báo TOÀN BỘ locators ở đây
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.locator('.error-message');
  }

  // Methods chứa ACTIONS
  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  // Getter methods để extract data
  async getErrorText() {
    return await this.errorMessage.textContent();
  }
}

module.exports = { LoginPage };
```

### Quy tắc VÀNG của POM

#### 1. Locators PHẢI khai báo trong Constructor
```javascript
// ❌ SAI - Locator ad-hoc trong method
async login(username, password) {
  await this.page.locator('#username').fill(username);  // ← Hard to maintain
}

// ✅ ĐÚNG - Locator trong Constructor
constructor(page) {
  this.usernameInput = page.locator('#username');
}
async login(username, password) {
  await this.usernameInput.fill(username);
}
```

#### 2. NGHIÊM CẤM `expect()` trong POM
```javascript
// ❌ SAI
class LoginPage {
  async login(username, password) {
    await this.usernameInput.fill(username);
    await expect(this.submitButton).toBeVisible();  // ← NGHIÊM CẤM
    await this.submitButton.click();
  }
}

// ✅ ĐÚNG - expect() chỉ trong test file
test('login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user', 'pass');
  
  // Assertions ở đây
  await expect(page).toHaveURL(/dashboard/);
});
```

#### 3. NGHIÊM CẤM Locator trong Test File
```javascript
// ❌ SAI
test('login', async ({ page }) => {
  await page.locator('#username').fill('user');  // ← Locator trực tiếp
  await page.locator('#password').fill('pass');
  await page.getByRole('button', { name: 'Login' }).click();
});

// ✅ ĐÚNG
test('login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user', 'pass');
});
```

### Quy tắc Naming

| Thành phần | Convention | Ví dụ |
|------------|------------|-------|
| Page class | PascalCase + `Page` | `LoginPage`, `DeviceProfilePage` |
| Test file | kebab-case + `.spec.js` | `login.spec.js`, `device-profiles.spec.js` |
| Locator (Button) | lowerCamelCase + `Button` | `submitButton`, `cancelButton` |
| Locator (Input) | lowerCamelCase + `Input` | `usernameInput`, `emailInput` |
| Locator (Dropdown) | lowerCamelCase + `Dropdown` | `countryDropdown` |
| Action method | động từ + tên hành động | `fillName()`, `clickSave()` |
| Get method | `get` + tên data | `getRowCount()`, `getErrorText()` |
| Check method | `is`/`has` | `isSaveButtonEnabled()` |

---

## ASSERTIONS

### Web-First Assertions (Auto-retry)

```javascript
// ❌ SAI - Assertion 1 lần, không retry
const isVisible = await element.isVisible();
expect(isVisible).toBeTruthy();

// ✅ ĐÚNG - Auto-retry trong 5s
await expect(element).toBeVisible();
```

### Các assertion phổ biến

```javascript
// UI State
await expect(element).toBeVisible();
await expect(element).toBeHidden();
await expect(element).toBeEnabled();
await expect(element).toBeDisabled();

// Content
await expect(element).toHaveText('Expected Text');
await expect(element).toContainText('Partial');
await expect(input).toHaveValue('Expected Value');

// URL & Page
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveTitle('Dashboard');

// Count
await expect(list).toHaveCount(5);
```

### Assertion với custom message

```javascript
await expect(button, 'Submit button must be visible').toBeVisible();
await expect(page, 'Should redirect to dashboard').toHaveURL(/dashboard/);
```

---

## TEST INDEPENDENCE

### Nguyên tắc: Mỗi test là một đơn vị độc lập hoàn toàn

#### ❌ Anti-pattern: Test phụ thuộc lẫn nhau
```javascript
let userId;

test('create user', async () => {
  userId = await createUser();  // ← Test B phụ thuộc vào Test A
});

test('edit user', async () => {
  await editUser(userId);  // ← Fail nếu Test A fail
});
```

#### ✅ Best Practice: Mỗi test tự setup
```javascript
test('edit user', async () => {
  // Tự tạo data
  const userId = await createUser();
  
  // Test logic
  await editUser(userId);
  
  // Tự cleanup
  await deleteUser(userId);
});
```

### Setup/Teardown Pattern

```javascript
test.describe('Device Profile CRUD', () => {
  let profileName;

  test.beforeEach(async ({ page }) => {
    profileName = generateTestProfileName();
    await createProfileViaModal(page, profileName);
  });

  test.afterEach(async ({ page }) => {
    await cleanupProfile(page, profileName);
  });

  test('Edit profile name', async ({ page }) => {
    // Data đã sẵn từ beforeEach
    await editProfileName(page, profileName, 'NewName');
    await expect(page.getByText('NewName')).toBeVisible();
  });
});
```

### Cleanup phải đảm bảo chạy (try/finally)

```javascript
// ✅ ĐÚNG - Cleanup luôn chạy
test('edit profile', async ({ page }) => {
  const profileId = await createProfile();
  
  try {
    await editProfile(profileId);
    await expect(successMessage).toBeVisible();
  } finally {
    // Cleanup chạy dù test pass hay fail
    await deleteProfile(profileId);
  }
});
```

---

## TEST DATA

### Nguyên tắc: Random + Traceable

#### ❌ Hardcode data
```javascript
const email = "test@example.com";  // ← Trùng lặp khi chạy parallel
const username = "testuser";
```

#### ✅ Random + Traceable
```javascript
import { faker } from '@faker-js/faker';

// Format: prefix_timestamp_random
const email = `auto_${Date.now()}_${faker.string.alphanumeric(6)}@test.com`;
const username = `testuser_${faker.string.uuid().slice(0, 8)}`;
const profileName = `Profile_${Date.now()}`;
```

### Data Factory Pattern

```javascript
// factories/device.factory.js
import { faker } from '@faker-js/faker';

export function createDeviceData(overrides = {}) {
  return {
    name: `Device_${faker.string.alphanumeric(8)}`,
    type: 'Sensor',
    protocol: 'MQTT',
    ...overrides
  };
}

// Sử dụng
const device1 = createDeviceData();
const device2 = createDeviceData({ type: 'Actuator' });
```

---

## ERROR HANDLING

### Quy tắc VÀNG: Catch → Enrich → Throw

#### ❌ Nuốt lỗi (NGHIÊM CẤM)
```javascript
try {
  await saveButton.click();
} catch (e) {
  console.log('Save failed');  // ← Test vẫn Pass dù có bug
}
```

#### ✅ Enrich rồi throw lại
```javascript
try {
  await saveButton.click();
} catch (e) {
  throw new Error(`Failed to click Save button: ${e.message}`);
}
```

### Khi nào dùng try/catch?

#### ✅ Cleanup/Teardown
```javascript
test.afterEach(async ({ request }) => {
  try {
    await request.delete(`/api/test-data/${id}`);
  } catch (e) {
    console.error(`Cleanup failed: ${e.message}`);
  }
});
```

#### ✅ Best-effort actions
```javascript
try {
  const debugInfo = await page.evaluate(() => window.__debugState);
  testInfo.attach('debug-state', { body: JSON.stringify(debugInfo) });
} catch (e) {
  // Không ảnh hưởng test
}
```

#### ❌ NGHIÊM CẤM bọc Assertions
```javascript
// ❌ SAI
try {
  await expect(element).toBeVisible();
} catch (e) {
  // Che giấu bug
}
```

### `.catch()` Pattern - NGHIÊM CẤM

```javascript
// ❌ NGHIÊM CẤM
const isVisible = await element.isVisible().catch(() => false);
await deleteButton.click().catch(() => {});

// ✅ ĐÚNG
await expect(element).toBeVisible();
await deleteButton.click();  // Để fail tự nhiên
```

### Error Handling Nâng Cao (Try/Catch & `.catch()`)

#### Rule 1: Dùng `test.step()` + try/catch để tạo thông báo lỗi ngữ cảnh

```javascript
await test.step('Tạo device profile mới', async () => {
  try {
    await profilePage.fillProfileName(profileName);
    await profilePage.clickSaveButton();
    await expect(profilePage.successToast).toBeVisible();
  } catch (e) {
    throw new Error(`Không thể tạo device profile "${profileName}": ${e.message}`);
  }
});
```
**Lợi ích:** HTML Report hiển thị lỗi cụ thể: tên profile nào, bước nào thất bại, thay vì chỉ báo `locator.click: Timeout 30000ms`.

#### Rule 2: KHÔNG dùng try/catch để xử lý luồng điều kiện (Conditional Flow)

```javascript
// ❌ SAI
try {
  await page.getByRole('button', { name: 'Accept Cookies' }).click({ timeout: 3000 });
} catch (e) {
  // Cookie banner không hiện, bỏ qua
}
```
**Lý do:** Nếu UI có thể ở 2 trạng thái, bạn không kiểm soát được test environment. Hãy fix môi trường test thay vì dùng try/catch để đoán.

#### Rule 3: Phân tích sâu `.catch(() => {})` và `.catch(() => false)` — nguy hiểm nhất

```javascript
// ❌ Anti-pattern 1 - Bỏ qua lỗi hoàn toàn
await page.getByRole('button', { name: 'Delete' }).click().catch(() => {});
// Action click() thất bại im lặng → bước tiếp theo chạy trên UI sai state

// ❌ Anti-pattern 2 - Ép giá trị trả về để né lỗi
const isVisible = await page.locator('.modal').isVisible().catch(() => false);
const count = await page.locator('table tr').count().catch(() => 0);
const text = await page.locator('.title').textContent().catch(() => '');
```
**Hậu quả:**
- `click()` thất bại im lặng → fail ở chỗ khác xa gốc, cực khó debug
- `.catch(() => false)` → assertion fail với `Expected false to be truthy` thay vì `Timeout waiting for element` — mất hoàn toàn ngữ cảnh lỗi gốc
- `.catch(() => 0)` → test tiếp tục với data rác, false positive

**Khi nào NÊN dùng `.catch()`:** CHỈ trong cleanup/teardown và phải log lỗi:
```javascript
await request.delete(`/api/test-data/${id}`).catch(e => console.error(`Cleanup failed: ${e.message}`));
```

#### Rule 4: GOLDEN RULE — Catch PHẢI kết thúc bằng `throw`

Khi dùng `try/catch` cho test logic, block `catch` **bắt buộc** phải kết thúc bằng `throw`. Nếu catch mà không throw lại, bạn đang nuốt lỗi:

```javascript
// ❌ NGHIÊM CẤM — Nuốt lỗi
try {
  await page.getByRole('button', { name: 'Save' }).click();
} catch (e) {
  console.log('Lưu thất bại'); // BUG bị che giấu, test vẫn PASS
}

// ✅ ĐÚNG — Catch → Enrich → Throw
try {
  await page.getByRole('button', { name: 'Save' }).click();
} catch (e) {
  throw new Error(`Lỗi khi click nút Save: ${e.message}`);
}
```

**Ngoại lệ DUY NHẤT được phép không throw:** Cleanup/Teardown và hành động phụ trợ best-effort.

#### Rule 5: Try/catch trong POM chỉ dùng để enrich lỗi

```javascript
// ❌ SAI — Ẩn lỗi, trả về 0 khiến test đi sai hướng
async getTableRowCount() {
  try {
    return await this.tableRows.count();
  } catch (e) {
    return 0;
  }
}

// ✅ ĐÚNG — Enrich rồi throw
async getTableRowCount() {
  try {
    return await this.tableRows.count();
  } catch (e) {
    throw new Error(`Không thể đếm số dòng bảng: ${e.message}`);
  }
}
```

---

## CODE REVIEW CHECKLIST

Trước khi commit:

- [ ] Không có `waitForTimeout` (hard sleep)
- [ ] Không có `expect()` trong POM class
- [ ] Không có XPath phức tạp hoặc CSS selector dễ gãy
- [ ] Không có `.first()`, `.last()`, `.nth()` trừ khi justified
- [ ] Mọi Locator khai báo trong Constructor
- [ ] Test file không có locator inline
- [ ] Test data dùng UUID/faker, không hardcode
- [ ] Mỗi test độc lập, tự setup/cleanup
- [ ] Không có `click({ force: true })` (trừ input file)
- [ ] Cleanup nằm trong `afterEach` hoặc `finally`
- [ ] Không có `.catch(() => false)` hoặc `.catch(() => {})`
- [ ] Không có assertion trong `if` statement
- [ ] Không có action trong `expect.poll()`

---

## TÀI LIỆU THAM KHẢO

- **[QUICK_START.md](../QUICK_START.md)** - Hướng dẫn nhanh 5 phút
- **[CHEAT_SHEET.md](../CHEAT_SHEET.md)** - 15 lỗi phổ biến nhất
- **[playwright_rules.md](../../playwright_rules.md)** - Chi tiết riêng Playwright
- **[advanced/](../advanced/)** - Kỹ thuật nâng cao (Fixtures, Visual Testing, Clock Mocking)

---

> 💡 **Core Philosophy:** Test sinh ra để TƯƠNG TÁC và KIỂM ĐỊNH. Đừng tự code logic kiểm tra phức tạp - hãy tin tưởng vào auto-waiting và web-first assertions của Playwright.

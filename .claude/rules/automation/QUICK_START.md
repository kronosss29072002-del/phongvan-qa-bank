# 🚀 QUICK START - Playwright Automation Rules

> **Dành cho:** Người mới bắt đầu hoặc cần reference nhanh
> **Thời gian đọc:** 5 phút
> **Mục tiêu:** Nắm được 20% rules quan trọng nhất cho 80% công việc

---

## 📋 TABLE OF CONTENTS
1. [Golden Rules (5 điều BẮT BUỘC)](#golden-rules-5-điều-bắt-buộc)
2. [Locator Checklist](#locator-checklist)
3. [Wait Strategy](#wait-strategy)
4. [POM Structure](#pom-structure)
5. [Assertion Basics](#assertion-basics)
6. [Next Steps](#next-steps)

---

## 🏆 GOLDEN RULES (5 điều BẮT BUỘC)

### 1. KHÔNG BAO GIỜ dùng `waitForTimeout()` (Hard Sleep)
```javascript
// ❌ NGHIÊM CẤM
await page.waitForTimeout(2000);

// ✅ ĐÚNG - Đợi API response
await page.waitForResponse('**/api/save**');

// ✅ ĐÚNG - Đợi UI state
await expect(element).toBeVisible();
```

### 2. Locator phải User-Facing (theo góc nhìn người dùng)
```javascript
// ❌ SAI - Dựa vào cấu trúc DOM
page.locator('div.container > button.btn-primary')

// ✅ ĐÚNG - Dựa vào text/role
page.getByRole('button', { name: 'Submit' })
page.getByTestId('submit-button')
```

### 3. Locator phải khai báo trong Constructor của POM
```javascript
// ❌ SAI - Locator nằm trong test file
test('login', async ({ page }) => {
  await page.locator('#username').fill('user');
});

// ✅ ĐÚNG - Locator trong POM
class LoginPage {
  constructor(page) {
    this.usernameInput = page.locator('#username');
    this.submitButton = page.getByRole('button', { name: 'Login' });
  }
}
```

### 4. Test Data phải RANDOM + TRACEABLE
```javascript
// ❌ SAI - Hardcode data
const email = "test@example.com";

// ✅ ĐÚNG - Random + traceable
import { faker } from '@faker-js/faker';
const email = `auto_${faker.string.uuid().slice(0,8)}@test.com`;
```

### 5. Mỗi test phải HOÀN TOÀN độc lập
```javascript
// ❌ SAI - Test B phụ thuộc Test A
let userId;
test('create user', async () => { userId = await create(); });
test('edit user', async () => { await edit(userId); }); // Fail nếu Test A fail

// ✅ ĐÚNG - Mỗi test tự setup data
test('edit user', async () => {
  const userId = await create(); // Tự tạo data
  await edit(userId);
  await cleanup(userId); // Tự dọn dẹp
});
```

---

## 🎯 LOCATOR CHECKLIST

### Thứ tự ưu tiên (từ TỐT nhất đến KÉM nhất):

1. **`getByRole`** - TỐT NHẤT cho semantic elements
   ```javascript
   page.getByRole('button', { name: 'Submit' })
   page.getByRole('textbox', { name: 'Email' })
   ```

2. **`getByLabel`** - TỐT cho form fields
   ```javascript
   page.getByLabel('Username')
   ```

3. **`getByTestId`** - TỐT cho elements không có text
   ```javascript
   page.getByTestId('close-modal-btn')
   ```

4. **`getByText`** - CHẤP NHẬN ĐƯỢC cho text content
   ```javascript
   page.getByText('Welcome back')
   ```

5. **`locator('css')`** - TRÁNH trừ khi bắt buộc
   ```javascript
   page.locator('button[data-action="save"]')
   ```

6. **XPath** - NGHIÊM CẤM (trừ trường hợp đặc biệt)

### ⚠️ TUYỆT ĐỐI TRÁNH:
- `.first()`, `.last()`, `.nth()` - chỉ dùng khi thực sự cần
- CSS class động: `.MuiButton-root-123`
- XPath theo vị trí: `//div[3]/button[2]`

---

## ⏱️ WAIT STRATEGY

### Nguyên tắc vàng:
> Luôn đợi một **trạng thái cụ thể** của UI hoặc Network, KHÔNG đợi thời gian

### Framework comparison:

| Tình huống | ❌ Anti-pattern | ✅ Best Practice |
|------------|-----------------|------------------|
| **Đợi element hiển thị** | `await page.waitForTimeout(1000)` | `await expect(element).toBeVisible()` |
| **Đợi sau khi click Save** | `await page.waitForTimeout(2000)` | `await page.waitForResponse('**/api/save**')` |
| **Đợi loading biến mất** | `await page.waitForTimeout(3000)` | `await expect(page.locator('.loading')).toBeHidden()` |

### Playwright Auto-waiting
Playwright tự động chờ các điều kiện sau trước khi action:
- Element tồn tại (attached to DOM)
- Element hiển thị (visible)
- Element ổn định (không animation)
- Element có thể tương tác (enabled)

→ **Tin tưởng vào auto-waiting, đừng thêm wait thừa!**

---

## 🏗️ POM STRUCTURE

### Cấu trúc bắt buộc:

```javascript
// pages/login-page.js
class LoginPage {
  constructor(page) {
    this.page = page;
    
    // BẮT BUỘC: Khai báo TẤT CẢ locators ở đây
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.locator('.error-message');
  }

  // Methods chỉ chứa ACTIONS, KHÔNG chứa assertions
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

### 🚫 NGHIÊM CẤM trong POM:
```javascript
class LoginPage {
  async login(username, password) {
    await this.usernameInput.fill(username);
    
    // ❌ NGHIÊM CẤM: expect() trong POM
    await expect(this.submitButton).toBeVisible();
    
    await this.submitButton.click();
  }
}
```

### ✅ Assertions chỉ nằm trong Test File:
```javascript
// tests/login.spec.js
test('login success', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.login('user@test.com', 'password123');
  
  // ✅ ĐÚNG: Assertions ở đây
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

---

## ✅ ASSERTION BASICS

### Web-First Assertions (Auto-retry)

```javascript
// ❌ SAI - Assertion 1 lần, không retry
const isVisible = await element.isVisible();
expect(isVisible).toBeTruthy();

// ✅ ĐÚNG - Auto-retry trong 5s
await expect(element).toBeVisible();
```

### Các assertion phổ biến:

| Kiểm tra | Code |
|----------|------|
| Element hiển thị | `await expect(element).toBeVisible()` |
| Element ẩn | `await expect(element).toBeHidden()` |
| Element enabled | `await expect(element).toBeEnabled()` |
| Text content | `await expect(element).toHaveText('Expected')` |
| Input value | `await expect(input).toHaveValue('Expected')` |
| URL chứa | `await expect(page).toHaveURL(/dashboard/)` |
| Count elements | `await expect(list).toHaveCount(5)` |

### ⚠️ KHÔNG nuốt lỗi:
```javascript
// ❌ NGHIÊM CẤM
try {
  await expect(element).toBeVisible();
} catch (e) {
  console.log('Failed but continue...'); // ← Che giấu bug!
}

// ✅ ĐÚNG - Để test fail rõ ràng
await expect(element).toBeVisible(); // Fail ngay nếu không visible
```

---

## 📚 NEXT STEPS

### Sau khi nắm được Quick Start này, đọc tiếp:

1. **[CHEAT_SHEET.md](CHEAT_SHEET.md)** - 15 lỗi phổ biến nhất (in ra dán lên bàn)
2. **[automation_rules.md](../automation_rules.md)** - Quy tắc đầy đủ
3. **[playwright_rules.md](../playwright_rules.md)** - Chi tiết riêng cho Playwright
4. **[advanced/](advanced/)** - Các kỹ thuật nâng cao

### Checklist trước khi commit code:

- [ ] Không có `waitForTimeout` (hard sleep)
- [ ] Không có `expect()` trong POM class
- [ ] Không có XPath phức tạp
- [ ] Mọi Locator khai báo trong Constructor
- [ ] Test data dùng UUID/faker, không hardcode
- [ ] Mỗi test độc lập, không phụ thuộc test khác
- [ ] Không có `click({ force: true })` (trừ input file)
- [ ] Cleanup/teardown nằm trong `afterEach`

---

> 💡 **Nhớ:** 5 Golden Rules + Locator Priority + No Hard Sleep = 80% quality test suite

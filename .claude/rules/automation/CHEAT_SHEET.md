# 🚨 PLAYWRIGHT AUTOMATION - 15 LỖI PHỔ BIẾN NHẤT

> **📌 IN RA VÀ DÁN LÊN BÀN LÀM VIỆC**
> 
> Checklist này tổng hợp 15 anti-patterns nguy hiểm nhất trong Playwright automation.
> Xếp theo mức độ nguy hiểm từ CAO đến THẤP.

---

## 1️⃣ LỖI "PASS ẢO" (Conditional Assertion)

**Vấn đề:** Bọc `expect` vào trong `if` statement.

```javascript
// ❌ SAI - Test Pass ảo khi element không tồn tại
if (await button.isVisible()) {
    await expect(button).toBeVisible();
}

// ✅ ĐÚNG - Để expect đứng một mình
await expect(button).toBeVisible();
```

**Hậu quả:** UI có bug nghiêm trọng nhưng test vẫn báo Pass ✅

---

## 2️⃣ LỖI "BAO LÔ" (Non-deterministic Assertion)

**Vấn đề:** Dùng logic OR để chấp nhận nhiều kết quả.

```javascript
// ❌ SAI - Chấp nhận bất kỳ kết quả nào
expect(buttonDisabled || errorVisible).toBeTruthy();

// ✅ ĐÚNG - Assert đúng 1 trường hợp cụ thể
await expect(button).toBeDisabled();
// HOẶC
await expect(errorMessage).toBeVisible();
```

**Hậu quả:** Test mất tính xác định, không phát hiện được thay đổi hành vi UI.

---

## 3️⃣ LỖI "SPAM/DDoS" (Action inside Poll)

**Vấn đề:** Đặt action (click, fill, API call) vào trong `expect.poll()`.

```javascript
// ❌ SAI - Spam action hàng chục lần/giây
await expect.poll(async () => {
    await searchInput.fill('abc'); // ← Nguy hiểm!
    return await result.isVisible();
}).toBe(true);

// ✅ ĐÚNG - Tách action và check
await searchInput.fill('abc');
await expect(result).toBeVisible();
```

**Hậu quả:** Crash browser, crash server, race condition.

---

## 4️⃣ LỖI "NIỀM TIN MÙ QUÁNG" (Checking Fake Data)

**Vấn đề:** Chỉ kiểm tra URL hoặc đếm số phần tử, không verify nội dung.

```javascript
// ❌ SAI - Chỉ check URL đổi
await nextBtn.click();
await expect(page).toHaveURL(/page=2/);

// ✅ ĐÚNG - Check cả nội dung thay đổi
const oldText = await row.textContent();
await nextBtn.click();
await expect(page).toHaveURL(/page=2/);
await expect.poll(() => row.textContent()).not.toBe(oldText);
```

**Hậu quả:** Bỏ lọt lỗi Backend hoặc lỗi render của Frontend.

---

## 5️⃣ LỖI "NGỦ CỨNG" (Hard Sleep)

**Vấn đề:** Dùng `waitForTimeout()` để đợi.

```javascript
// ❌ SAI - Flaky test
await saveBtn.click();
await page.waitForTimeout(2000);

// ✅ ĐÚNG - Đợi API response
await page.waitForResponse('**/api/save**');

// ✅ ĐÚNG - Đợi UI state
await expect(successToast).toBeVisible();
```

**Hậu quả:** Flaky test - chập chờn Pass/Fail.

---

## 6️⃣ LỖI "BÚA TẠ" (Force Click)

**Vấn đề:** Lạm dụng `{ force: true }`.

```javascript
// ❌ SAI - Vô hiệu hóa actionability checks
await button.click({ force: true });

// ✅ ĐÚNG - Để Playwright check tự nhiên
await button.click();
```

**Hậu quả:** Che giấu bug UI (pop-up lỗi đang đè lên button).

---

## 7️⃣ LỖI "BÓNG MA CATCH" (`isVisible`)

**Vấn đề:** Gắn `.catch(() => false)` sau `.isVisible()`.

```javascript
// ❌ SAI - Dài dòng vô ích
const x = await element.isVisible().catch(() => false);

// ✅ ĐÚNG - isVisible() không bao giờ throw error
const x = await element.isVisible();
```

**Hậu quả:** Code dài dòng, khó đọc.

---

## 8️⃣ LỖI "CHECK THỦ CÔNG" (Manual Assertion Instead of Web-First)

**Vấn đề:** Dùng `.isVisible()` / `.isEnabled()` rồi `expect()` thủ công, thay vì web-first assertions có auto-retry.

```javascript
// ❌ SAI - Check 1 lần, không retry → flaky
const isVisible = await button.isVisible();
expect(isVisible).toBeTruthy();

// ❌ SAI - Tương tự với các check khác
const isEnabled = await button.isEnabled();
expect(isEnabled).toBe(true);

// ✅ ĐÚNG - Web-first assertion có auto-retry (5s)
await expect(button).toBeVisible();
await expect(button).toBeEnabled();
```

**Hậu quả:** Flaky test vì element chưa kịp render/load, check 1 lần fail ngay.

---

## 9️⃣ LỖI "CÀO CẢ LÀNG" (Body Scraping)

**Vấn đề:** Lấy toàn bộ text của `<body>` rồi `.includes()`.

```javascript
// ❌ SAI - False positive cao
const pageText = await page.locator('body').textContent();
expect(pageText.includes('Profile-v2')).toBeTruthy();

// ✅ ĐÚNG - Nhắm đúng element
await expect(profileNameElement).toHaveText('Profile-v2');
```

**Hậu quả:** Chuỗi nằm trong element ẩn → test Pass ảo.

---

## 🔟 LỖI "QUÊN CHỐT HẠ" (Missing Assertion)

**Vấn đề:** So sánh bằng JS thuần, quên bọc vào `expect()`.

```javascript
// ❌ SAI - Không có assertion
const currentName = await input.inputValue();
const isMatch = currentName === 'Profile-v2';
console.log(`Đúng tên chưa? ${isMatch}`); // ← Log false nhưng test Pass

// ✅ ĐÚNG - Có expect để chốt
await expect(input).toHaveValue('Profile-v2');
```

**Hậu quả:** Test luôn Pass dù logic sai.

---

## 1️⃣1️⃣ LỖI "DỌN RÁC BẰNG UI" (UI-Driven Teardown)

**Vấn đề:** Dùng UI click để khôi phục/xóa data trong `finally` hoặc `afterAll`.

```javascript
// ❌ SAI - Chậm và dễ gãy
try {
    // Test logic
} finally {
    await dp.editButton.click();
    await dp.nameInput.fill(originalName);
    await dp.saveButton.click(); // ← Nếu Save bị lỗi, rác bị bỏ lại
}

// ✅ ĐÚNG - Dùng API để cleanup
try {
    // Test logic
} finally {
    await restoreProfileNameViaAPI(profileId, originalName);
}
```

**Hậu quả:** Cleanup fail → rác data → test sau bị fail dây chuyền.

---

## 1️⃣2️⃣ LỖI "ĐÀO TẨU" (Early Return / Bail Out)

**Vấn đề:** Dùng `return` để thoát test khi thiếu data.

```javascript
// ❌ SAI - Test Pass ảo
const onlineRow = await findOnlineDevice();
if (!onlineRow) return; // ← NGUY HIỂM!
await onlineRow.click();

// ✅ ĐÚNG - Thiếu data là lỗi môi trường
const onlineRow = await findOnlineDevice();
expect(onlineRow, 'Must have online device').not.toBeNull();
await onlineRow.click();
```

**Hậu quả:** Tính năng bị bỏ hoang không test, môi trường lỗi nhưng test Pass.

---

## 1️⃣3️⃣ LỖI "PHÁT MINH LẠI BÁNH XE" (Manual Soft Assertions)

**Vấn đề:** Tự viết vòng lặp so sánh, đẩy kết quả vào mảng.

```javascript
// ❌ SAI - Report vô dụng
const results = [];
results.push(Math.abs(term - expected) <= 10);
results.push(volume === expectedVolume);
expect(results.every(r => r)).toBeTruthy(); // ← Fail thì không biết trường nào sai

// ✅ ĐÚNG - Dùng expect.soft()
expect.soft(termBrightness).toBeCloseTo(expectedBrightness, -1);
expect.soft(termVolume).toBe(expectedVolume);
```

**Hậu quả:** Report không chi tiết, khó debug.

---

## 1️⃣4️⃣ LỖI "BẮT CÁ HAI TAY" (UI Racing)

**Vấn đề:** Dùng `Promise.race()` cho các trạng thái độc lập.

```javascript
// ❌ SAI - Race condition
await Promise.race([
    modal.waitFor({ state: 'hidden' }),
    toast.waitFor({ state: 'visible' }),
]);

// ✅ ĐÚNG - Đợi cả 2 trạng thái
await Promise.all([
    expect(modal).toBeHidden(),
    expect(toast).toBeVisible()
]);
```

**Hậu quả:** Flaky test do thứ tự sự kiện không xác định.

---

## 1️⃣5️⃣ LỖI "BỐC THĂM TRÚNG THƯỞNG" (Index-based Locators)

**Vấn đề:** Dùng `.first()`, `.last()`, `.nth(i)` khi có lựa chọn tốt hơn.

```javascript
// ❌ SAI - Dễ gãy khi sort thay đổi
await page.locator('.list-item').first().click();

// ✅ ĐÚNG - Xác định rõ phần tử
await page.locator('.list-item')
    .filter({ hasText: 'Admin' })
    .click();
```

**Hậu quả:** Che giấu bug Sort/Filter của UI.

---

## ✅ CODE REVIEW CHECKLIST

**Trước khi commit, kiểm tra:**

- [ ] Không có `waitForTimeout` (hard sleep)
- [ ] Không có `expect()` trong POM class
- [ ] Không có XPath phức tạp
- [ ] Không dùng `.isVisible()` / `.isEnabled()` thủ công - phải dùng `await expect().toBeVisible()`
- [ ] Không có `.first()`, `.last()`, `.nth()` trừ khi justified
- [ ] Mọi Locator khai báo trong Constructor
- [ ] Test data dùng UUID/faker
- [ ] Mỗi test độc lập (không phụ thuộc test khác)
- [ ] Không có `click({ force: true })`
- [ ] Cleanup/teardown nằm trong `afterEach`
- [ ] Không có `.catch(() => false)` hoặc `.catch(() => {})`
- [ ] Không có logic OR trong assertion
- [ ] Không có action trong `expect.poll()`
- [ ] Không có `if (!data) return;` để thoát test

---

## 🎯 CÁCH SỬ DỤNG CHEAT SHEET NÀY

1. **In ra** và dán lên bàn làm việc
2. **Đọc lướt** trước khi code review
3. **Check từng mục** trong checklist trước khi commit
4. **Tham khảo** khi test bị flaky hoặc fail không rõ lý do
5. **Chia sẻ** cho team members mới

---

> 💡 **Nhớ:** Đây là 15 lỗi phổ biến nhất, không phải toàn bộ. Xem [automation_rules.md](../automation_rules.md) để biết đầy đủ quy tắc.

# Chiến Lược Chọn Locator (Playwright)

> Độ ổn định và khả năng đọc hiểu của locator quyết định sức khỏe của một automation framework.
> Nguyên tắc cốt lõi: KHÔNG BAO GIỜ chọn element dựa trên cấu trúc DOM gắn với styling. Hãy xây dựng locator dựa trên thuộc tính có ngữ nghĩa.

## 1. Bản Đồ Ưu Tiên (Master Priority Map)

Thứ tự ưu tiên từ cao đến thấp:

1. **`getByRole()`** — Tốt nhất cho semantic elements (button, link, heading...)
2. **`getByLabel()`** — Tốt nhất cho form fields có label
3. **`getByPlaceholder()`** — Tốt nhất cho inputs có placeholder text
4. **`getByText()`** — Tốt nhất cho text content
5. **`getByTestId()`** — Tốt nhất khi element có `data-testid`
6. **`locator("css")`** — Fallback khi không có lựa chọn tốt hơn
7. **XPath** — Lựa chọn cuối cùng (tránh dùng)

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

## 2. Quy Tắc Ổn Định (Stability Rules)

Mọi locator phải đảm bảo:
- Chỉ match **đúng 1 element** duy nhất trên trang (unique in scope).
- Sống sót qua thay đổi giao diện — không bị ảnh hưởng khi DOM thay đổi layout (thêm/bớt div wrapper, đổi flexbox).

**NGHIÊM CẤM sử dụng:**
- CSS class name động / hash tạm thời (ví dụ: `css-1n2xyz-btn`)
- Chuỗi `nth-child`, `nth-of-type` khi có lựa chọn tốt hơn
- ID tự sinh bởi framework (auto-generated IDs)
- XPath tuyệt đối dựa trên vị trí (ví dụ: `//div[3]/div[2]/form/button`)

## 3. Quy Trình Xác Minh Locator

Trước khi đưa locator vào code, phải kiểm tra:

1. Locator có match **đúng 1 element** trong DOM không?
2. Element match có phải là thành phần người dùng tương tác được không? (không phải shadow DOM overlay)
3. Reload / navigate lại trang — locator có còn đúng không?
4. Thử trên nhiều trạng thái trang (loading, loaded, có data, không data) — locator có ổn định không?

---

> Chi tiết đầy đủ về Locator trong Playwright xem tại: [playwright_rules.md](playwright_rules.md#3-thứ-tự-ưu-tiên-locator-playwright)

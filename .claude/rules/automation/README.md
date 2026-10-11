# 📚 Playwright Automation Rules - Hệ Thống Tài Liệu

> **Hệ thống tài liệu đầy đủ cho Playwright Test Automation**
> 
> Được tổ chức theo cấp độ từ cơ bản đến nâng cao, dễ tìm kiếm và sử dụng.

---

## 🎯 BẮT ĐẦU TỪ ĐÂU?

### 📌 Người Mới Bắt Đầu
**→ Đọc theo thứ tự:**
1. **[QUICK_START.md](QUICK_START.md)** ⚡ (5 phút)
   - 5 Golden Rules
   - Locator checklist
   - Wait strategy cơ bản
   - POM structure
   - Assertion basics

2. **[CHEAT_SHEET.md](CHEAT_SHEET.md)** 📋 (10 phút)
   - **IN RA VÀ DÁN LÊN BÀN LÀM VIỆC**
   - 15 lỗi phổ biến nhất
   - Code review checklist

### 🎓 Đã Có Kinh Nghiệm
**→ Đọc core rules:**
- **[core/CORE_RULES.md](core/CORE_RULES.md)** 📖 (20 phút)
  - Locator strategy chi tiết
  - Wait strategy framework comparison
  - POM architecture
  - Test independence
  - Error handling

### 🚀 Nâng Cao
**→ Khám phá advanced topics:**
- **[advanced/ADVANCED.md](advanced/ADVANCED.md)** 🔥 (30-40 phút)
  - POM Composition
  - Fixtures & Dependency Injection
  - API-driven Setup/Teardown
  - Visual Regression Testing
  - Clock & Time Mocking
  - Network Mocking
  - XSS & Security Testing

### 🐛 Gặp Vấn Đề?
**→ Tham khảo troubleshooting:**
- **[troubleshooting/TROUBLESHOOTING.md](troubleshooting/TROUBLESHOOTING.md)** 🔧
  - Debug flaky tests
  - Fix timeout issues
  - Element not found
  - Strict mode violations
  - Race conditions
  - Authentication issues
  - Debugging tools

---

## 📂 CẤU TRÚC THƯ MỤC

```
.claude/rules/automation/
│
├── README.md                          ← BẠN ĐANG Ở ĐÂY
├── QUICK_START.md                     ← Bắt đầu từ đây (5 phút)
├── CHEAT_SHEET.md                     ← In ra dán lên bàn
│
├── core/
│   └── CORE_RULES.md                  ← Core concepts chi tiết
│
├── advanced/
│   └── ADVANCED.md                    ← Kỹ thuật nâng cao
│
└── troubleshooting/
    └── TROUBLESHOOTING.md             ← Debug & fix issues
```

---

## 🗂️ TÀI LIỆU THEO CHỦ ĐỀ

### 🎯 Locators (Định vị phần tử)
- **Quick Start:** [QUICK_START.md#locator-checklist](QUICK_START.md#locator-checklist)
- **Chi tiết:** [core/CORE_RULES.md#locator-strategy](core/CORE_RULES.md#locator-strategy)
- **Troubleshoot:** [troubleshooting/TROUBLESHOOTING.md#strict-mode-violations](troubleshooting/TROUBLESHOOTING.md#strict-mode-violations)

### ⏱️ Wait Strategy (Chiến lược chờ đợi)
- **Quick Start:** [QUICK_START.md#wait-strategy](QUICK_START.md#wait-strategy)
- **Chi tiết:** [core/CORE_RULES.md#wait-strategy](core/CORE_RULES.md#wait-strategy)
- **Troubleshoot:** [troubleshooting/TROUBLESHOOTING.md#timeout-issues](troubleshooting/TROUBLESHOOTING.md#timeout-issues)

### 🏗️ Page Object Model (POM)
- **Quick Start:** [QUICK_START.md#pom-structure](QUICK_START.md#pom-structure)
- **Chi tiết:** [core/CORE_RULES.md#page-object-model-pom](core/CORE_RULES.md#page-object-model-pom)
- **Nâng cao:** [advanced/ADVANCED.md#pom-composition](advanced/ADVANCED.md#pom-composition)

### ✅ Assertions (Kiểm chứng)
- **Quick Start:** [QUICK_START.md#assertion-basics](QUICK_START.md#assertion-basics)
- **Chi tiết:** [core/CORE_RULES.md#assertions](core/CORE_RULES.md#assertions)
- **Nâng cao:** [advanced/ADVANCED.md#soft-assertions](advanced/ADVANCED.md#soft-assertions)

### 🧪 Test Independence (Tính độc lập)
- **Chi tiết:** [core/CORE_RULES.md#test-independence](core/CORE_RULES.md#test-independence)
- **Troubleshoot:** [troubleshooting/TROUBLESHOOTING.md#parallel-test-conflicts](troubleshooting/TROUBLESHOOTING.md#flaky-tests)

### 📊 Test Data (Dữ liệu test)
- **Chi tiết:** [core/CORE_RULES.md#test-data](core/CORE_RULES.md#test-data)
- **Nâng cao:** [advanced/ADVANCED.md#api-driven-setupteardown](advanced/ADVANCED.md#api-driven-setupteardown)

### 🚨 Error Handling (Xử lý lỗi)
- **Chi tiết:** [core/CORE_RULES.md#error-handling](core/CORE_RULES.md#error-handling)
- **Anti-patterns:** [CHEAT_SHEET.md#7️⃣-lỗi-bóng-ma-catch](CHEAT_SHEET.md)

### 🔥 Advanced Topics
- **Fixtures & DI:** [advanced/ADVANCED.md#fixtures--dependency-injection](advanced/ADVANCED.md#fixtures--dependency-injection)
- **Visual Testing:** [advanced/ADVANCED.md#visual-regression-testing](advanced/ADVANCED.md#visual-regression-testing)
- **Time Mocking:** [advanced/ADVANCED.md#clock--time-mocking](advanced/ADVANCED.md#clock--time-mocking)
- **Network Mocking:** [advanced/ADVANCED.md#network-mocking--interception](advanced/ADVANCED.md#network-mocking--interception)
- **Security Testing:** [advanced/ADVANCED.md#xss--security-testing](advanced/ADVANCED.md#xss--security-testing)

---

## ✅ CODE REVIEW CHECKLIST

**Trước khi commit test code, check đủ 13 mục này:**

### 🚫 Anti-Patterns (KHÔNG được có)
- [ ] Không có `waitForTimeout` (hard sleep)
- [ ] Không có `expect()` trong POM class
- [ ] Không có XPath phức tạp hoặc CSS selector dễ gãy
- [ ] Không có `.first()`, `.last()`, `.nth()` trừ khi justified
- [ ] Không có `click({ force: true })` (trừ input file)
- [ ] Không có `.catch(() => false)` hoặc `.catch(() => {})`
- [ ] Không có assertion trong `if` statement
- [ ] Không có action trong `expect.poll()`

### ✅ Best Practices (BẮT BUỘC có)
- [ ] Mọi Locator khai báo trong Constructor
- [ ] Test file không có locator inline
- [ ] Test data dùng UUID/faker, không hardcode
- [ ] Mỗi test độc lập, tự setup/cleanup
- [ ] Cleanup nằm trong `afterEach` hoặc `finally`

**Chi tiết đầy đủ:** [CHEAT_SHEET.md#code-review-checklist](CHEAT_SHEET.md#code-review-checklist)

---

## 🎓 LEARNING PATH

### Level 1: Fundamentals (Tuần 1)
```mermaid
QUICK_START → CHEAT_SHEET → Viết 5 test cases đơn giản
```

**Mục tiêu:**
- Hiểu 5 Golden Rules
- Biết dùng `getByRole`, `getByTestId`
- Tránh được `waitForTimeout`
- Biết khai báo locator trong Constructor

### Level 2: Core Mastery (Tuần 2-3)
```mermaid
CORE_RULES → Viết POM cho 1 module → Code review với CHEAT_SHEET
```

**Mục tiêu:**
- Master locator strategy
- Hiểu wait strategy framework comparison
- Viết POM đúng chuẩn
- Test independence 100%

### Level 3: Advanced Techniques (Tuần 4+)
```mermaid
ADVANCED → Áp dụng Fixtures → Visual Testing → Network Mocking
```

**Mục tiêu:**
- POM Composition
- Custom Fixtures
- API-driven setup
- Visual regression testing
- Time & Network mocking

### Level 4: Troubleshooting Master
```mermaid
TROUBLESHOOTING → Debug flaky tests → Optimize test suite
```

**Mục tiêu:**
- Debug flaky tests
- Optimize performance
- Handle race conditions
- Master debugging tools

---

## 📖 TÀI LIỆU THAM KHẢO

### Playwright Rules
- **Browser setup, MCP workflow:** [../playwright_rules.md](../playwright_rules.md)
- **Locator Strategy:** [../locator_strategy.md](../locator_strategy.md)

---

## 🔍 TÌM KIẾM NHANH

### Tôi cần fix...
| Vấn đề | Đọc tại |
|--------|---------|
| Test bị flaky (chập chờn Pass/Fail) | [troubleshooting/TROUBLESHOOTING.md#flaky-tests](troubleshooting/TROUBLESHOOTING.md#flaky-tests) |
| Timeout 30000ms exceeded | [troubleshooting/TROUBLESHOOTING.md#timeout-issues](troubleshooting/TROUBLESHOOTING.md#timeout-issues) |
| Element not found | [troubleshooting/TROUBLESHOOTING.md#element-not-found](troubleshooting/TROUBLESHOOTING.md#element-not-found) |
| Strict mode violation | [troubleshooting/TROUBLESHOOTING.md#strict-mode-violations](troubleshooting/TROUBLESHOOTING.md#strict-mode-violations) |
| Race condition | [troubleshooting/TROUBLESHOOTING.md#race-conditions](troubleshooting/TROUBLESHOOTING.md#race-conditions) |
| 401 Unauthorized | [troubleshooting/TROUBLESHOOTING.md#authentication-issues](troubleshooting/TROUBLESHOOTING.md#authentication-issues) |

### Tôi muốn học...
| Topic | Đọc tại |
|-------|---------|
| Cách chọn locator tốt nhất | [core/CORE_RULES.md#locator-strategy](core/CORE_RULES.md#locator-strategy) |
| Cách đợi đúng (không dùng sleep) | [core/CORE_RULES.md#wait-strategy](core/CORE_RULES.md#wait-strategy) |
| Cách viết POM đúng chuẩn | [core/CORE_RULES.md#page-object-model-pom](core/CORE_RULES.md#page-object-model-pom) |
| Cách dùng Fixtures | [advanced/ADVANCED.md#fixtures--dependency-injection](advanced/ADVANCED.md#fixtures--dependency-injection) |
| Cách mock API | [advanced/ADVANCED.md#network-mocking--interception](advanced/ADVANCED.md#network-mocking--interception) |
| Cách test visual | [advanced/ADVANCED.md#visual-regression-testing](advanced/ADVANCED.md#visual-regression-testing) |

---

## 💡 TIPS & TRICKS

### 1. In CHEAT_SHEET ra giấy
**[CHEAT_SHEET.md](CHEAT_SHEET.md)** được thiết kế để in ra dán lên bàn làm việc. Đọc lướt trước khi code review.

### 2. Dùng Code Review Checklist
Trước khi commit, check hết 13 mục trong checklist. Tránh được 90% lỗi phổ biến.

### 3. Học từ Anti-patterns
15 lỗi trong CHEAT_SHEET là từ kinh nghiệm thực tế. Học từ lỗi của người khác thay vì tự mắc phải.

### 4. Khi test fail không rõ lý do
1. Check [CHEAT_SHEET.md](CHEAT_SHEET.md) - có thể bạn đang mắc 1 trong 15 lỗi
2. Xem [troubleshooting/TROUBLESHOOTING.md](troubleshooting/TROUBLESHOOTING.md)
3. Run với `--headed --workers=1` để debug

### 5. Khi viết code mới
1. Luôn khai báo locator trong Constructor
2. Luôn dùng `getByRole` trước, fallback sang `getByTestId`
3. KHÔNG BAO GIỜ dùng `waitForTimeout`
4. Test data phải random + traceable

---

## 🤝 ĐÓNG GÓP

### Cấu trúc tài liệu này được thiết kế để:
- ✅ Dễ tìm kiếm (theo level, theo topic)
- ✅ Dễ học (từ cơ bản → nâng cao)
- ✅ Dễ tham khảo (quick reference)
- ✅ Dễ bảo trì (module hóa)

### Khi cập nhật:
1. **QUICK_START.md** - Chỉ giữ 20% rules quan trọng nhất
2. **CHEAT_SHEET.md** - Chỉ list anti-patterns thực sự nguy hiểm
3. **CORE_RULES.md** - Core concepts, áp dụng cho 80% trường hợp
4. **ADVANCED.md** - Kỹ thuật nâng cao, không bắt buộc
5. **TROUBLESHOOTING.md** - Solutions cho vấn đề cụ thể

---

## 📞 HỖ TRỢ

- **Gặp vấn đề với tài liệu?** Mở issue hoặc liên hệ QA Lead
- **Tài liệu chưa rõ?** Đóng góp example hoặc đề xuất cải thiện
- **Phát hiện sai sót?** Pull request hoặc báo ngay

---

> 💡 **Philosophy:** "Test sinh ra để TƯƠNG TÁC và KIỂM ĐỊNH. Tin tưởng vào auto-waiting và web-first assertions của Playwright thay vì tự code logic kiểm tra phức tạp."

---

**Version:** 1.0.0 (2026-06-11)
**Last Updated:** 2026-06-11
**Maintainer:** QA Team

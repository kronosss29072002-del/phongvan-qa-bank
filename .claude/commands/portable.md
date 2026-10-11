---
description: Bootstrap this .claude bundle into the current project — regenerate repo-facts, validate bundle references, report detected stack
allowed-tools: Bash, Read, Glob, Grep
---

# /portable — Bootstrap bundle vào project hiện tại

Chạy khi vừa copy thư mục `.claude/` này vào một project mới (hoặc khi stack đổi).
Mục tiêu: bundle tự biết nó đang ở đâu, stack gì, và refs nào gãy — không cần sửa tay.

## Bước 1 — Detect stack + generate repo-facts

```bash
node .claude/tools/generate-repo-facts.js
```

Sinh ra:
- `.claude/repo-facts.md` — facts cho agent đọc (stack, CI, migrations, corpus)
- `.claude/repo-facts.json` — data máy đọc, `check-references.js` dùng để resolve repo-root contracts

## Bước 2 — Validate refs trong bundle (warn-only)

```bash
node .claude/tools/check-references.js
```

Báo: command/agent/skill không tồn tại, phantom tool names, path gãy, repo-root contract thiếu.
**warn-only** — không chặn. Đọc và tự quyết cái nào cần sửa.

## Bước 3 — Đọc kết quả và đề xuất

Đọc `.claude/repo-facts.json`, rồi tóm tắt cho user:

1. **Stack phát hiện** — backend/frontend framework, package manager, compose services, CI jobs.
2. **Skill không khớp stack** — liệt kê skill *generic/quarantine* mà stack hiện tại không dùng tới
   (đọc các dòng `QUARANTINE NOTICE` trong `.claude/skills/*/SKILL.md`). Đề xuất tắt/xóa.
3. **Refs gãy cần xử lý** — nhóm `repo-root-ref` (agent viết theo contract `./docs`, `./plans`)
   là *expected* nếu project chưa có các thư mục đó; nhóm `phantom-tool` / `path` là thật, cần sửa.
4. **Hook paths** — xác nhận `.claude/settings.json` dùng `$CLAUDE_PROJECT_DIR` (portable sẵn).

## Bước 4 — (tuỳ chọn) cài deps của skill

Nếu project cần các skill có script (chrome-devtools, sequential-thinking, ...):

```bash
bash .claude/skills/install.sh
```

Script này cài system deps + node deps + python venv. Chỉ chạy khi user xác nhận.

---

**Lưu ý:** `generate-repo-facts.js` resolve project root từ vị trí file (`__dirname/../..`),
nên bundle copy đi đâu cũng chạy đúng — không có path hardcode.

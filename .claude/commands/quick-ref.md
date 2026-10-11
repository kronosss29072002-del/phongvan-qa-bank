---
description: Generate a one-page reference cheatsheet for this bundle — agents, commands, skills with status
allowed-tools: Bash, Read, Glob, Grep, Write
---

# /quick-ref — Bundle one-page cheatsheet

Sinh nhanh một trang tham chiếu cho bundle hiện tại — để nhìn overview trong 1 scroll, tiện cả khi đem bundle sang project mới.

## Bước 1 — Thu thập data

```bash
# Agents
ls .claude/agents/*.ts.md | while read f; do
  name="${f##*/}"; name="${name%.ts.md}"
  desc=$(grep -m1 "^description:" "$f" | cut -c14- | cut -c1-100)
  echo "agent|$name|$desc"
done

# Commands
ls .claude/commands/*.md | while read f; do
  name="${f##*/}"; name="${name%.md}"
  desc=$(grep -m1 "^description:" "$f" | cut -c14- | cut -c1-80)
  echo "cmd|$name|$desc"
done

# Skills
ls -d .claude/skills/*/ 2>/dev/null | while read d; do
  name="$(basename "$d")"
  status="active"
  if [ -f "$d/SKILL.md" ] && grep -q "QUARANTINE NOTICE" "$d/SKILL.md"; then status="quarantine"; fi
  if [ ! -f "$d/SKILL.md" ]; then status="no-SKILL.md"; fi
  echo "skill|$name|$status"
done
```

Lưu vào /tmp/bundle-ref-data.txt.

## Bước 2 — Generate nội dung

Trình bày thành 3 section (dùng agent `docs-manager` nếu cần, hoặc tự viết):

### 🧠 Agents (n/25)
Bảng: `| Agent | Khi nào dùng |` — description truncate 80 chars, dấu `→` cho override relationships.

### 🎯 Commands (n/75)
Group by category: `qa*`, `generate*`, `git:`, `bootstrap*`, misc. Chỉ liệt kê tên + description truncate 60 chars — đủ để biết command nào tồn tại.

### 📚 Skills (n/51)
Bảng: `| Skill | Status | Notes |`
- `active` = có SKILL.md + resources
- `quarantine` = generic/vendored, REPO AGENTS WIN
- `no-SKILL.md` = directory nhưng không phải skill operational

## Bước 3 — Output

Write ra:
- Markdown: `.claude/refs/BUNDLE-REFERENCE.md` (tracked, update thủ công khi bundle thay đổi)
- Hoặc HTML: `.claude/refs/BUNDLE-REFERENCE.html` (render trong browser)

Nếu `.claude/refs/` chưa tồn tại, tự tạo directory.

**Lưu ý:** status "quarantine" nên đọc thêm SKILL.md first-15-lines để xác nhận notice thật sự nói gì — đừng chỉ dựa vào grep.
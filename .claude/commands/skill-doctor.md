---
description: Validate skill structure — SKILL.md frontmatter, resources/ paths, quarantine notices, thin skills
allowed-tools: Bash, Read, Glob, Grep
---

# /skill-doctor — Skill structure validator

Chạy khi: tạo skill mới, edit skill cũ, hoặc trước khi copy bundle sang project khác.

## Bước 1 — Inventory skills

```bash
ls -d .claude/skills/*/ | wc -l
```

## Bước 2 — Validate từng skill directory

```bash
for d in .claude/skills/*/; do
  name="$(basename "$d")"
  echo "── $name"
  # SKILL.md existence
  if [ ! -f "$d/SKILL.md" ]; then echo "  ✗ NO SKILL.md"; else
    echo "  ✓ SKILL.md"
    # Frontmatter check
    head -5 "$d/SKILL.md" | grep -q '^---' && echo "  ✓ frontmatter" || echo "  ✗ NO frontmatter"
    # name field
    grep -m1 '^name:' "$d/SKILL.md" >/dev/null && echo "  ✓ name field" || echo "  ✗ NO name field"
    # description field + length
    desc_len=$(grep -m1 '^description:' "$d/SKILL.md" | wc -c)
    echo "  desc length: $desc_len chars $([ $desc_len -gt 500 ] && echo '⚠️ >500 TOO LONG' || echo '✓ ok')"
    # Quarantine notice
    head -15 "$d/SKILL.md" | grep -q 'QUARANTINE' && echo "  ⚠️ QUARANTINE notice" || echo "  ✓ no quarantine"
  fi
  # resources/ directory
  [ -d "$d/resources" ] && echo "  ✓ resources/" || echo "  ⚠️ thin — no resources/ ($([ -d "$d/scripts" ] && echo 'has scripts' || echo 'no scripts either'))"
  # scripts/ directory
  [ -d "$d/scripts" ] && echo "  ✓ scripts/" || true
  # broken resource links
  if [ -f "$d/SKILL.md" ]; then
    grep -oP '(?<=resources/)[a-z0-9_-]+\.md' "$d/SKILL.md" | while read r; do
      [ -f "$d/resources/$r" ] || echo "  ✗ broken link: resources/$r"
    done
  fi
done
```

## Bước 3 — Cross-check với check-references.js

```bash
node .claude/tools/check-references.js 2>&1 | grep "type: 'skill'"
```

Bất kỳ skill nào bị flag là broken (không tồn tại trong skills/) → xóa ref hoặc sửa tên.

## Bước 4 — Report

Tổng hợp thành:

```
Skill Doctor: {n} skills checked
- {broken} missing SKILL.md
- {no_fm} missing frontmatter
- {longdesc} description >500 chars
- {thin} no resources/ (thin skills)
- {quarantine} with quarantine notice
- {broken_links} broken resource links

Detail: {list per skill above}
```

**Critical (fix ngay):** missing SKILL.md, missing frontmatter, broken links.

**Warning (nên fix):** description >500 (truncate), thin skill (thêm resources/ hoặc gộp vào skill khác — Defer factoring rule: chỉ khi 3+ lần lặp mới cần tách).

**Info:** quarantine notice là intentional (vendored generic skills) — không phải bug.
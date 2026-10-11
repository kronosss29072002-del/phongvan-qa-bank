---
description: Audit entire .claude bundle health — broken refs, missing resources, quarantine staleness, path issues
allowed-tools: Bash, Read, Glob, Grep, Agent
---

# /bundle-health — Bundle health audit

Chạy khi: bundle mới copy, sau khi thêm/sửa skill/agent/command, hoặc định kỳ.

## Bước 1 — Chạy check-references.js

```bash
node .claude/tools/check-references.js 2>&1
```

Parse output thành breakdown theo type. Flag `repo-root-ref > 20` = bundle thiếu docs/ plans/ hoặc agent viết contract sai.

## Bước 2 — Audit agents

```bash
ls .claude/agents/*.ts.md | wc -l
```

Mỗi agent file kiểm tra:
1. Frontmatter có `name` + `description` không (parse `---` block)
2. Description length: >500 chars = quá dài, nên truncate
3. Body có mention tool name không tồn tại không (grep phantom tools)
4. Có `model:` assignment không (mặc định là sonnet)
5. Summary: bao nhiêu agents, broken refs, phantom tools

## Bước 3 — Audit skills

```bash
ls -d .claude/skills/*/ | while read d; do
  echo "$(basename $d): $(ls $d/SKILL.md 2>/dev/null && echo 'has-SKILL.md' || echo 'NO-SKILL.md')"
done
```

Mỗi skill directory kiểm tra:
1. Có `SKILL.md` không (không có = skill non-functional)
2. SKILL.md có frontmatter (name + description) không
3. Có quarantine notice không (read first 15 lines)
4. Có `resources/` directory không (skill chỉ có SKILL.md = thin skill)
5. Có `scripts/` directory không (nếu có scripts, check package.json exists)
   - **THIN** = KHÔNG có resources/ **VÀ** KHÔNG có scripts/ (thiếu cả 2). Có 1 trong 2 = không thin.
6. Description length >500 chars = quá dài

## Bước 4 — Audit hooks wiring

```bash
cat .claude/settings.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('hooks',{})), 'hook types')"
```

Kiểm tra:
1. Mỗi hook path trong settings.json có file tồn tại không
2. Hook types có đầy đủ (PreToolUse, PostToolUse, Stop) không
3. Có hook nào disabled không (commented out hoặc missing)

## Bước 5 — Audit commands

```bash
ls .claude/commands/*.md | wc -l
```

Kiểm tra:
1. Mỗi command file có frontmatter (description) không
2. Description length: >200 chars = quá dài cho slash command
3. Có command nào trỏ tới file không tồn tại không

## Bước 6 — Composite health score

Tính:
- `score = 100 - (critical*5 + warning*2 + info*1)`
- Critical: broken agent/skill/command refs, missing frontmatter
- Warning: quarantine stale, description too long, missing resources
- Info: repo-root-ref, phantom-tool in meta-docs

Report format:
```
Bundle Health: {score}/100

Agents: {count} total, {broken} broken refs
Skills: {count} total, {no_skillmd} missing SKILL.md, {thin} thin (no resources/)
Commands: {count} total, {no_frontmatter} missing frontmatter
Hooks: {count} types wired, {missing} missing files

Critical (fix now): {list}
Warning (should fix): {list}
Info (FYI): {list}
```

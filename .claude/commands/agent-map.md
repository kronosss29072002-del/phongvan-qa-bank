---
description: Visualize agent ecosystem — overrides, dependencies, when to use which agent
allowed-tools: Bash, Read, Glob, Grep
---

# /agent-map — Agent ecosystem visualization

Chạy khi: cần hiểu agent nào override skill nào, dependencies giữa agents, hoặc khi nào dùng agent A vs agent B.

## Bước 1 — Extract agent metadata

```bash
for f in .claude/agents/*.ts.md; do
  name="$(basename "$f" .ts.md)"
  desc=$(grep -m1 '^description:' "$f" | cut -c14-)
  model=$(grep -m1 '^model:' "$f" | cut -c8- || echo 'sonnet')
  echo "$name|$model|$desc"
done > /tmp/agents-meta.txt
```

## Bước 2 — Find override relationships

```bash
# Agents that mention "override" or "WIN" in their description
grep -l "override\|WIN ALL CONFLICTS" .claude/agents/*.ts.md | while read f; do
  name="$(basename "$f" .ts.md)"
  echo "$name overrides repo-specific patterns"
done

# Agents that complement each other
grep -l "complement\|Not for.*use" .claude/agents/*.ts.md | while read f; do
  name="$(basename "$f" .ts.md)"
  grep -oP '(?<=use )[a-z-]+(?=\))' "$f" | sort -u | while read other; do
    echo "$name → delegates to $other"
  done
done
```

## Bước 3 — Find skill overrides

```bash
# Agents that mention specific skills they override
for f in .claude/agents/*.ts.md; do
  name="$(basename "$f" .ts.md)"
  grep -oP '(?<=override )[a-z-]+(?= skill)' "$f" | while read skill; do
    echo "$name overrides skill: $skill"
  done
done
```

## Bước 4 — Build dependency graph

Parse "Not for X (use Y)" patterns:

```bash
for f in .claude/agents/*.ts.md; do
  name="$(basename "$f" .ts.md)"
  # Extract "Not for X (use Y)" patterns
  grep -oP 'Not for [^(]+\(use [a-z-]+\)' "$f" | while read line; do
    delegate=$(echo "$line" | grep -oP '(?<=use )[a-z-]+')
    scope=$(echo "$line" | cut -d'(' -f1 | cut -c9-)
    echo "$name|$delegate|$scope"
  done
done > /tmp/agent-deps.txt
```

## Bước 5 — Visualize

Generate markdown table or Mermaid diagram:

### Agent Override Map

| Agent | Overrides | Complements | Delegates to |
|-------|-----------|-------------|--------------|
| prisma-db-specialist | generic database-admin | sql-schema-migration-specialist | — |
| frontend-react | generic frontend-development | perf-optimizer, ui-ux-designer | — |
| nestjs-api-architect | generic backend-development | rest-api-designer | — |

### When to Use Which

**Database work:**
- Schema/migrations → `prisma-db-specialist`
- Migration safety review → `sql-schema-migration-specialist`
- Raw SQL/tuning → `database-admin` or `database-query-performance`
- Data analysis → `data-analyst`

**Frontend work:**
- React components/pages → `frontend-react`
- Performance optimization → `perf-optimizer`
- Accessibility → `accessibility-auditor`
- Visual design → `ui-ux-designer`
- Mobile/responsive → `mobile-web-eng`

**Backend work:**
- NestJS architecture → `nestjs-api-architect`
- REST API design → `rest-api-designer`
- Security review → `security-reviewer`
- CI/CD → `cicd-workflow-engineer`
- Docker/deploy → `docker-devops-engineer`

**Content work:**
- Blog content → `ai-content-eng`
- SEO/metadata → `seo-content-analyst`
- i18n → `i18n-localization-specialist`

**QA work:**
- Playwright e2e → `playwright-qa-automation`
- Flaky tests → `playwright-stability-engineer`
- Frontend test coverage → `ui-testing-coverage`
- API contract tests → `api-contract-tester`

## Bước 6 — Output

Write to `.claude/refs/AGENT-MAP.md` (create `.claude/refs/` if missing).

Include:
1. Agent count + model distribution
2. Override relationships (agent → skill)
3. Delegation graph (agent → agent)
4. Decision tree (when to use which)
5. Mermaid diagram (optional, if user wants visual)

**Note:** agents với `model: sonnet` là default; agents không có `model:` field cũng dùng sonnet. Chỉ agents với `model: opus` hoặc `model: haiku` là khác.
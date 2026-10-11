# 🗺️ AGENT-MAP — Agent ecosystem

> Generated 2026-09-17 · 41 agents · all model: sonnet

## Delegation (Not-for → use)

| Agent | Delegates to |
|---|---|
| `accessibility-auditor` | `playwright-qa-automation` |
| `ai-content-eng` | `seo-content-analyst` |
| `architecture-doc-writer` | `docs-manager` |
| `bi-reporting-analyst` | `prisma-db-specialist` |
| `database-query-performance` | `prisma-db-specialist` |
| `nestjs-api-architect` | `prisma-db-specialist` |
| `prisma-db-specialist` | `nestjs-api-architect` |

## Override map (repo-specific agents vs generic skills)

> Quarantine mechanics: vendored generic skills (backend-development, frontend-development) đều có QUARANTINE NOTICE — **REPO AGENTS + rules/ WIN ALL CONFLICTS**: dùng `nestjs-api-architect` / `prisma-db-specialist` / `frontend-react`... thay vì đọc generic skill thắng.

| Domain | Repo agent (WIN) | Generic skill (quarantine) |
|---|---|---|
| Backend | `nestjs-api-architect`, `rest-api-designer` | `backend-development` |
| Data | `prisma-db-specialist`, `sql-schema-migration-specialist` | `databases` skill |
| Frontend | `frontend-react`, `ui-ux-designer` | `frontend-development` |
| QA | `playwright-qa-automation` | `qa` related skills |

## Decision tree

### Database work
- Schema/migrations → `prisma-db-specialist`
- Migration safety review → `sql-schema-migration-specialist`
- Raw SQL/tuning → `database-query-performance`
- Ops/backup → `database-admin`; data questions → `data-analyst`

### Frontend work
- React pages/components → `frontend-react`
- Perf → `perf-optimizer`; a11y → `accessibility-auditor`; design → `ui-ux-designer`; mobile → `mobile-web-eng`

### Backend work
- NestJS architecture → `nestjs-api-architect`
- REST contract → `rest-api-designer`
- Security → `security-reviewer`; CI/CD → `cicd-workflow-engineer`; Docker → `docker-devops-engineer`

### Content & docs
- Blog → `ai-content-eng`; SEO → `seo-content-analyst`; i18n → `i18n-localization-specialist`
- Arch docs → `architecture-doc-writer`; specs → `spec-writer`; repo docs → `docs-manager`

### QA
- Playwright e2e → `playwright-qa-automation`; flaky → `playwright-stability-engineer`
- Coverage frontend → `ui-testing-coverage`; API contract → `api-contract-tester`; backend tests → `tester`

### Cross-cutting
- Debug → `debugger`; locate code → `scout`; externals → `scout-external`
- Plan → `planner` / `project-manager`; release → `release-manager`
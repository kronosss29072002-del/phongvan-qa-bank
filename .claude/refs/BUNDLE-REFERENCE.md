# 📋 Bundle Reference — portable .claude kit

> Generated 2026-09-17 · 25 agents · 78 commands · 51 skill dirs · 3 hooks · 0 phantom tools

## 🧠 Agents (25) — model: sonnet (all)

| Agent | Khi nào dùng |
|---|---|
| `accessibility-auditor` | Use this agent when auditing or fixing accessibility in this project's React frontend —  |
| `ai-content-eng` | Use this agent when you need to write, plan, or review long-form technical blog content fo |
| `api-contract-tester` | Use this agent when you need to verify or expand the RealWorld API contract of this projec |
| `architecture-doc-writer` | Use this agent when you need to produce or keep architecture documentation for this projec |
| `bi-reporting-analyst` | Use this agent to turn the project blog/database data into reports or dashboards — SQL a |
| `cicd-security-hardening` | Use this agent when you need CI/CD and artifact supply-chain security hardening for this p |
| `cicd-workflow-engineer` | Use this agent when you need GitHub Actions CI/CD for this monorepo — writing or fixing  |
| `data-analyst` | Use this agent when you need to analyze or report on the project Postgres 16 data — blog |
| `database-query-performance` | Use this agent when you need raw-SQL / tuning work on the project's PostgreSQL 16 — EXPL |
| `docker-devops-engineer` | Use this agent when you need containerization, deployment, or observability work for this  |
| `frontend-react` | Use this agent when you need to build, extend, or review React 19 + Vite + Tailwind 4 + Ta |
| `i18n-localization-specialist` | Use this agent when you need to add, fix, or audit vi/en localization in the project front |
| `mobile-web-eng` | Use this agent when you need to audit or improve the responsive/mobile experience of the p |
| `nestjs-api-architect` | Use this agent when you need to design, review, or extend NestJS API architecture in this  |
| `perf-optimizer` | Use this agent when you need performance work on the project's frontend — Web Vitals (LC |
| `playwright-qa-automation` | Use this agent when you need to author, review, or scaffold Playwright E2E tests for this  |
| `playwright-stability-engineer` | Use this agent when a Playwright test in this project is flaky or failing — reproduce it |
| `prisma-db-specialist` | Use this agent when you need Prisma/PostgreSQL work in this repo — editing prisma/schema |
| `release-manager` | Use this agent when you need to version, package, or plan a release for this project — s |
| `rest-api-designer` | Use this agent when you need REST/API contract design or review in this repo — endpoint  |
| `security-reviewer` | Use this agent when you need an OWASP-minded security review of this project (NestJS/React |
| `seo-content-analyst` | Use this agent when you need to improve content SEO and search metadata for this project � |
| `spec-writer` | Use this agent when you need a technical spec written for this repo — a PRD, feature spe |
| `sql-schema-migration-specialist` | Use this agent when you need Prisma/Postgres migration SAFETY review for this project data |
| `ui-testing-coverage` | Use this agent when you need to measure and lift FRONTEND test coverage in this project � |

## 🎯 Commands (78)

### bootstrap

- `/bootstrap/auto/fast` — ⚡⚡⚡ Quickly bootstrap a new project automatically
- `/bootstrap/auto` — ⚡⚡⚡⚡ Bootstrap a new project automatically

### content

- `/content/cro` — Analyze the current content and optimize for conversion
- `/content/enhance` — Analyze the current copy issues and enhance it
- `/content/fast` — Write creative & smart copy [FAST]
- `/content/good` — Write good creative & smart copy [GOOD]

### cook

- `/cook/auto/fast` — ⚡ No research. Only scout, plan & implement ["trust me bro
- `/cook/auto` — ⚡⚡ Implement a feature automatically ("trust me bro")

### design

- `/design/3d` — Create immersive interactive 3D designs with Three.js
- `/design/describe` — Describe a design based on screenshot/video
- `/design/fast` — Create a quick design
- `/design/good` — Create an immersive design
- `/design/screenshot` — Create a design based on screenshot
- `/design/video` — Create a design based on video

### docs

- `/docs/init` — ⚡⚡⚡⚡ Analyze the codebase and create initial documen
- `/docs/summarize` — ⚡ Analyze the codebase and update documentation
- `/docs/update` — ⚡⚡⚡ Analyze the codebase and update documentation

### fix

- `/fix/ci` — ⚡ Analyze Github Actions logs and fix issues
- `/fix/fast` — ⚡ Analyze and fix small issues [FAST]
- `/fix/hard` — ⚡⚡⚡ Use subagents to plan and fix hard issues
- `/fix/logs` — ⚡ Analyze logs and fix issues
- `/fix/test` — ⚡⚡ Run test suite and fix issues
- `/fix/types` — ⚡ Fix type errors
- `/fix/ui` — ⚡⚡ Analyze and fix UI issues

### git

- `/git/cm` — Stage all files and create a commit.
- `/git/cp` — Stage, commit and push all code in the current branch
- `/git/pr` — Create a pull request

### integrate

- `/integrate/polar` — ⚡⚡ Implement payment integration with Polar.sh
- `/integrate/sepay` — ⚡⚡ Implement payment integration with SePay.vn

### misc

- `/agent-map` — Visualize agent ecosystem — overrides, dependencies, when 
- `/analyze_flaky_tests` — Phân tích automation tests không ổn định (flaky), x�
- `/analyze_requirement_document` — Phân tích requirement document (Jira ticket, .doc, user st
- `/ask` — ⚡ Answer technical and architectural questions.
- `/bootstrap` — ⚡⚡⚡⚡⚡ Bootstrap a new project step by step
- `/brainstorm` — ⚡⚡ Brainstorm a feature
- `/bundle-health` — Audit entire .claude bundle health — broken refs, missing 
- `/code` — ⚡ Start coding & testing an existing plan
- `/cook` — ⚡⚡⚡ Implement a feature [step by step]
- `/debug` — ⚡⚡ Debugging technical issues and providing solutions.
- `/fetch_jira_requirements` — Lấy Requirements / User Stories từ Jira ticket và lưu 
- `/fix` — ⚡⚡ Analyze and fix small issues [AUTO DETECT COMPLEXITY]
- `/generate_api_tests_from_swagger` — Sinh API test cases và automation scripts từ Swagger/Open
- `/generate_application_test_plan` — Khám phá ứng dụng web, sinh test plan và test scenari
- `/generate_automation_framework` — Thiết kế và scaffold automation framework hoàn chỉnh
- `/generate_automation_from_testcases` — Convert manual test cases into automation scripts autonomous
- `/generate_automation_from_ui_flow` — Thực thi UI flow trực tiếp trên browser, thu thập l
- `/generate_combinatorial_test_data` — Sinh test data cho ma trận kết hợp đa chiều bằng 
- `/generate_cross_module_test_plan` — Phân tích tính năng đi qua nhiều modules nối tiếp
- `/generate_locator` — Sinh locator ổn định cho UI element. Hỗ trợ Playwri
- `/generate_manual_testcases_rbt` — Sinh manual test cases chất lượng cao theo quy trình A
- `/generate_requirements_from_website` — Generate Requirements content from a provided website module
- `/generate_testcases_from_requirements` — Sinh manual test cases nhanh từ requirements (QUICK mode �
- `/generate_test_data` — Sinh test data có cấu trúc, unique, traceable cho test c
- `/import_test_results_xray` — Đẩy kết quả test automation (Playwright/JUnit/Allure)
- `/journal` — ⚡ Write some journal entries.
- `/plan` — ⚡⚡⚡ Intelligent plan creation with prompt enhancement
- `/portable` — Bootstrap this .claude bundle into the current project — r
- `/qa-flow` — Điều phối toàn bộ flow QA/QC 6 phase (Strategy → P
- `/qa-full` — Chạy full QA workflow A-Z: data seeding → functional →
- `/quick-ref` — Generate a one-page reference cheatsheet for this bundle —
- `/report-bug` — Tạo bug report chuẩn "good bug report" (repro steps, err
- `/scout` — ⚡⚡ Scout given directories to respond to the user's requ
- `/skill-doctor` — Validate skill structure — SKILL.md frontmatter, resources
- `/test` — ⚡ Run tests locally and analyze the summary report.
- `/use-mcp` — Utilize tools of Model Context Protocol (MCP) servers
- `/watzup` — ⚡ Review recent changes and wrap up the work

### plan

- `/plan/ci` — Analyze Github Actions logs and provide a plan to fix the is
- `/plan/cro` — Create a CRO plan for the given content
- `/plan/fast` — ⚡⚡ No research. Only analyze and create an implementatio
- `/plan/hard` — ⚡⚡⚡ Research, analyze, and create an implementation pl
- `/plan/two` — ⚡⚡⚡⚡ Research & create an implementation plan with 2

### review

- `/review/codebase` — ⚡⚡⚡ Scan & analyze the codebase.

### scout

- `/scout/ext` — ⚡ Use external agentic tools to scout given directories

### skill

- `/skill/add` — Add new reference files or scripts to a skill
- `/skill/create` — Create a new agent skill
- `/skill/fix-logs` — Fix the agent skill based on `logs.txt` file.
- `/skill/optimize/auto` — Optimize an existing agent skill [auto]
- `/skill/optimize` — Optimize an existing agent skill

## 📚 Skills (51)

| Skill | Status |
|---|---|
| `aesthetic` | active (thin) |
| `ai-multimodal` | active |
| `backend-development` | quarantine (thin) |
| `better-auth` | active |
| `bug_report` | active (thin) |
| `chrome-devtools` | active |
| `claude-code` | active (thin) |
| `cloud-infrastructure` | active (thin) |
| `code-review` | active (thin) |
| `common` | no-SKILL.md |
| `cross_branch_qa` | active (thin) |
| `databases` | active |
| `debugging` | active |
| `deep-budget-mode` | active |
| `devops` | active |
| `docs-seeker` | active |
| `document-skills` | optional vendored bundle (source-available, proprietary — not part of the OSI tree) |
| `flaky_test_analyzer` | active (thin) |
| `framework_architect` | active (thin) |
| `frontend-design` | active (thin) |
| `frontend-development` | quarantine |
| `google-adk-python` | active (thin) |
| `jira_integration` | active |
| `llm-app-dev` | active (thin) |
| `locator_healer_agent` | active (thin) |
| `mcp-builder` | active |
| `mcp-management` | active |
| `media-processing` | active |
| `ml-model-training` | active (thin) |
| `mobile-development` | active (thin) |
| `nestjs-backend` | active (thin) |
| `payment-integration` | active |
| `planning` | active (thin) |
| `problem-solving` | active (thin) |
| `qa_automation_engineer` | active (thin) |
| `qa_flow_orchestrator` | active (thin) |
| `rbt_manual_testing` | active (thin) |
| `repomix` | active |
| `requirements_analyzer` | active (thin) |
| `research` | active (thin) |
| `sbtm_exploratory` | active (thin) |
| `sequential-thinking` | active |
| `shopify` | active |
| `skill-creator` | active |
| `smart_locator_agent` | active (thin) |
| `template-skill` | active (thin) |
| `test_data_generator` | active (thin) |
| `threejs` | active (thin) |
| `ui-styling` | active |
| `ui_debug_agent` | active (thin) |
| `web-frameworks` | active |
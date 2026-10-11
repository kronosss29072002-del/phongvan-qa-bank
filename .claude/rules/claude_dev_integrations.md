# 🔌 Claude Dev Integrations — Bản đồ hệ sinh thái + các gì đã tích hợp

> **Trạng thái:** v1.5.1 (2026-09-18) — v1.5.0 + revert document-skills (source-available proprietary, không OSI — moved to `/tmp/document-skills-backup-20260918/` để giữ repo 100% OSI; khôi phục bằng `mv` nếu đổi ý). **Implement pass 4 (2026-09-18):** ~~document-skills~~ (reverted same day) · anti-rationalization tables (`.claude/rules/anti_rationalization.md` — bảng lý-do-bào-chữa × phản-biện theo pattern addyosmani/agent-skills 95.9k★, áp dụng mọi agent/subagent) · Composio MCP pilot (`.mcp.json.example` thêm entry `_composio-pilot` commented-out — hosted endpoint `https://backend.composio.dev/v3/mcp/{SERVER_ID}?user_id={USER_ID}` + header `x-api-key`, 1000+ pre-authenticated toolkits, chưa bật chờ user opt-in). **Implement pass trước:** agnix (global npm `install.sh` + `.github/workflows/agnix.yml` — `agent-sh/agnix@v0` target claude-code, warn-only `continue-on-error: true`) · cctop (standalone binary install trong `install.sh` — install_cctop() curl-cài checksum-verified vào `~/.local/bin`) · claude-code-action (`.github/workflows/claude.yml` — `anthropics/claude-code-action@v1`, OAuth token path, triggers issue_comment/PR-review/issues-assigned). **Ecosystem re-scan (wf_5a28e97b-eb1, 97 agents, 3-0 verified):** 5 adopt-now có evidence (agnix linter CLAUDE.md/SKILL.md/hooks; cctop TUI session monitor read-only zero-dep; anthropics/claude-code-action 8.9k★ MIT official; sentry-mcp error tracking — **license FSL-1.1-ALv2 không phải OSI → chờ policy review**; plugin eval first-party) · promote DBHub (80 npm releases, 1.2.5 2026-09-15, official docs example) + SkillSpector MCP (passive-only, no exec) từ adopt-later · drop claude-code-otel (4 commits/15 months) + tomevault-io/lint-action (0★, 3 ngày tuổi, npx runtime download) · Trail of Bits skills marketplace 7.1k★ (44 security plugins) → adopt-later cần security review (arbitrary code surface). **Coverage pass 2:** tạo ml-model-training (PyTorch 2/Keras 3, data pipelines, training-ops/MLflow+Optuna, inference-serving/ONNX+quant) khép gap AI/ML training cuối cùng — wf_e98ac091-d1f: 6 writer songsong + audit tự động bắt 3 bug thật (walrus checkpoint always-False dead code, MNIST NameError, 5-vs-10 epoch mismatch) → fix xong, 6 file ≤100 dòng, links resolve. v1.2.0 = v1.1.3 + structural audit pass (2026-09-17): phát hiện + fix 3 issue thật — google-adk-python SKILL.md thiếu frontmatter → không bao giờ auto-activate (đã thêm frontmatter); claude-code dùng skill.md lowercase → rename SKILL.md theo convention; mcp-management deps thiếu npm install → đã install (0 vulns). Audit regex v1 bắt nhầm (deep-budget-mode/mcp-management refs đều tồn tại, skill-creator finance/mnda/policies/api_docs/schema là ví dụ doc, chrome-devtools/jira node_modules có thật) → đã xác nhận từng cái trước khi fix. **Coverage pass:** 3 skills mới lấp gap thật (cloud-infrastructure AWS/Terraform · nestjs-backend · llm-app-dev) do wf_8b80a24d-d4c tạo. v1.1.3 = structural integrity pass: 15 dangling refs selenium/appium_rules.md xóa/thay (6 files, wf_691758d3-17f) · tạo command report-bug.md (73 command) · catalog scan_skills.py fix cwd-bug → 49 entries (thêm cả YAML writer) · install.sh + payment-integration + docs-seeker block (5/5) · skill-creator rotate_pdf.py ref → quick_validate.py thật · jira_integration 5 scripts mới + .env.example + npm lockfile · deep-budget-mode href fix · web-frameworks/devops doc naming fix (underscore + argparse real).
> **Người duy trì:** dev (kronosss2002)
> **Nguồn số liệu:** api.github.com + repo pages fetched 2026-09-15. Star counts chỉ ghi khi thấy trong content fetched.

## 1. BỐI CẢNH

Skill repo đã có hạ tầng Claude Code tự viết khá đầy đủ:
- **41 agent** (`.claude/agents/*.ts.md`), agent registry, 73 slash command, skills dir tự cài (INSTALLATION.md + install.sh).
- **53 skills** (sau khi thêm cloud-infrastructure, nestjs-backend, llm-app-dev, ml-model-training — wf_8b80a24d-d4c + wf_e98ac091-d1f).
- **Hook stack** (gitignored, machine-local): `scout-block` PreToolUse · `slop-guard` + `injection-guard` PostToolUse warn-only · `check_budget` Stop.
- **rules/** auto-injected mỗi session: Playwright QA rules (nghiêm cấm waitForTimeout, web-first assertions, POM) + anti_slop.
- **MCP đang dùng:** context7 (docs), playwright, chrome-devtools, github (remote http). `.mcp.json` machine-local (gitignored), có `.example` template tracked.
- **CI:** `.github/workflows/ci.yml` — backend lint `--no-fix`, 3-stage typecheck, seed-transform audit; frontend typecheck.

Vì vậy research này **không** phải "tìm gì để thêm" mà là: (1) verify khoảng trống thật, (2) đối chiếu với từng tool phổ biến xem có trùng hạ tầng đã có, (3) chỉ đề xuất thứ lấp đúng lỗ hổng.

## 2. KẾT LUẬN — ĐÃ TÍCH HỢP (ADOPT)

| # | Gì | Loại | Nơi | Chi tiết |
|---|-----|------|-----|----------|
| 1 | **Secret-leak scanner** | tool + CI job | `.claude/tools/check-token-leak.sh` | Zero-dependency (grep+git) scanner: khớp `sk-ant-…`, `sk-proj-…`, `gh[pousr]_…`, `github_pat_…`, `xox…`, `AKIA`, `AIza`, `glpat-…`, private key headers, `Bearer `+token. Loại placeholder (YOUR_/EXAMPLE/xxx/test/…), binary, `.env.example`, spec/test files. Modes: `all` (working tree) / `--staged`. Warn-only exit code — không chặn commit. CI job chạy `--staged` trên mỗi push (xem §4). |
| 2 | **Hooks schema-diff pass** | doc | — | Hooks là first-party, đang load-bearing (3 hooks chạy mỗi session). Bảo trì: mỗi ~tháng check lại [official hooks docs](https://code.claude.com/docs/en/hooks) cho stdin JSON shape thay đổi (như release 2.1.x), chạy smoke test 3 hook (đã chạy hôm nay: slop-guard 5 findings exit 0; check-token-leak regression 5-test 5/5 — bản trước 2026-09-17 luôn "sạch" vì bug, xem v1.1.1 ở header). |
| 3 | **Changelog habit** | practice | — | Claude Code 2.1 line phát hành gần như hằng tuần; đọc [changelog](https://code.claude.com/docs/en/changelog) + [MCP docs](https://code.claude.com/docs/en/mcp) thay đổi mỗi tuần. Điểm thật: streaming HTTP cho remote MCP, `claude mcp login` OAuth, size override. |
| 4 | **`.mcp.json.example` fixed** | config | `.claude/.mcp.json.example` | Đổi github server từ `@modelcontextprotocol/server-github` (archived!) → `@github/mcp-server` chính thức. |
| 5 | **Vendored docs fixed** | doc | `.claude/skills/claude-code/references/{mcp-integration,troubleshooting}.md` | Đồng bộ 3 chỗ: package name + env `GITHUB_PERSONAL_ACCESS_TOKEN` (không còn `GITHUB_TOKEN` cho MCP). |
| 6 | **GitHub MCP → remote http endpoint** | config | `.claude/.mcp.json` (+ `.example` + vendored docs) | `github` server đổi từ `npx -y @github/mcp-server` (local process, supply chain mỗi lần chạy) → `{"type":"http","url":"https://api.githubcopilot.com/mcp/"}` (GitHub-hosted, không download code). Token qua env `GITHUB_PERSONAL_ACCESS_TOKEN`. Read-only cho review agents: header `X-MCP-Readonly: true` hoặc token rỗng. |
| 7 | **injection-guard hook (self-authored)** | hook | `.claude/hooks/injection-guard.js` | PostToolUse warn-only chống indirect prompt injection (pattern taxonomy từ lasso-security patterns.yaml, port self-authored theo repo policy). Quét *.md/*.txt/*.yml khi Write/Edit; strip code fences + meta-discussion context; ghi `injection-hits.log`. Đã test 13/13 case. |
| 8 | **scout-block hardened** | hook | `.claude/hooks/scout-block.js` | Thêm LỚP 2 (destructive git: push --force, reset --hard, clean -f, rm -rf, branch -D...) + LỚP 3 (sensitive files: .env*, .ssh, .aws, keys, credentials). Fix FP LỚP 1 cũ (grep "node_modules" từng bị chặn oan — giờ chỉ chặn khi lệnh THỰC SỰ thao tác). Đã test 31/31 case. |
| 9 | **SkillSpector audit (one-shot)** | process | `/tmp/ss-scan/*.json` + summary | v2.11.2 scan toàn bộ skills dir `--no-llm`. Kết quả: 5217 issues/44 skills (21 DO_NOT_INSTALL nhưng đa số FP docs: PE3 .env examples, SC9 vendored node_modules, E1 example URLs). **1 issue thật:** chrome-devtools SC4 — extract-zip CVE-2026-19693 (verified OSV) → **npm audit fix xong, 0 vuln**. Gợi ý gate: chạy `skillspector mcp` khi install skill mới, CAUTION→prompt / DO_NOT_INSTALL→block sau khi calibrate FP. |
| 10 | **jira_integration scripts** | code | `.claude/skills/jira_integration/scripts/integrations/` | 4 Node.js scripts (jira_fetcher, xray_auth, xray_importer, utils) + package.json (axios+dotenv) + .env.example + .gitignore. Đầy đủ truncate: Jira Cloud/Server auth, ADF→plain-text, pagination, Playwright/JUnit/Allure import vào Xray (Cloud v2 / Server Raven v1), dry-run, `[KEY]` test mapping. Test end-to-end qua HTTP stub + fixtures. |
| 11 | **agnix** ✅ | linter + CI | `.github/workflows/agnix.yml` + `install.sh` global npm | **Implemented.** `agent-sh/agnix@v0` target `claude-code`, warn-only (`continue-on-error: true`). 456 rules lint CLAUDE.md, SKILL.md, hooks, MCP config. MIT/Apache-2.0. Zero server. Fills gap: CI lint cho instruction files. |
| 12 | **cctop** ✅ | TUI monitor | `install.sh` standalone binary | **Implemented.** `curl install.sh | sh` từ stefanprodan/cctop, installs to `~/.local/bin`. Apache-2.0, 139★, zero-deps, read-only, không spawn process. Fills gap: statusline.js chỉ per-session; cctop cho cross-session live visibility. |
| 13 | **anthropics/claude-code-action** ✅ | GitHub Action | `.github/workflows/claude.yml` | **Implemented.** `anthropics/claude-code-action@v1`, OAuth token path (`CLAUDE_CODE_OAUTH_TOKEN`), triggers: issue_comment, PR review comment, issues (opened/assigned), PR review (submitted). Official MIT, 8.9k★. Fills gap: CI Claude Code-powered PR review/issue triage. |

## 3. ADOPT-LATER (đã chấm, chưa làm — có điều kiện kích hoạt)

| Tool | Vì sao sau | Điều kiện kích hoạt |
|------|-----------|---------------------|
| **trufflehog** (`--only-verified`, AGPL) | Thay cho `check-token-leak.sh` phase-2 khi cần verify live (không FP trên content body) | Khi repo sắp public hoặc có commit chứa secret thật rò rỉ trong history. Phải test trước ở machine local, không chạy song song với scanner (critic: fold gitleaks vào đây, không chạy 2 scanner). |
| **DBHub PostgreSQL MCP** (@bytebase/dbhub, MIT) | Official-docs-canonical, `--readonly` flag; thay `docker exec mc-postgres psql` ad-hoc. **Promoted:** 80 npm releases, 1.2.5 (2026-09-15), official Claude Code docs example. | Khi cần census/audit DB thường xuyên hơn. Phải: dedicated read-only role + machine-local registration (`.mcp.json` gitignored) `.mcp.json.example` + tài liệu. |
| **markdownlint-cli2** | Config-only structural lint (MD024 duplicate headings, fences) — bổ trợ prose-level slop-guard | Khi migration bilingual/corpus settle xong (tránh baseline noise trên corpus đang đổi). |
| **GitHub Action claude-code-security-review** | Post-merge GitHub-layer review mà security-reviewer agent không làm được | Sau CI hardening xong; cần CLAUDE_API_KEY sign-off. Stop-gap: chạy `security-reviewer` agent trên diff trước merge. |
| **claude-code-redaction-hooks** (l-mb, Apache-2.0) | Redact secret trước khi gửi lên Claude (real exposure: dev=prod creds) | Bắt buộc **scratch review** toàn bộ hook payload paths trước khi bật blocking events; test bằng audit dry-run. |
| **sentry-mcp** | Sentry official MCP server — 3 install methods (hosted remote https://mcp.sentry.dev/mcp OAuth, npm stdio @sentry/mcp-server@0.39.0, plugin auto-subagent). **License FSL-1.1-ALv2 (source-available, KHÔNG OSI-approved) → policy review required trước khi adopt.** | Khi có error-tracking budget (Sentry plan) + chấp nhận license FSL-1.1-ALv2. Fills gap: hiện không có observability integration. |
| **SkillSpector MCP** | First-party passive-only analysis (skillspector mcp) — no code execution. **Promoted from adopt-later.** | Khi muốn CI gate skill install: CAUTION→prompt / DO_NOT_INSTALL→block sau khi calibrate FP. |
| **Trail of Bits skills marketplace** | 44 security plugins across 9 categories (Smart Contract 18, Code Auditing 7, Reverse Engineering 12...), 7.1k★, CC-BY-SA-4.0. **Requires plugin system → arbitrary code surface → security review mandatory.** | Khi CI hardening xong + security review passed. |
| **Claude plugin eval** | First-party plugin evaluation framework. Fills gap: không có plugin testing hiện tại. | Khi adopt plugin system chính thức. |
| **Composio MCP** (pilot) | 1000+ pre-authenticated toolkits (GitHub/Slack/Gmail/Notion/Asana/Shopify...), hosted MCP endpoint. **License: Composio TOS (proprietary, không OSI).** Security: mỗi toolkit gọi external SaaS API qua Composio proxy — data đi qua Composio server, cần review scope + privacy trước khi dùng. | Khi cần tích hợp SaaS tool nhanh mà không tự viết OAuth flow. Phải: tạo Composio account, review từng toolkit scope, register machine-local `.mcp.json` (gitignored, không commit key). Entry `_composio-pilot` đã thêm vào `.mcp.json.example` (commented-out). |

## 4. EXPLICITLY DROP / DEFER (có evidence, không nên theo đuổi)

| Tool | Lý do drop/defer | Evidence |
|------|------------------|----------|
| **claude-code-otel** | Maintenance risk: 4 commits trong 15 tháng; OpenTelemetry native export đã có trong Claude Code 2.1+ | Verified stale repo |
| **tomevault-io/lint-action** | 0★, 3 ngày tuổi, npx runtime download (supply-chain risk), chưa có track record | Verified fresh + risky |

## 5. CI SECRET GATE (gắn vào ci.yml)

```yaml
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Scan staged secrets
        run: |
          chmod +x .claude/tools/check-token-leak.sh
          .claude/tools/check-token-leak.sh --staged || true  # WARN-only, không fail build
```

> **Triết lý warn-only:** giống slop-guard (anti_slop.md) — CLI secret scan là phase-1 cảnh báo, KHÔNG chặn (solo dev, machine-local creds hợp lệ có trong tree thật nhưng gitignored). Khi bật gate thật (blocking) phải calibrate trước giống anti-slop: chạy 2 tuần, review từng hit, thêm allowlist.

## 6. TẠI SAO SKIP (đối chiếu hạ tầng đã có) — các category phổ biến

| Category | Tools nổi (verified) | Vì sao skip |
|----------|---------------------|-------------|
| **Statusline / usage bars** | ccstatusline 12.9k, claude-hud 28k, cship, ccusage 18.5k, statusline-pro | Đã có `statusline.js` custom (zero-dep, hiện model/budget/git) + `check_budget` Stop hook + deep-budget-mode skill. Thêm = supply chain cho signal đã render. |
| **Skills/agent megabundles** | superpowers 287k, ECC 258k, claude-forge, Continuous-Claude-v3, alirezarezvani 26k | Collide thẳng với 41 agent/72 command đã tuned theo stack; session-start hooks sẽ inject doctrine thứ 2 đè rules/; 109-292 skills = arbitrary-code surface khổng lồ. |
| **Hooks bundles** | karanb192, context-mode, claude-mem, redaction | Đã có 3 hooks self-authored minimal; bundle = conventions xung đột + attack surface. (redaction-hooks là ngoại lệ adopt-later vì lấp đúng exposure thật.) |
| **Git tooling** | lazygit 82k, lefthook 8.8k, pre-commit 15.6k | Commit đã policy-encoded qua `git:cm`/`git:cp`/`git:pr` + git-manager agent; CI đã gate lint/typecheck. |
| **MCP servers** | modelcontextprotocol/servers (filesystem/git/memory/…), chrome-devtools, firecrawl | Reference servers educational (README tự nói), filesystem/git trùng command có sẵn; chrome-devtools trùng playwright MCP; firecrawl adopt-later cho content ops. |
| **Plugins marketplace** | official 296 plugins, community 2282 | Plugin = arbitrary JS chạy user privilege; repo architecture chủ đích self-authored `.claude` chỉ official MCP. Có thể dùng để tìm khi gap thật xuất hiện. |
| **Claude API / agent SDK** | claude-api, mcp-builder, headless | Đã là substrate của wf.js (audit workflows, 660-agent verdict) + `claude -p --json-schema` pattern. |
| **Envs/context persistence** | mise, direnv, claude-mem | Go toolchain đã fix stable; MEMORY.md + auto-memory đã là source of truth; claude-mem = 5 hooks + background worker + SQLite/FTS duplicate. |

**Gaps từ completeness critic đã cân nhắc:**
- **claude-code-router** (37.2k★) — router nhiều provider/model. KHÔNG adopt: đang dùng nexum-router ở environment hiện tại, chuyển = thêm lớp chuyển tiếp + config cho bài toán solo 1 model.
- **repomix** (28.3k★) — pack repo vào 1 file AI-friendly. KHÔNG adopt-now: công việc hiện tại là trong-repo (không cần context window khổng lồ); nhưng **giữ trong radar** khi cần gửi context ra ngoài (issue/PR review).
- **promptfoo** (25.1k★) — evals/red-teaming prompts. KHÔNG adopt-now: chưa có prompt pipeline cần regression-test; nếu viết thêm system prompt quan trọng → xem lại.
- **VS Code extension** — đang dùng (session này chạy trong IDE). Không phải gap.
- **skills count fix** — critic: skills dir có 53 entries nhưng ~47 skills thật (README/INSTALLATION/install.sh/… không phải skill).

## 7. RULES — KHÔNG NÊN LÀM (bài học từ scan)

1. **Không cài plugin/marketplace bừa** — plugin chạy arbitrary JS ở user privilege. Nếu cần gap, ưu tiên 1) official Anthropic 2) self-authored 3) mới xét third-party có security review.
2. **Không 2 công cụ cho 1 slot** — một secret scanner (trufflehog), một statusline (custom), một guard (scout-block). Trùng = 2 lần calibrate, 2 lần FP.
3. **Không stack megabundle lên hệ đã tuned** — mỗi bundle kéo theo methodology riêng (TDD, planning, memory) đè rules/ của repo.
4. **Synchronize 3 chỗ** khi sửa MCP/github config: `.mcp.json` (machine), `.mcp.json.example` (tracked), vendored docs (`.claude/skills/claude-code/references/`).
5. **Changelog hằng tuần** — hooks stdin JSON và MCP surface đổi theo release; hạ tầng gitignored (hook) có thể âm thầm hỏng mà CI không bắt.

---
**Version:** 1.5.1 (2026-09-18) | **Maintainer:** dev (kronosss2002) | Nguồn: wf_18dbe9ab-275 workflow result (2026-09-15) + implementation pass 2026-09-17 + adopt-now pass 4 2026-09-18 (anti-rationalization + composio-mcp-pilot) + revert document-skills same day (proprietary → /tmp backup, repo 100% OSI)
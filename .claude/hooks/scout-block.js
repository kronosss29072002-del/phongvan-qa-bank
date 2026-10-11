#!/usr/bin/env node
/**
 * scout-block.js — PreToolUse hook: chặn thao tác nguy hiểm.
 *
 * LỚP 1 (cũ):  Chặn truy cập heavy directories — node_modules, __pycache__,
 *              .git/, dist/, build/ (file_path/path/pattern + Bash access)
 * LỚP 2 (mới): Destructive commands — git push --force, reset --hard,
 *              clean -f, rm -rf dangerous targets, find -delete, dd/mkfs/shred
 * LỚP 3 (mới): Sensitive files — .env*, .ssh, .aws, credentials, keys,
 *              .kube/config, Claude Code credentials
 *
 * FIX FP (2026-09-17): Lớp 1 cũ chặn mọi command chứa chuỗi "node_modules"
 *   trong text (kể cả grep pattern). Fix: chỉ chặn khi lệnh THỰC SỰ thao tác
 *   trên blocked path (cd/ls/cat/rm/cp/mv/find/chmod...) — grep/search/spawn
 *   được phép.
 *
 * Policy: fail-open khi JSON hỏng (không chặn session vì config lỗi).
 * Usage (settings.json PreToolUse):
 *   "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/scout-block.js"
 */
'use strict';

const fs = require('fs');

let data;
try {
  data = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  console.error('WARN: Invalid hook JSON, allowing');
  process.exit(0);
}

const ti = (data && data.tool_input) || {};

function blocked(reason) {
  console.error(`BLOCKED: ${reason}`);
  process.exit(2);
}

// ──────────────────────────────────────────────────────────────────────────
// LỚP 1: Blocked directories — file path params (giữ nguyên hành vi cũ)
// ──────────────────────────────────────────────────────────────────────────
const BLOCKED_DIR_RE = /(^|\/|\s)(node_modules|__pycache__|\.git|dist|build)(\/|$|\s)/;

for (const val of [ti.file_path, ti.path, ti.pattern]) {
  if (typeof val === 'string' && BLOCKED_DIR_RE.test(val)) {
    blocked('Blocked directory in path (node_modules/__pycache__/.git/dist/build)');
  }
}

// ──────────────────────────────────────────────────────────────────────────
// LỚP 1b: Bash commands thao tác trên blocked directories (đã fix FP)
//   Chỉ chặn các lệnh file-op nhắm vào blocked dir. grep/sed/awk/echo/spawn
//   không bị chặn kể cả khi text nhắc đến "node_modules".
// ──────────────────────────────────────────────────────────────────────────
const cmd = typeof ti.command === 'string' ? ti.command.trim() : '';

if (cmd) {
  // Chỉ chặn lệnh GHI/XÓA nhắm vào blocked dir (rm/cp/mv/chown/chmod/touch/mkdir).
  // cd/ls/cat/find (đọc, scan) không bị chặn — find -not -path '*/node_modules/*' hợp lệ.
  // Các lệnh phá hủy của find (-delete, -exec rm) đã bắt ở LỚP 2b dưới.
  const ACCESS_RE =
    /(?:^|;|\s)(?:rm|cp|mv|chown|chmod|touch|mkdir)\s+[^\n;]*?(?:node_modules|__pycache__|\.git|dist|build)(?:\/|$|\s)/;

  if (ACCESS_RE.test(cmd)) {
    blocked('Blocked directory in shell command (node_modules/__pycache__/.git/dist/build)');
  }

  // ──────────────────────────────────────────────────────────────────────
  // LỚP 2: Destructive git — mined từ cc-safety-net rules
  // ──────────────────────────────────────────────────────────────────────
  // Khi command nhắc đến pattern trong quote (vd command text của grep/echo),
  // nó là argument chứ không phải hành động thực thi. Strip quotes trước khi match.
  const stripQuoted = (s) =>
    s.replace(/"(?:[^"\\]|\\.)*"/g, ' ').replace(/'[^']*'/g, ' ').replace(/`[^`]*`/g, ' ');

  const dry = stripQuoted(cmd);

  const GIT_RULES = [
    { re: /\bgit\s+push\s+--(?:force|force-with-lease)\b/, id: 'git.push-force' },
    { re: /\bgit\s+push\s+--delete\b/, id: 'git.push-delete' },
    { re: /\bgit\s+push\s+--mirror\b/, id: 'git.push-mirror' },
    { re: /\bgit\s+reset\s+--hard\b/, id: 'git.reset-hard' },
    { re: /\bgit\s+reset\s+--merge\b/, id: 'git.reset-merge' },
    { re: /\bgit\s+clean\s+-f+d*\s*$/, id: 'git.clean-force' },
    { re: /\bgit\s+rm\s+-rf\b/, id: 'git.rm-force' },
    { re: /\bgit\s+checkout\s+--force\b/, id: 'git.checkout-force' },
    { re: /\bgit\s+checkout\s+--\s*$/, id: 'git.checkout-path-restore' },
    { re: /\bgit\s+switch\s+--(?:force|discard-changes)\b/, id: 'git.switch-force' },
    { re: /\bgit\s+branch\s+-D\b/, id: 'git.branch-force-delete' },
    { re: /\bgit\s+stash\s+clear\b/, id: 'git.stash-clear' },
    { re: /\bgit\s+stash\s+drop\b/, id: 'git.stash-drop' },
    { re: /\bgit\s+tag\s+--delete\b/, id: 'git.tag-delete' },
    { re: /\bgit\s+reflog\s+delete\b/, id: 'git.reflog-delete' },
    { re: /\bgit\s+worktree\s+remove\s+--force\b/, id: 'git.worktree-remove-force' },
    { re: /\bGIT_SSH_COMMAND\s*=/, id: 'git.ssh-env-override' },
  ];

  for (const rule of GIT_RULES) {
    if (rule.re.test(dry)) {
      blocked(`Destructive git command blocked: ${rule.id}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // LỚP 2b: Destructive filesystem
  // ──────────────────────────────────────────────────────────────────────
  const FS_RULES = [
    { re: /\brm\s+-(?:[a-z]*r[a-z]*f[a-z]*|[a-z]*f[a-z]*r[a-z]*)\s+\/\s*$/, id: 'rm.recursive-force-root' },
    { re: /\brm\s+-(?:[a-z]*r[a-z]*f[a-z]*|[a-z]*f[a-z]*r[a-z]*)\s+~(?:\/|$)/, id: 'rm.recursive-force-home' },
    { re: /\brm\s+-(?:[a-z]*r[a-z]*f[a-z]*|[a-z]*f[a-z]*r[a-z]*)\s+\.(?:\s|$)/, id: 'rm.recursive-force-cwd' },
    { re: /\bfind\s+[^;\n]*?\s-delete\b/, id: 'find.delete' },
    { re: /\bfind\s+[^;\n]*?\s-exec\s+(?:rm\s+-rf|rm\s+-fr)/, id: 'find.exec-rm-recursive' },
    { re: /\bdd\s+.*\sof=\/dev\//, id: 'dd.device-write' },
    { re: /\bmkfs(?:\.[a-z0-9]+)?\s+\/dev\//, id: 'mkfs.device-format' },
    { re: /\bshred\s+/, id: 'shred.target' },
    {
      re: /\b(?:python|python3|node|ruby|perl)\s+-[ce]\s+["'].*?\brm\s+-[a-z]*r[a-z]*f\b/,
      id: 'interpreter.dangerous-one-liner',
    },
  ];

  for (const rule of FS_RULES) {
    if (rule.re.test(dry)) {
      blocked(`Destructive filesystem command blocked: ${rule.id}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// LỚP 3: Sensitive credential files (file_path / path / pattern params)
//   Chặn ĐỌC/GHI trực tiếp các file chứa secrets.
//   Ngoại lệ: docs, .example, test/spec, seed, bodies (nội dung repo hợp lệ).
// ──────────────────────────────────────────────────────────────────────────
const SENSITIVE_RE = [
  { re: /(^|[\/\\])\.env([\/\\]|\s|$)/i, label: '.env' },
  { re: /(^|[\/\\])\.env\.[A-Za-z0-9_-]+$/, label: '.env.*' },
  { re: /(^|[\/\\])\.npmrc$/, label: '.npmrc' },
  { re: /(^|[\/\\])\.pypirc$/, label: '.pypirc' },
  { re: /(^|[\/\\])\.netrc$/, label: '.netrc' },
  { re: /(^|[\/\\])\.git-credentials$/, label: '.git-credentials' },
  { re: /(^|[\/\\])id_(?:rsa|ed25519|ecdsa|dsa)(?:\.|$)/, label: 'ssh private key' },
  { re: /(^|[\/\\])[A-Za-z0-9_-]+_(?:rsa|ed25519|ecdsa|dsa)$/, label: 'ssh key pattern' },
  { re: /(^|[\/\\])credentials(?:\.|\/|$)/i, label: 'credentials' },
  { re: /[\/\\]\.ssh[\/\\]/, label: '~/.ssh' },
  { re: /[\/\\]\.aws[\/\\]/, label: '~/.aws' },
  { re: /[\/\\]\.kube[\/\\]config(?:\.|\/|$)/, label: '~/.kube/config' },
  { re: /[\/\\]\.docker[\/\\]config\.json$/, label: '~/.docker/config.json' },
  { re: /[\/\\]\.config[\/\\]gh[\/\\]hosts\.yml$/, label: 'gh hosts.yml' },
  { re: /[\/\\]\.claude[\/\\]\.credentials\.json$/, label: 'Claude Code credentials' },
];

const DOC_EXCEPTION_RE =
  /(\.example|\.md$|\.spec\.|\.test\.|\/tests?\/|\/docs\/|\/references\/|seed-|bodies\/|\.yml$|\.json\.example)/i;

for (const val of [ti.file_path, ti.path, ti.pattern]) {
  if (typeof val !== 'string' || !val.trim()) continue;
  for (const rule of SENSITIVE_RE) {
    if (rule.re.test(val)) {
      // Ngoại lệ doc/example/test — nội dung repo hợp lệ, không phải secret runtime
      if (DOC_EXCEPTION_RE.test(val)) break;
      blocked(`Sensitive credential path blocked: ${val} (${rule.label})`);
    }
  }
}

process.exit(0);
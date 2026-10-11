#!/usr/bin/env node
/**
 * injection-guard.js — PostToolUse warn-only hook phát hiện prompt-injection
 * được viết vào file (indirect prompt injection defense).
 *
 * PHÁT HIỆN (port từ lasso-security/claude-hooks patterns.yaml taxonomy):
 *   instructionOverridePatterns — ghi đè/ignore/clear instructions
 *   rolePlayingPatterns         — DAN/role-play jailbreak
 *   encodingPatterns            — base64/ROT13/obfuscation
 *   contextManipulationPatterns — fake role markers, injected context
 *
 * TÍNH NĂNG:
 *  - WarN-ONLY: luôn exit 0, chỉ in WARN ra stderr + append log.
 *  - Chỉ quét content files (*.md/*.markdown/*.txt — SKIP code .ts/.js/.tsx)
 *    vì code chứa chuỗi injection hợp lệ (string literals, tests).
 *  - Strip code fences (```) trước khi match — snippet không phải injection.
 *  - Context-sensitive: "discuss/defend against/describe X" không phải injection.
 *  - Whitelist benign usage: "reset context" (Claude Code /clear), "not forget".
 *
 * USAGE (settings.json PostToolUse — thêm cạnh slop-guard.js):
 *   { "matcher": "Write|Edit",
 *     "hooks": [{ "type": "command",
 *       "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/injection-guard.js" }] }
 */
'use strict';

const fs = require('fs');
const path = require('path');

const HOOKS_DIR = __dirname;
const LOG_PATH = path.join(HOOKS_DIR, 'injection-hits.log');

const CONTENT_RE = /\.(md|markdown|txt|yaml|yml)$/i;
const FENCE_RE = /^\s*(```|~~~)/;
// Meta-discussion: từ khoá thảo luận VỀ injection (không phải injection thật)
const META_DISCUSS_RE =
  /\b(discuss|discusses|defend|defending|against|prevent|preventing|mitigat|detect|detects|protect|block|blocks|guard|topic|concept|example of|illustrate|illustrates|how to (prevent|detect|defend))\b|attackers?\s+(use|uses|try|may|could)|injection\s+(attacks?|guard|defense)|security\s+(topic|guide|doc)/i;
// Ngữ cảnh benign: mô tả tính năng, reset context trong Claude Code
const BENIGN_RE = /\b(reset (the )?context|clear (the )?context|\/clear|\/reset|not (to )?forget)\b/i;
// Whitelist hẹp cho việc thảo luận: câu mô tả thao tác của chính hệ thống
const SYSTEM_ACTION_RE = /\b(claude code|the hook|the tool|the system|our tool)\b/i;

const PATTERNS = [
  {
    id: 'override.ignore-previous',
    re: /\bignore\s+(all\s+)?(previous|prior|above|earlier|preceding)\s+(instructions?|prompts?|rules?|guidelines?|directives?|context)/i,
    reason: 'cố gắng bỏ qua instructions trước đó',
    sev: 'high',
  },
  {
    id: 'override.forget',
    re: /\bforget\s+(all\s+)?(previous|prior|above|earlier|your)\s+(instructions?|prompts?|rules?|training|guidelines?)/i,
    reason: 'cố gắng khiến AI quên instructions',
    sev: 'high',
  },
  {
    id: 'override.disregard',
    re: /\bdisregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|context|rules?)/i,
    reason: 'cố gắng phủ nhận instructions trước đó',
    sev: 'high',
  },
  {
    id: 'override.override',
    re: /\boverride\s+(your\s+|all\s+)?(instructions?|programming|directives?|rules?|guidelines?)/i,
    reason: 'cố gắng override instructions',
    sev: 'high',
  },
  {
    id: 'override.not-follow',
    re: /\b(do\s+)?not\s+follow\s+(your\s+)?(previous|original|initial)\s+(instructions?|rules?|guidelines?)/i,
    reason: 'ra lệnh không theo guidelines hiện tại',
    sev: 'high',
  },
  {
    id: 'override.new-system-prompt',
    re: /\b(new|updated|revised|real)\s+system\s+prompt\b/i,
    reason: 'cố gắng chèn system prompt mới',
    sev: 'high',
  },
  {
    id: 'override.from-now-on',
    re: /\bfrom\s+now\s+on[,\s]+(you\s+)?(will|must|should|are)\b/i,
    reason: 'cố gắng định nghĩa lại hành vi về sau',
    sev: 'high',
  },
  {
    id: 'override.reset-context',
    re: /\breset\s+(your\s+)?(memory|instructions?|state|conversation)\b/i,
    reason: 'cố gắng reset memory/instructions/state (không phải "reset the context" thông thường)',
    sev: 'high',
  },
  {
    id: 'override.clear-memory',
    re: /\bclear\s+(your\s+)?(memory|instructions?|history|state)\b/i,
    reason: 'cố gắng xóa memory/instructions/history/state',
    sev: 'high',
  },
  {
    id: 'roleplay.dan',
    re: /\b(do\s+anything\s+now|DAN\s+mode|developer\s+mode)\b/i,
    reason: 'DAN/role-play jailbreak marker',
    sev: 'high',
  },
  {
    id: 'roleplay.act-as-unfiltered',
    re: /\bact\s+as\s+(an?\s+)?(unfiltered|uncensored|no\s+limits|without\s+(any\s+)?(restrictions?|rules?|filters?))/i,
    reason: 'yêu cầu chế độ không filter',
    sev: 'high',
  },
  {
    id: 'encoding.base64-command',
    re: /\bbase64\s+(-d|--decode)?\s*['"][A-Za-z0-9+/=]{8,}['"]\s*(\||;|\s+sh|\s+bash|\s+node)/i,
    reason: 'payload base64 giấu lệnh',
    sev: 'high',
  },
  {
    id: 'context.fake-token',
    re: /\b[<\[{]?(system|assistant|user)[>\]}]?\s*:/i,
    reason: 'fake role marker trà trộn vào content',
    sev: 'medium',
  },
];

let data;
try {
  data = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const result = data.tool_result || {};
const fp = result.file_path || result.tool_use?.input?.file_path || '';
if (!fp || !CONTENT_RE.test(fp)) process.exit(0);
if (/node_modules|dist|build|coverage/.test(fp)) process.exit(0);

let content = '';
try {
  content = fs.readFileSync(fp, 'utf8');
} catch {
  process.exit(0);
}

// Strip code fences & nội dung trong fence — snippet không phải injection thật
const noFences = content
  .split('\n')
  .filter((line) => {
    if (FENCE_RE.test(line)) return false; // dòng fence
    if (/^\s*(const|let|var|import|export|function|async|class|return|package|require|def|print|echo|console\.log)\s/.test(line)) return false; // code line
    return true;
  })
  .join('\n');

const hits = [];
for (const p of PATTERNS) {
  const m = noFences.match(p.re);
  if (!m) continue;

  // Context-safe: câu thảo luận VỀ injection / mô tả hệ thống → không warn
  const line = m.index !== undefined ? noFences.slice(Math.max(0, m.index - 120), m.index + 120) : noFences.slice(0, 240);
  if (META_DISCUSS_RE.test(line)) continue;

  // Whitelist benign usage (Claude Code /clear reset context, "not forget")
  if (BENIGN_RE.test(m[0])) continue;
  if (SYSTEM_ACTION_RE.test(line) && p.id.startsWith('override.')) continue;

  hits.push({
    id: p.id,
    reason: p.reason,
    sev: p.sev,
    match: m[0].slice(0, 100),
    line: noFences.split('\n').findIndex((l) => p.re.test(l)) + 1,
  });
}

if (hits.length) {
  const line = `[${new Date().toISOString()}] ${fp}: ${hits
    .map((h) => `${h.id}(${h.sev})@L${h.line}=${h.match}`)
    .join(' | ')}`;
  try {
    fs.appendFileSync(LOG_PATH, line + '\n');
  } catch {}
  console.error(`WARN injection-guard: ${line}`);
}

process.exit(0);
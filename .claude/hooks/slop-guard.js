#!/usr/bin/env node
/**
 * SLOP-GUARD — PostToolUse warn-only hook chống AI-slop cho nội dung medium-clone.
 *
 * DESIGN (theo .claude/rules/anti_slop.md):
 *  - WarN-ONLY: luôn process.exit(0), không bao giờ chặn session (exit 0 + không permissionDecision).
 *  - Chỉ quét content paths: *.md (trừ skipDirs/skipFiles) + backend/prisma/seed-*.ts + *-meta.ts.
 *  - Wordlist chung: .claude/rules/slop-wordlist.json (tracked, single source of truth với rule doc + CI;
 *    fallback local cạnh hook nếu máy chưa pull bản mới).
 *  - Skip fence/blockquote/inline-code/frontmatter/table/heading để tránh false positive trên
 *    code và đoạn EN trích dẫn trong body song ngữ VI+EN (LMS bilingual audit).
 *  - Ghi append slop-hits.log để calibrate wordlist 2 tuần trước khi bật gate.
 *
 * Dựa trên: 70-agent research (wf_8d92bd5f-cb5) — verified sources: AiSDR, Metric37, Grammarly,
 * refine.so, Olivia Cal, auroris LLM Writing Guide, archvalmiki, anthropics/claude-code docs,
 * corpus scan 1663 body của repo.
 *
 * USAGE (settings.json):
 *  "PostToolUse": [{
 *    "matcher": "Write|Edit",
 *    "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/slop-guard.js" }]
 *  }]
 *
 * NO external deps. Node >= 18.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// ---------- Config ----------
const HOOKS_DIR = __dirname;
// Wordlist: chính thức ở .claude/rules/slop-wordlist.json (tracked, sync với anti_slop.md).
// Fallback: bản local cạnh hook (gitignored) cho máy chưa pull bản mới.
const WORDLIST_PATH = fs.existsSync(path.join(HOOKS_DIR, '..', 'rules', 'slop-wordlist.json'))
  ? path.join(HOOKS_DIR, '..', 'rules', 'slop-wordlist.json')
  : path.join(HOOKS_DIR, 'slop-wordlist.json');
const LOG_PATH = path.join(HOOKS_DIR, 'slop-hits.log');

// ---------- Wordlist load ----------
let CFG = null;
try {
  CFG = JSON.parse(fs.readFileSync(WORDLIST_PATH, 'utf8'));
} catch (e) {
  // Không có wordlist = không chặn gì. Luôn exit 0.
  process.exit(0);
}
if (!CFG.enabled) process.exit(0);

// ---------- Helpers ----------
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Chuẩn hóa chuỗi cho so khớp VI (lowercase, giữ dấu, không fold dấu)
const norm = (s) => String(s).toLowerCase();

// Âm tiết (đếm khoảng trắng + 1 — đủ tốt cho cadence)
const syllableCount = (s) => {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
};

// ---------- Line scanning ----------
const scanLines = (text) => {
  const findings = [];
  // skipPatterns: dòng này KHÔNG quét (fence toggle, code, blockquote, heading, table, blank)
  const skipPatterns = (CFG.skipPatterns || []).map((p) => new RegExp(p));
  // Các pattern regex có sẵn (EN) — bù \b cho VI phrase
  const tier1En = (CFG.tier1 && CFG.tier1.en || []).map((x) => ({
    r: new RegExp(x.pattern, 'gi'), hint: x.hint
  }));
  const tier1Vi = (CFG.tier1 && CFG.tier1.vi || []).map((x) => ({
    r: new RegExp(escapeRegExp(norm(x.pattern)), 'g'), hint: x.hint
  }));
  const tier2Vi = CFG.tier2 && CFG.tier2.vi || [];
  const tier2En = CFG.tier2 && CFG.tier2.en || [];

  let inFence = false;
  let inFrontmatter = false;
  let tier1Count = 0;
  let tier1Lines = [];
  let tier2Count = 0;
  const tier2Hits = [];
  let last3short = 0;
  let emDashCount = 0;
  let emDashLines = [];
  let clusterTier2 = [];
  let clusterStartLine = 0;
  const lines = String(text).split('\n');

  const flushCluster = (endLine) => {
    if (clusterTier2.length >= (CFG.tier2 && CFG.tier2.clusterMaxDistinct || 3)) {
      findings.push(`[T2-cluster] dòng ${clusterStartLine}-${endLine}: ${clusterTier2.length} từ tier-2 đặc biệt ("${clusterTier2.join('", "')}") — viết lại theo rule 4`);
    }
    clusterTier2 = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = norm(raw);
    const idx = i + 1;

    // Fence / frontmatter state
    if (/^\s*```/.test(raw) || /^\s*~~~/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (i === 0 && /^---$/.test(raw.trim())) { inFrontmatter = true; continue; }
    if (inFrontmatter) { if (/^---$/.test(raw.trim())) inFrontmatter = false; continue; }
    if (inFence) continue;
    if (skipPatterns.some((p) => p.test(raw))) continue;

    // Tier 1 VI (phrase, lowercase both sides)
    for (const p of tier1Vi) {
      if (p.r.test(line)) {
        p.r.lastIndex = 0;
        tier1Count++;
        tier1Lines.push(idx);
        findings.push(`[T1] dòng ${idx}: "${raw.trim().slice(0, 70)}" — ${p.hint}`);
      }
    }

    // Tier 1 EN (regex, match original text)
    for (const p of tier1En) {
      p.r.lastIndex = 0;
      if (p.r.test(raw)) {
        tier1Count++;
        tier1Lines.push(idx);
        findings.push(`[T1] dòng ${idx}: "${raw.trim().slice(0, 70)}" — ${p.hint}`);
      }
    }

    // Tier 2 — count + cluster (per 40 dòng, ≥3 distinct)
    let hitT2 = null;
    for (const w of tier2Vi) {
      if (line.includes(norm(w))) { hitT2 = w; break; }
    }
    if (!hitT2) {
      for (const w of tier2En) {
        if (new RegExp('\\b' + escapeRegExp(w) + '\\b', 'i').test(raw)) { hitT2 = w; break; }
      }
    }
    if (hitT2) {
      tier2Count++;
      tier2Hits.push({ line: idx, word: hitT2 });
      // cluster window
      if (clusterTier2.length === 0) clusterStartLine = idx;
      if (!clusterTier2.includes(hitT2)) clusterTier2.push(hitT2);
      if (idx - clusterStartLine >= (CFG.tier2 && CFG.tier2.clusterWindowLines || 40)) {
        flushCluster(idx);
      }
    } else if (clusterTier2.length > 0 && idx - clusterStartLine >= (CFG.tier2 && CFG.tier2.clusterWindowLines || 40)) {
      flushCluster(idx);
    }

    // Structural: staccato (3 dòng prose < 9 từ liên tiếp)
    const wc = syllableCount(raw);
    if (wc > 0 && wc < (CFG.structural && CFG.structural.staccato && CFG.structural.staccato.minShortSentenceWords || 9)) {
      last3short++;
      if (last3short >= (CFG.structural && CFG.structural.staccato && CFG.structural.staccato.maxConsecutive || 3)) {
        findings.push(`[staccato] dòng ${idx-2}-${idx}: 3+ dòng ngắn liên tiếp — cấm triplet trừ 1 cụm chủ đích cả bài (rule 4.2)`);
        last3short = 0;
      }
    } else {
      last3short = 0;
    }

    // Structural: em dash count
    const emCount = (raw.match(/—/g) || []).length;
    if (emCount > 0) { emDashCount += emCount; emDashLines.push(idx); }

    // Tier 2 cluster end-of-window reset handled above
  }
  flushCluster(lines.length);

  // Em dash: max 1/đoạn — count global via line gaps (approx)
  if (emDashLines.length > 1) {
    findings.push(`[em-dash] ${emDashLines.length} dòng chứa "—" (${emDashLines.join(', ')}) — tối đa 1/đoạn, nghi ngờ 1 cái lạm dụng (rule 4.8)`);
  }

  // Tier 2 tổng (threshold theo bài: > 5 từ tier-2 đặc biệt tính riêng thôi, cluster đã lo)
  return { findings, tier1Count, tier2Count, emDashCount };
};

// ---------- Scope filter ----------
const shouldScan = (filePath) => {
  if (!filePath) return false;
  const abs = path.resolve(filePath);
  const base = path.basename(abs);
  const rel = abs;
  // skipDirs (absolute path match)
  for (const d of CFG.skipDirs || []) {
    if (rel.includes(path.sep + d + path.sep) || rel.startsWith(d + path.sep)) return false;
  }
  // skipFiles
  for (const f of CFG.skipFiles || []) {
    if (base.startsWith(f)) return false;
  }
  // content paths: *.md bất kỳ đâu (trừ skip) + seed/meta .ts dưới backend/prisma
  if (base.endsWith('.md')) return true;
  if (rel.includes(path.sep + 'backend' + path.sep + 'prisma' + path.sep) &&
      /^(seed-.*\.ts|.*-meta\.ts)$/.test(base)) return true;
  return false;
};

// ---------- Main ----------
let input = '';
try {
  input = fs.readFileSync(0, 'utf8'); // stdin JSON payload
} catch (e) {
  process.exit(0);
}

let payload = null;
try {
  payload = JSON.parse(input);
} catch (e) {
  process.exit(0);
}

const tool = payload.tool_name || '';
if (!['Write', 'Edit'].includes(tool)) process.exit(0);

const toolInput = payload.tool_input || {};
const filePath = toolInput.file_path || '';

if (!shouldScan(filePath)) process.exit(0);

let text = '';
let isSeedTs = /^(seed-.*\.ts|.*-meta\.ts)$/.test(path.basename(filePath));

if (tool === 'Write') {
  // content từ payload (không cần đọc lại disk)
  text = toolInput.content || '';
} else {
  // Edit: đọc file từ disk sau khi thay đổi áp dụng (PostToolUse)
  try {
    text = fs.readFileSync(filePath, 'utf8').slice(0, CFG.sizeCeilingBytes || 5242880);
  } catch (e) {
    process.exit(0);
  }
}

const result = scanLines(text);
if (result.findings.length === 0) process.exit(0);

const tag = isSeedTs ? ' (seed template — line anchor ước lượng)' : '';
for (const f of result.findings) {
  process.stderr.write(`SLOP-GUARD ${path.basename(filePath)} ${f}${tag}\n`);
}
process.stderr.write(`SLOP-GUARD: ${result.findings.length} cảnh báo trong ${path.basename(filePath)} — xem .claude/rules/anti_slop.md (T1:${result.tier1Count} T2:${result.tier2Count} em-dash:${result.emDashCount})\n`);

// Log để calibrate (append)
try {
  fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} ${tool} ${filePath} findings=${result.findings.length} t1=${result.tier1Count} t2=${result.tier2Count}\n`);
} catch (e) { /* noop */ }

// WarN-ONLY: KHÔNG BAO GIỜ block
process.exit(0);
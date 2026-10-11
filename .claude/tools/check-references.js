#!/usr/bin/env node
/**
 * check-references.js — meta-lint cho .claude bundle (warn-only, exit 0).
 *
 * Bắt các dangling refs mà audit wf_2b51e4c8-e73 tìm thấy (~15 chỗ):
 *   - /command refs trỏ tới command không tồn tại
 *   - "X agent" trỏ tới agent không tồn tại
 *   - "X skill" trỏ tới skill không tồn tại
 *   - đường dẫn tương đối (.claude/, ./ , ../) trỏ tới file không tồn tại
 *   - phantom tool names (read_url_content, view_file, ...) — không phải Claude Code tools
 *   - "imagemagick skill" (không tồn tại — capability ở media-processing)
 *
 * Xử lý refs trước khi check:
 *   - cắt suffix line-range (file.md:10-20 -> file.md)
 *   - cắt shell args (./script.sh --flag -> ./script.sh)
 *   - skip theo ALLOWLIST.paths (prefix cho phép không tồn tại trên disk)
 *
 * Triết lý warn-only (giống slop-guard / check-token-leak): không block,
 * chỉ flag. Thêm dòng mới vào ALLOWLIST khi ref có chủ đích trỏ ra ngoài bundle.
 */
const fs = require('fs');
const path = require('path');

const BUNDLE = path.resolve(__dirname, '..');            // .claude/
const REPO_ROOT = path.resolve(BUNDLE, '..');            // repo chứa bundle này

// Repo-root contracts (`./docs`, `./plans`, `./README.md`...) được resolve theo
// project mà bundle được cài vào. Nguồn: repo-facts.json (sinh bởi
// generate-repo-facts.js) — nếu thiếu thì fallback REPO_ROOT (bundle đứng
// ngay trong repo) và báo note để user chạy generator.
let REPO_ROOT_CONTRACT = REPO_ROOT;
try {
  const rf = JSON.parse(fs.readFileSync(path.join(BUNDLE, 'repo-facts.json'), 'utf8'));
  if (rf.repoRoot && fs.existsSync(rf.repoRoot)) REPO_ROOT_CONTRACT = rf.repoRoot;
} catch { /* chưa generate — fallback REPO_ROOT */ }

const ALLOWLIST = {
  commands: [
    // Slash built-ins của Claude Code (không nằm trong commands/)
    'help', 'clear', 'config', 'artifacts', 'resume', 'continue', 'doctor',
    'mcp', 'plugins', 'skills', 'agents', 'models', 'fast', 'hooks', 'login',
    'logout', 'statusline', 'permissions', 'budget', 'todo', 'tasks', 'cost',
    'init', 'install', 'upgrade', 'design-login',
    // Đường dẫn hệ thống / code sample chứa slash — FP mong muốn được loại
    'usr', 'var', 'etc', 'tmp', 'home', 'bin', 'opt', 'root', 'dev', 'proc',
    'sys', 'usr/bin', 'usr/local', 'var/log',
  ],
  agents: [],
  skills: [
    'dataviz', // skill ở ~/.claude/skills global, không trong bundle
  ],
  paths: [
    '../generated/',
    '.claude/deep-budget', // match cả .json + .md
    './node_modules/.cache/', // turbo cache
    './canvas-fonts',
    './logs.txt',
    '.claude/refs/BUNDLE-REFERENCE.html',
    './commandandscript/', // legacy plan refs
    '../cs-helpers', // legacy plan refs
    '.claude/rules/automation_rules_legacy.md', // legacy backup not preserved
  ], // glob prefix được phép không tồn tại nếu match (vd 'docs/' khi chưa tạo)
};

const PHANTOM_TOOLS = [
  'read_url_content', 'view_file', 'run_command', 'replace_file_content',
  'searchapi', 'modularization-hook', 'imagemagick skill',
];

function collectCommands(dir) {
  const cmds = new Set();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const f of fs.readdirSync(p)) {
        if (f.endsWith('.md')) cmds.add(`${entry.name}:${f.replace(/\.md$/, '')}`);
      }
    } else if (entry.name.endsWith('.md')) {
      cmds.add(entry.name.replace(/\.md$/, ''));
    }
  }
  return cmds;
}

function collectAgents(dir) {
  const set = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.md')) set.add(f.replace(/\.(ts\.)?md$/, ''));
  }
  return set;
}

function collectSkills(dir) {
  return new Set(fs.readdirSync(dir).filter(e => fs.statSync(path.join(dir, e)).isDirectory()));
}

function walkMd(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Exclude ephemeral/session dirs: scratchpad (working notes), projects (session transcripts)
    // These contain literal mentions of phantom tools as audit quotes, not operational refs
    if (entry.name.startsWith('.') || entry.name === 'node_modules' ||
        entry.name === 'scratchpad' || entry.name === 'projects') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMd(p, acc);
    else if (entry.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

const cmds = collectCommands(path.join(BUNDLE, 'commands'));
const agents = collectAgents(path.join(BUNDLE, 'agents'));
const skills = collectSkills(path.join(BUNDLE, 'skills'));
const files = walkMd(BUNDLE).filter(f => !f.includes('/node_modules/'));

const issues = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const rel = path.relative(BUNDLE, file);
  lines.forEach((line, i) => {
    const ln = i + 1;

    // 1. /command refs trong backticks — chỉ bắt khi ref giống slash command thật (không phải URL/path sample)
    const cmdRefs = line.match(/`\/([a-z][a-zA-Z0-9:_-]*)`/g) || [];
    for (const raw of cmdRefs) {
      const name = raw.slice(1, -1).slice(1);
      // FP: URL segments, code samples, đường dẫn (vd /api, /users, /health, /newbot lệnh telegram)
      if (/^(api|users|health|ready|readyz|healthz|newbot|mybots|deploy|test-all|getUsers|v1|v2|login|logout|docs|admin|assets|static)/i.test(name)) continue;
      // Nếu ref trỏ vào chính file đang chứa nó (self-command) thì bỏ qua
      const selfCmd = rel.replace(/^commands\//, '').replace(/\.md$/, '');
      const base = name.split(':')[0];
      if (name === selfCmd || base === selfCmd) continue;
      if (!cmds.has(name) && !ALLOWLIST.commands.includes(name) &&
          !ALLOWLIST.commands.includes(base) && !ALLOWLIST.commands.includes(name.split('/')[0])) {
        issues.push({ file: rel, line: ln, type: 'command', ref: name, detail: 'không tồn tại trong commands/' });
      }
    }

    // 2. "X agent"
    const agentRefs = line.match(/`([a-z][a-z0-9-]+)`\s+agent/g) || [];
    for (const raw of agentRefs) {
      const name = raw.match(/`([a-z][a-z0-9-]+)`/)[1];
      if (!agents.has(name) && !ALLOWLIST.agents.includes(name)) {
        issues.push({ file: rel, line: ln, type: 'agent', ref: name, detail: 'không tồn tại trong agents/' });
      }
    }

    // 3. "X skill"
    const skillRefs = line.match(/`([a-z0-9_-]+)`\s+skill/g) || [];
    for (const raw of skillRefs) {
      const name = raw.match(/`([a-z0-9_-]+)`/)[1];
      if (!skills.has(name) && !ALLOWLIST.skills.includes(name)) {
        issues.push({ file: rel, line: ln, type: 'skill', ref: name, detail: 'không tồn tại trong skills/' });
      }
    }

    // 4. Phantom tools
    // Skip repo-facts.md/template.md — they document phantom tools as cautionary examples
    if (!rel.includes('repo-facts')) {
      for (const t of PHANTOM_TOOLS) {
        if (line.includes(t)) {
          issues.push({ file: rel, line: ln, type: 'phantom-tool', ref: t, detail: 'không phải Claude Code tool / không tồn tại' });
        }
      }
    }
  });
}

// 5. Đường dẫn tương đối
for (const file of files) {
  const rel = path.relative(BUNDLE, file);
  const content = fs.readFileSync(file, 'utf8');
  const pathRefs = content.match(/`((?:\.claude\/|\.\/|\.\.\/)[^`]+)`/g) || [];
  for (const raw of pathRefs) {
    let ref = raw.slice(1, -1);
    // Strip line-range suffix (e.g. file.md:10-20 -> file.md)
    ref = ref.replace(/:\d+(?:-\d+)?$/, '');
    // Strip shell args (e.g. ./script.sh --flag -> ./script.sh)
    ref = ref.split(/\s+/)[0];
    // ALLOWLIST.paths: skip refs that match an allowed prefix or exact path
    if (ALLOWLIST.paths.some(p => ref.startsWith(p) || ref === p.replace(/\/$/, ''))) continue;
    // Repo-root contracts: refs bắt đầu ./docs, ./plans, ./README — agents viết theo repo-root
    // (trong khi file nằm trong .claude/). Đây chính là "phantom ./docs contract" của audit.
    if (/^\.\/(docs|plans|README\.md|codebase-summary\.md|repomix-output\.xml)(\/|$)/.test(ref)) {
      if (!fs.existsSync(path.resolve(REPO_ROOT_CONTRACT, ref.slice(2)))) {
        issues.push({ file: rel, type: 'repo-root-ref', ref, detail: `repo-root contract — không tồn tại ở ${path.basename(REPO_ROOT_CONTRACT)} root` });
      }
      continue;
    }
    // Path refs bình thường
    // - Globs (*), template (${VAR}, $1), placeholders (<...>) — pattern, skip
    if (ref.includes('*') || ref.includes('${') || ref.includes('$1') || ref.includes('<') || ref.includes('>')) continue;
    // - Brace expansion {a,b} — skip (multi-file ref)
    if (/\{[^}]+\}/.test(ref)) continue;
    // - .env / settings.local.json / config.json — gitignored runtime files, hợp lệ không tồn tại trên disk
    if (/\.env$|settings\.local\.json|config\.json/.test(ref)) continue;
    // - Mọi ref chứa `.claude/` (dù bắt đầu ./ hay ../) là repo-root contract — resolve theo REPO_ROOT (bundle này)
    const claudeIdx = ref.indexOf('.claude/');
    let resolved = null;
    if (claudeIdx !== -1) resolved = path.resolve(REPO_ROOT, ref.slice(claudeIdx));
    // - ../../ từ .claude/agents/ = repo-root (bỏ 2 cấp: agents->.claude)
    else if (ref.startsWith('../../')) resolved = path.resolve(REPO_ROOT, ref.slice(6));
    // - ./ hay ../ khác: resolve theo file
    else resolved = path.resolve(path.dirname(file), ref);
    if (!fs.existsSync(resolved)) {
      issues.push({ file: rel, type: 'path', ref, detail: 'file không tồn tại' });
    }
  }
}

// 6. settings.json hook files phải tồn tại
try {
  const settings = JSON.parse(fs.readFileSync(path.join(BUNDLE, 'settings.json'), 'utf8'));
  for (const hook of Object.values(settings.hooks).flatMap(h => h).flatMap(h => h.hooks || [])) {
    const m = hook.command.match(/\.claude\/hooks\/([A-Za-z0-9_.-]+)/);
    if (m && !fs.existsSync(path.join(BUNDLE, 'hooks', m[1]))) {
      issues.push({ file: '.claude/settings.json', type: 'hook', ref: m[1], detail: 'file hook không tồn tại' });
    }
  }
} catch (e) { /* bỏ qua settings parse lỗi đã có CI khác */ }

// Report
const byType = {};
for (const i of issues) (byType[i.type] = byType[i.type] || []).push(i);

const stats = Object.entries(byType).map(([t, v]) => `${t}: ${v.length}`).join(' · ');
console.log(`check-references: ${issues.length} issues (${stats})`);
const showAll = process.argv.includes('--all');
const cap = showAll ? Infinity : 25;
for (const [t, v] of Object.entries(byType)) {
  console.log(`\n── ${t} (${v.length}) ──`);
  const seen = new Set();
  for (const i of v.slice(0, cap)) {
    const key = `${i.file}:${i.line || ''}:${i.ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  ${i.file}${i.line ? ':' + i.line : ''}  ${i.ref} — ${i.detail}`);
  }
  if (!showAll && v.length > 25) console.log(`  … +${v.length - 25} nữa (xem file để biết đầy đủ)`);
}
console.log('\nexit 0 (warn-only) — review từng issue, không tự sửa mù.');
#!/usr/bin/env node
/**
 * generate-repo-facts.js — portable repo-facts generator.
 *
 * Detect stack của project hiện tại (nơi bundle .claude được cài) và render
 * `.claude/repo-facts.md` từ `.claude/repo-facts.template.md`, kèm data máy
 * đọc được ở `.claude/repo-facts.json` (check-references.js dùng file này
 * để resolve repo-root contracts mà không cần hardcode path).
 *
 * Cách dùng:  node .claude/tools/generate-repo-facts.js   (từ project root)
 *              hoặc  /portable  (command wrapper — generate + validate)
 *
 * Không phụ thuộc nơi chạy: project root = path.resolve(__dirname, '../..').
 */
'use strict';
const fs = require('fs');
const path = require('path');

const TOOLS_DIR = __dirname;
const CLAUDE_DIR = path.resolve(TOOLS_DIR, '..');
const ROOT = path.resolve(CLAUDE_DIR, '..'); // project root chứa .claude/

const TEMPLATE = path.join(CLAUDE_DIR, 'repo-facts.template.md');
const OUT_MD = path.join(CLAUDE_DIR, 'repo-facts.md');
const OUT_JSON = path.join(CLAUDE_DIR, 'repo-facts.json');

function exists(p) { try { return fs.statSync(p).isFile() || fs.statSync(p).isDirectory(); } catch { return false; } }

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function pkgName(pkg) {
  if (!pkg || !pkg.dependencies) return null;
  return pkg.dependencies;
}

function detectFramework(packageJsonPath) {
  const pkg = readJson(path.join(ROOT, packageJsonPath));
  if (!pkg) return '—';
  const deps = { ...pkgName(pkg), ...(pkg.devDependencies || {}) };
  if (deps['@nestjs/core']) return `NestJS ${(deps['@nestjs/core'] || '').replace(/^[^0-9]*/, '')}`;
  if (deps['express']) return `Express ${(deps['express'] || '').replace(/^[^0-9]*/, '')}`;
  if (deps['next']) return `Next.js ${(deps['next'] || '').replace(/^[^0-9]*/, '')}`;
  if (deps['vite']) return `Vite ${(deps['vite'] || '').replace(/^[^0-9]*/, '')}`;
  if (deps['@tanstack/react-query']) return `React + TanStack Query`;
  if (deps['react']) return `React ${(deps['react'] || '').replace(/^[^0-9]*/, '')}`;
  return 'không xác định (xem package.json)';
}

function detectPkgManager() {
  for (const [file, name] of [
    ['package-lock.json', 'npm'],
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
  ]) {
    if (exists(path.join(ROOT, file))) return name;
  }
  // lockfile ở backend/ / frontend/ khi monorepo không có lockfile root
  for (const sub of ['backend', 'frontend']) {
    for (const [file, name] of [
      ['package-lock.json', 'npm'],
      ['pnpm-lock.yaml', 'pnpm'],
      ['yarn.lock', 'yarn'],
      ['bun.lockb', 'bun'],
    ]) {
      if (exists(path.join(ROOT, sub, file))) return `${name} (${sub}/)`;
    }
  }
  return 'không phát hiện lockfile';
}

function listDirs(p) {
  try {
    return fs.readdirSync(p, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();
  } catch { return []; }
}

function detectCompose() {
  for (const file of ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml']) {
    const p = path.join(ROOT, file);
    if (!exists(p)) continue;
    let content;
    try { content = fs.readFileSync(p, 'utf8'); } catch { continue; }
    // Service names (không parse YAML — regex đủ cho compose phổ thông)
    const services = [];
    for (const m of content.matchAll(/^\s{2}([a-zA-Z0-9_-]+):\s*$/gm)) {
      if (['services', 'networks', 'volumes'].includes(m[1])) continue;
      services.push(m[1]);
    }
    if (services.length) return `${services.join(', ')} (${file})`;
    return file;
  }
  return 'không có docker-compose';
}

function detectCi() {
  const dir = path.join(ROOT, '.github', 'workflows');
  if (!exists(dir)) return 'không có CI';
  const jobs = new Set();
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))) {
    try {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      for (const m of content.matchAll(/^\s{2}([a-zA-Z0-9_-]+):\s*$/gm)) {
        if (['name', 'on', 'env', 'concurrency', 'defaults', 'permissions'].includes(m[1])) continue;
        jobs.add(m[1]);
      }
    } catch { /* bỏ qua file lỗi parse */ }
  }
  return jobs.size ? [...jobs].join(', ') : 'không phát hiện job';
}

function countFiles(globishDir) {
  // globishDir dạng '*bodies' — tìm dir match prefix rồi đếm *.md
  const [prefix, suffix] = globishDir.split('*');
  try {
    const matches = fs.readdirSync(ROOT, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name.startsWith(prefix) && e.name.endsWith(suffix || ''));
    let count = 0;
    for (const m of matches) {
      const dir = path.join(ROOT, m.name);
      count += fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
    }
    return count;
  } catch { return 0; }
}

function collect() {
  const backendPkg = path.join('backend', 'package.json');
  const frontendPkg = path.join('frontend', 'package.json');

  // chọn package.json nào tồn tại để detect framework
  const backHas = exists(path.join(ROOT, backendPkg));
  const frontHas = exists(path.join(ROOT, frontendPkg));

  let backend = '—';
  let frontend = '—';
  if (backHas) backend = detectFramework(backendPkg);
  if (frontHas) frontend = detectFramework(frontendPkg);
  if (!backHas && !frontHas) {
    const rootPkg = readJson(path.join(ROOT, 'package.json'));
    if (rootPkg && rootPkg.dependencies) backend = detectFramework('package.json');
  }

  const migrateDir = path.join(ROOT, 'backend', 'prisma', 'migrations');
  const migrationCount = exists(migrateDir)
    ? fs.readdirSync(migrateDir).filter(f => /^\d{14}_/.test(f)).length : 0;
  const corpus = countFiles('*-bodies');
  const corpusCount = corpus > 0
    ? `${corpus} file *.md trong *-bodies/` : 'không có (không phải repo content)';

  return {
    projectName: path.basename(ROOT),
    backendDetected: backHas ? backend : (frontHas ? '— (không có backend/)' : backend),
    frontendDetected: frontHas ? frontend : '—',
    pkgManager: detectPkgManager(),
    composeServices: detectCompose(),
    ciJobs: detectCi(),
    backendSrcDirs: backHas ? listDirs(path.join(ROOT, 'backend', 'src')).join(', ') : '—',
    migrationsCount: migrationCount ? `${migrationCount} migrations` : '0 (không có prisma/migrations)',
    corpusFiles: corpusCount,
  };
}

function render(facts) {
  const tpl = fs.readFileSync(TEMPLATE, 'utf8');
  const replacements = {
    '{{PROJECT_NAME}}': facts.projectName,
    '{{GENERATED_AT}}': new Date().toISOString().slice(0, 16).replace('T', ' '),
    '{{BACKEND_DETECTED}}': facts.backendDetected,
    '{{FRONTEND_DETECTED}}': facts.frontendDetected,
    '{{PKG_MANAGER}}': facts.pkgManager,
    '{{COMPOSE_SERVICES}}': facts.composeServices,
    '{{CI_JOBS}}': facts.ciJobs,
    '{{BACKEND_SRC_DIRS}}': facts.backendSrcDirs,
    '{{MIGRATIONS_COUNT}}': facts.migrationsCount,
    '{{CORPUS_FILES}}': facts.corpusFiles,
  };
  return tpl.replace(/\{\{[A-Z_]+\}\}/g, m => replacements[m] || `⚠️ template thiếu placeholder ${m}`);
}

function main() {
  const facts = collect();
  facts.generatedAt = new Date().toISOString();
  facts.repoRoot = ROOT; // check-references.js đọc field này thay cho hardcode

  fs.writeFileSync(OUT_JSON, JSON.stringify(facts, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, render(facts) + '\n');

  console.log(`repo-facts: generated for "${facts.projectName}"`);
  console.log(`  backend  : ${facts.backendDetected}`);
  console.log(`  frontend : ${facts.frontendDetected}`);
  console.log(`  pkg mgr  : ${facts.pkgManager}`);
  console.log(`  compose  : ${facts.composeServices}`);
  console.log(`  CI       : ${facts.ciJobs}`);
  console.log(`  migrations: ${facts.migrationsCount}`);
  console.log(`  corpus   : ${facts.corpusFiles}`);
  console.log(`  → ${path.relative(ROOT, OUT_MD)} (json: ${path.relative(ROOT, OUT_JSON)})`);
}

main();
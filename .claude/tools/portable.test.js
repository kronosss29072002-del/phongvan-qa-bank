#!/usr/bin/env node
/**
 * portable.test.js — regression test cho hệ portable (warn-only, exit 0).
 *
 * Chạy từ repo root:  node .claude/tools/portable.test.js
 * Hoặc qua:           bash .claude/tools/portable.test.sh
 *
 * Kiểm chứng: (1) generator resolve project root KHÔNG hardcode, (2) validator
 * không còn path cứng tới máy này, (3) template ↔ generator placeholder khớp nhau.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const TOOLS = __dirname;
const CLAUDE = path.resolve(TOOLS, '..');
const ROOT = path.resolve(CLAUDE, '..');

let failed = 0;
function check(name, cond, detail) {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond || !detail ? '' : ' — ' + detail}`);
  if (!cond) failed++;
}

// 1. Không hardcode path máy này trong tools portable
const genSrc = fs.readFileSync(path.join(TOOLS, 'generate-repo-facts.js'), 'utf8');
const refSrc = fs.readFileSync(path.join(TOOLS, 'check-references.js'), 'utf8');
check('generator không hardcode /home/kronosss2002', !genSrc.includes('/home/kronosss2002'));
check('check-references không hardcode medium-clone', !refSrc.includes('medium-clone'));
check('generator resolve root bằng __dirname', genSrc.includes('__dirname'));

// 2. Template ↔ generator placeholder khớp
const tpl = fs.readFileSync(path.join(CLAUDE, 'repo-facts.template.md'), 'utf8');
const tplPlaceholders = [...new Set(tpl.match(/\{\{[A-Z_]+\}\}/g) || [])].sort();
const replBlock = genSrc.slice(genSrc.indexOf('const replacements'));
const missingInGen = tplPlaceholders.filter(p => !replBlock.includes(`'${p}'`));
check('mọi placeholder trong template đều có trong generator', missingInGen.length === 0,
  missingInGen.join(', '));

// 3. Generator chạy được và sinh ra output hợp lệ
execFileSync(process.execPath, [path.join(TOOLS, 'generate-repo-facts.js')], { cwd: ROOT, stdio: 'pipe' });
const factsPath = path.join(CLAUDE, 'repo-facts.json');
check('repo-facts.json được sinh', fs.existsSync(factsPath));
const facts = JSON.parse(fs.readFileSync(factsPath, 'utf8'));
check('repo-facts.json có repoRoot', typeof facts.repoRoot === 'string' && facts.repoRoot.length > 0);
check('repo-facts.json repoRoot === project root', facts.repoRoot === ROOT, `${facts.repoRoot} vs ${ROOT}`);
check('repo-facts.md không còn placeholder chưa render', !/\{\{[A-Z_]+\}\}/.test(
  fs.readFileSync(path.join(CLAUDE, 'repo-facts.md'), 'utf8')));

// 4. Validator chạy được, warn-only (exit 0)
try {
  execFileSync(process.execPath, [path.join(TOOLS, 'check-references.js')], { cwd: ROOT, stdio: 'pipe' });
  check('check-references exit 0 (warn-only)', true);
} catch (e) {
  check('check-references exit 0 (warn-only)', false, 'exit ' + e.status);
}

// 5. Command /portable tồn tại
check('commands/portable.md tồn tại', fs.existsSync(path.join(CLAUDE, 'commands', 'portable.md')));

console.log(`\nportable.test: ${failed === 0 ? 'ALL PASS' : failed + ' FAILED'}`);

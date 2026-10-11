#!/usr/bin/env node

/**
 * Test script for scout-block.sh hook
 * Tests various tool inputs to verify blocking logic
 */

const { execFileSync } = require('child_process');
const path = require('path');

const testCases = [
  // Read-only directory ACCESS - now ALLOWED (LỚP 1b chỉ chặn GHI/XÓA; read/scan hợp lệ)
  {
    name: 'Bash: ls node_modules',
    input: { tool_name: 'Bash', tool_input: { command: 'ls node_modules' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: find -not -path */node_modules/*',
    input: { tool_name: 'Bash', tool_input: { command: "find . -not -path '*/node_modules/*'" } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: cat dist/bundle.js',
    input: { tool_name: 'Bash', tool_input: { command: 'cat dist/bundle.js' } },
    expected: 'ALLOWED'
  },

  // Write/destructive ops on blocked dirs - still BLOCKED
  {
    name: 'Bash: rm -rf node_modules',
    input: { tool_name: 'Bash', tool_input: { command: 'rm -rf node_modules' } },
    expected: 'BLOCKED'
  },
  {
    name: 'Bash: find . -delete',
    input: { tool_name: 'Bash', tool_input: { command: 'find . -delete' } },
    expected: 'BLOCKED'
  },

  // Path params (file_path/path/pattern) - still BLOCKED
  {
    name: 'Grep with node_modules path',
    input: { tool_name: 'Grep', tool_input: { pattern: 'test', path: 'node_modules' } },
    expected: 'BLOCKED'
  },
  {
    name: 'Glob with node_modules pattern',
    input: { tool_name: 'Glob', tool_input: { pattern: '**/node_modules/**' } },
    expected: 'BLOCKED'
  },
  {
    name: 'Read with node_modules file_path',
    input: { tool_name: 'Read', tool_input: { file_path: 'node_modules/package.json' } },
    expected: 'BLOCKED'
  },

  // Build commands - ALLOWED
  {
    name: 'Bash: npm build',
    input: { tool_name: 'Bash', tool_input: { command: 'npm build' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: pnpm build',
    input: { tool_name: 'Bash', tool_input: { command: 'pnpm build' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: yarn build',
    input: { tool_name: 'Bash', tool_input: { command: 'yarn build' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: npm run build',
    input: { tool_name: 'Bash', tool_input: { command: 'npm run build' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Bash: pnpm --filter web run build',
    input: { tool_name: 'Bash', tool_input: { command: 'pnpm --filter web run build 2>&1 | tail -100' } },
    expected: 'ALLOWED'
  },

  // Safe operations - ALLOWED
  {
    name: 'Grep with safe path',
    input: { tool_name: 'Grep', tool_input: { pattern: 'test', path: 'src' } },
    expected: 'ALLOWED'
  },
  {
    name: 'Read with safe file_path',
    input: { tool_name: 'Read', tool_input: { file_path: 'src/index.js' } },
    expected: 'ALLOWED'
  }
];

console.log('Testing scout-block.js hook...\n');

const scriptPath = path.join(__dirname, '..', 'scout-block.js');
let passed = 0;
let failed = 0;

for (const test of testCases) {
  try {
    const input = JSON.stringify(test.input);
    const result = execFileSync(process.execPath, [scriptPath], {
      input,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const actual = 'ALLOWED';
    const success = actual === test.expected;

    if (success) {
      console.log(`✓ ${test.name}: ${actual}`);
      passed++;
    } else {
      console.log(`✗ ${test.name}: expected ${test.expected}, got ${actual}`);
      failed++;
    }
  } catch (error) {
    const actual = error.status === 2 ? 'BLOCKED' : 'ERROR';
    const success = actual === test.expected;

    if (success) {
      console.log(`✓ ${test.name}: ${actual}`);
      passed++;
    } else {
      console.log(`✗ ${test.name}: expected ${test.expected}, got ${actual}`);
      console.log(`  Error: ${error.stderr.toString().trim()}`);
      failed++;
    }
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

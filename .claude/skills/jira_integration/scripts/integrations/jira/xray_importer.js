/**
 * xray_importer.js — import test results (Playwright JSON / JUnit XML / Allure JSON)
 * into Xray by converting them to the Xray JSON format and POSTing to
 * /import/execution (Cloud) or /rest/raven/<ver>/import/execution (Server).
 *
 * Usage:
 *   node xray_importer.js --format playwright --file ./test-results.json --project PROJ
 *   node xray_importer.js --format junit --file ./junit-results.xml --project PROJ
 *   node xray_importer.js --format allure --file ./allure-results --project PROJ
 *   node xray_importer.js --format playwright --file ./test-results.json \
 *       --project PROJ --test-execution-key XRAY-456 --dry-run
 *
 * Env: XRAY_PLATFORM=cloud|server (default cloud),
 *      XRAY_CLIENT_ID + XRAY_CLIENT_SECRET (cloud),
 *      JIRA_BASE_URL + JIRA_PAT (server; JIRA_EMAIL+JIRA_API_TOKEN also accepted),
 *      XRAY_RAVEN_API_VERSION (server, default 1.0).
 *
 * Test key convention: `[PROJ-123] <test title>` in the test name — the bracket
 * prefix is stripped from the summary and used as testKey for mapping.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createXrayAxios, formatAxiosError, parseArgs } from './utils.js';

const CLOUD_STATUS = { passed: 'PASSED', failed: 'FAILED', skipped: 'SKIPPED' };
const SERVER_STATUS = { passed: 'PASS', failed: 'FAIL', skip: 'SKIP' };

const USAGE = `Usage: node xray_importer.js --format <fmt> --file <path> [options]

Formats (converted to Xray JSON, posted to /import/execution):
  playwright   Playwright JSON report (npx playwright test --reporter=json)
  junit        JUnit XML report (testsuite/testcase; lenient parser)
  allure       Allure results directory (read *-result.json files)

Options:
  --format fmt            playwright | junit | allure (required)
  --file path             report file or (allure) results dir (required)
  --project KEY           project key for auto-created test execution (required)
  --test-execution-key K  attach results to an existing test execution
  --summary text          override the test execution summary
  --dry-run               build payload and print summary without importing
  --help                  show this help`;

const KEY_RE = /^\[([A-Z][A-Z0-9_]*-\d+)]\s*/;

function truncate(str, max = 4000) {
  const s = String(str ?? '').trim();
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// ---------------------------------------------------------------------------
// Input readers
// ---------------------------------------------------------------------------

function readPlaywright(filePath) {
  const report = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!Array.isArray(report.suites)) {
    throw new Error(`Playwright report at ${filePath} has no "suites" array. Is it a --reporter=json output?`);
  }

  const out = [];
  const walk = (suite) => {
    for (const t of suite.tests || []) {
      const startMs = Date.parse(t.startTime);
      out.push({
        title: t.title,
        status: t.status === 'timedOut' || t.status === 'interrupted' || t.status === 'flaky'
          ? 'failed'
          : t.status,
        start: t.startTime,
        finish: Number.isFinite(startMs) ? new Date(startMs + t.duration).toISOString() : undefined,
        comment: (t.errors || []).map((e) => e.message).filter(Boolean).join('\n'),
      });
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const suite of report.suites) walk(suite);
  return out;
}

/**
 * Lenient JUnit XML parser: extracts <testcase name classname time> blocks and
 * classifies by presence of <failure> / <error> / <skipped> children.
 * Handles standard output from Jest, pytest, surefire, and friends.
 */
function readJunit(filePath) {
  const xml = readFileSync(filePath, 'utf8');
  const out = [];
  const attrRe = /([\w:-]+)\s*=\s*"([^"]*)"/g;

  const parseAttrs = (raw) => {
    const attrs = {};
    let m;
    while ((m = attrRe.exec(raw)) !== null) attrs[m[1]] = m[2];
    return attrs;
  };
  const decode = (s) => String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&');

  // Split each <testcase …> head from its body; a head ending in "/" is
  // self-closing (a passing test with no children).
  const openRe = /<testcase\b([^>]*)>/g;
  let m;
  while ((m = openRe.exec(xml)) !== null) {
    const head = m[1];
    const attrs = parseAttrs(head);

    let body = '';
    if (!head.trimEnd().endsWith('/')) {
      const closeIdx = xml.indexOf('</testcase>', m.index + m[0].length);
      if (closeIdx === -1) break; // malformed file — stop, keep what was parsed
      body = xml.slice(m.index + m[0].length, closeIdx);
    }

    const name = attrs.name ? decode(attrs.name) : '(unnamed test)';
    const className = attrs.classname ? decode(attrs.classname) : undefined;

    let status = 'passed';
    let comment = '';
    if (/<skipped\b/.test(body)) status = 'skipped';
    if (/<error\b/.test(body)) status = 'failed';
    if (/<failure\b/.test(body)) {
      status = 'failed';
      const fm = /<failure\b[^>]*message="([^"]*)"/.exec(body);
      const text = /<failure\b[^>]*>([\s\S]*?)<\/failure>/.exec(body);
      if (fm || text) {
        comment = decode((fm ? fm[1] : '') + ' ' + (text ? text[1] : '')).trim().slice(0, 4000);
      }
    }
    out.push({ title: className ? `${className}.${name}` : name, status, comment });
  }
  return out;
}

function readAllure(dirPath) {
  const entries = readdirSync(dirPath).filter((f) => f.endsWith('-result.json'));
  if (entries.length === 0) {
    throw new Error(`No *-result.json files found in ${dirPath}. Point --file at the allure-results directory.`);
  }
  const out = [];
  for (const name of entries) {
    const result = JSON.parse(readFileSync(`${dirPath}/${name}`, 'utf8'));
    out.push({
      title: result.name || name.replace(/-result\.json$/, ''),
      status: result.status === 'passed' ? 'passed'
        : result.status === 'failed' || result.status === 'broken' ? 'failed'
        : result.status === 'skipped' ? 'skipped'
        : 'skipped',
      start: result.start ? new Date(result.start).toISOString() : undefined,
      finish: result.stop ? new Date(result.stop).toISOString() : undefined,
      comment: truncate(
        [result.statusDetails?.message, result.statusDetails?.trace].filter(Boolean).join('\n')
      ),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Xray JSON payload
// ---------------------------------------------------------------------------

function extractTestKey(title) {
  const m = KEY_RE.exec(title);
  return m ? m[1] : null;
}

function buildPayload({ rawTests, project, platform, testExecutionKey, summary }) {
  const statusMap = platform === 'cloud' ? CLOUD_STATUS : SERVER_STATUS;
  const tests = rawTests.map((t) => {
    const test = { status: statusMap[t.status] || statusMap.failed };
    if (t.start) test.start = t.start;
    if (t.finish) test.finish = t.finish;
    if (t.comment) test.comment = truncate(t.comment);

    const key = extractTestKey(t.title);
    if (key) {
      test.testKey = key;
    } else {
      test.testInfo = {
        summary: t.title,
        type: 'Generic',
        projectKey: project,
      };
    }
    return test;
  });

  const payload = { tests };
  if (testExecutionKey) payload.testExecutionKey = testExecutionKey;
  payload.info = {
    project,
    summary: summary || `Test execution — ${new Date().toISOString()}`,
  };
  return payload;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

async function importToCloud(payload, token) {
  const axios = createXrayAxios(token);
  const { data } = await axios.post('/import/execution', payload);
  return data;
}

async function importToServer(payload) {
  const baseUrl = (process.env.JIRA_BASE_URL || '').replace(/\/+$/, '');
  const apiVersion = process.env.XRAY_RAVEN_API_VERSION || '1.0';
  if (!baseUrl) throw new Error('JIRA_BASE_URL is required for Xray Server import.');

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.JIRA_PAT) {
    headers['Authorization'] = `Bearer ${process.env.JIRA_PAT}`;
  } else if (process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN) {
    headers['Authorization'] = `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`;
  } else {
    throw new Error('Set JIRA_PAT or JIRA_EMAIL + JIRA_API_TOKEN for Xray Server import.');
  }

  const { default: axios } = await import('axios');
  const { data } = await axios.post(
    `${baseUrl}/rest/raven/${apiVersion}/import/execution`,
    payload,
    { headers, timeout: 60_000 }
  );
  return data;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { opts } = parseArgs();
  if (opts.help || !opts.format || !opts.file || !opts.project) {
    console.log(USAGE);
    if (!opts.help) process.exit(1);
    process.exit(0);
  }

  const platform = (process.env.XRAY_PLATFORM || 'cloud').toLowerCase();
  if (!['cloud', 'server'].includes(platform)) {
    console.error(`XRAY_PLATFORM must be "cloud" or "server", got "${platform}".`);
    process.exit(1);
  }

  const filePath = opts.file;
  let inputStat;
  try {
    inputStat = statSync(filePath);
  } catch {
    console.error(`Path not found: ${filePath}`);
    process.exit(1);
  }
  if (!inputStat.isFile() && !(opts.format === 'allure' && inputStat.isDirectory())) {
    console.error(`--file must point to a file (or a directory for --format allure): ${filePath}`);
    process.exit(1);
  }
  if (opts.format === 'allure' && !inputStat.isDirectory()) {
    console.error(`--format allure requires a directory, got a file: ${filePath}`);
    process.exit(1);
  }

  let rawTests;
  try {
    rawTests = opts.format === 'playwright' ? readPlaywright(filePath)
      : opts.format === 'junit' ? readJunit(filePath)
      : readAllure(filePath);
  } catch (err) {
    console.error(`Failed to parse ${opts.format} input: ${err.message}`);
    process.exit(1);
  }

  if (rawTests.length === 0) {
    console.error(`No tests found in ${filePath}.`);
    process.exit(1);
  }

  const payload = buildPayload({
    rawTests,
    project: opts.project,
    platform,
    testExecutionKey: opts['test-execution-key'],
    summary: opts.summary,
  });

  const byStatus = {};
  for (const t of rawTests) byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  const withKeys = rawTests.filter((t) => extractTestKey(t.title)).length;

  console.log(`Parsed ${rawTests.length} tests from ${opts.format}`);
  console.log(`  status: ${Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`  mapped via [KEY] prefix: ${withKeys} · auto-creating: ${rawTests.length - withKeys}`);

  if (opts['dry-run']) {
    console.log(`DRY RUN — would POST to ${platform === 'cloud' ? 'https://xray.cloud.getxray.app/api/v2/import/execution' : `${process.env.JIRA_BASE_URL}/rest/raven/${process.env.XRAY_RAVEN_API_VERSION || '1.0'}/import/execution`}`);
    console.log(`Payload head:\n${JSON.stringify(payload.tests[0], null, 2)}`);
    return;
  }

  try {
    const result = platform === 'cloud'
      ? await importToCloud(payload, await getCloudToken())
      : await importToServer(payload);
    const execKey = result.testExecIssue?.key || result.key || '(no key returned)';
    console.log(`Imported ${payload.tests.length} tests → Test Execution ${execKey}`);
  } catch (err) {
    console.error(formatAxiosError(err, 'Xray import failed'));
    process.exit(1);
  }
}

async function getCloudToken() {
  const clientId = process.env.XRAY_CLIENT_ID;
  const clientSecret = process.env.XRAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Set XRAY_CLIENT_ID and XRAY_CLIENT_SECRET for Xray Cloud import.');
  }
  const { data } = await createXrayAxios(null).post('/authenticate', {
    client_id: clientId,
    client_secret: clientSecret,
  });
  return data;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
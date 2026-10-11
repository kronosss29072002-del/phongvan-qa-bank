/**
 * Shared utilities for Jira / Xray integration CLIs.
 * Zero deps beyond axios + dotenv (loaded from the integrations/ root).
 */

import axios from 'axios';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INTEGRATIONS_ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// dotenv — silently skips when .env is missing
// ---------------------------------------------------------------------------
const envPath = resolve(INTEGRATIONS_ROOT, '.env');
if (existsSync(envPath)) {
  // ESM dotenv import
  const dotenv = await import('dotenv');
  dotenv.config({ path: envPath });
}

export function env(key, fallback) {
  const val = process.env[key];
  if (val !== undefined) return val;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${key}. Set it in .env or export it.`);
}

// ---------------------------------------------------------------------------
// Axios instances
// ---------------------------------------------------------------------------

/**
 * Authenticated axios instance for Jira REST API.
 * Cloud  → Basic Auth (email + API token).
 * Server → Bearer PAT.
 */
export function createJiraAxios() {
  const baseUrl = env('JIRA_BASE_URL').replace(/\/+$/, '');
  const pat = process.env['JIRA_PAT'];
  const email = process.env['JIRA_EMAIL'];
  const apiToken = process.env['JIRA_API_TOKEN'];

  const headers = { Accept: 'application/json' };

  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
  } else if (email && apiToken) {
    headers['Authorization'] = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;
  } else {
    throw new Error(
      'No Jira credentials found. Set JIRA_PAT (Server) or JIRA_EMAIL + JIRA_API_TOKEN (Cloud).'
    );
  }

  return axios.create({ baseURL: baseUrl, headers, timeout: 30_000 });
}

/**
 * Authenticated axios instance for Xray Cloud REST API v2.
 */
export function createXrayAxios(token) {
  const baseUrl = 'https://xray.cloud.getxray.app/api/v2';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return axios.create({ baseURL: baseUrl, headers, timeout: 60_000 });
}

// ---------------------------------------------------------------------------
// JQL helpers
// ---------------------------------------------------------------------------

/** Escape a value for safe inclusion inside a JQL string literal. */
export function jqlEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

/**
 * Fetch all pages of a Jira paginated endpoint.
 * `fetchPage(startAt)` must return { data: [...], total: number }.
 * Yields individual items as a flat async iterable.
 */
export async function* paginateJira(fetchPage, maxItems = Infinity) {
  let startAt = 0;
  const pageSize = 50;
  let yielded = 0;

  while (yielded < maxItems) {
    const page = await fetchPage(startAt, pageSize);
    const items = Array.isArray(page) ? page : page.data || [];
    const total = typeof page.total === 'number' ? page.total : items.length;

    for (const item of items) {
      if (yielded >= maxItems) return;
      yield item;
      yielded++;
    }

    startAt += items.length;
    if (startAt >= total || items.length === 0) break;
  }
}

// ---------------------------------------------------------------------------
// ADF → plain text (Jira Cloud descriptions are Atlassian Document Format)
// ---------------------------------------------------------------------------

export function adfToPlainText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node.text === 'string') return node.text;

  const inner = Array.isArray(node.content) ? node.content.map(adfToPlainText).join('') : '';

  if (node.type === 'heading') {
    const level = node.attrs?.level || 1;
    return `${'#'.repeat(level)} ${inner}\n`;
  }
  if (node.type === 'paragraph') return inner ? inner + '\n' : '';
  if (node.type === 'bulletList' || node.type === 'orderedList') {
    const items = (node.content || []).map((li) => {
      const text = adfToPlainText(li).trim();
      return text ? (node.type === 'bulletList' ? `- ${text}` : `1. ${text}`) : '';
    }).filter(Boolean);
    return items.length ? items.join('\n') + '\n' : '';
  }
  if (node.type === 'codeBlock') {
    return inner ? '```\n' + inner + '\n```\n' : '';
  }
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'rule') return '\n---\n';
  if (node.type === 'table') {
    const rows = (node.content || []).map((row) => {
      const cells = (row.content || []).map((cell) => adfToPlainText(cell).trim());
      return `| ${cells.join(' | ')} |`;
    });
    return rows.length ? rows.join('\n') + '\n' : '';
  }
  if (node.type === 'tableCell' || node.type === 'tableHeader') return inner;
  if (node.type === 'tableRow') return inner;
  // panel, blockquote, expand, media, text nodes, unknown types: keep content
  if (node.type === 'blockquote') return inner ? '> ' + inner.trim().replace(/\n/g, '\n> ') + '\n' : '';
  return inner;
}

// ---------------------------------------------------------------------------
// Error formatting
// ---------------------------------------------------------------------------

/**
 * Format an axios/error into a readable message with HTTP status + context.
 */
export function formatAxiosError(err, context = '') {
  if (err.response) {
    const status = err.response.status;
    const body = typeof err.response.data === 'string'
      ? err.response.data.slice(0, 500)
      : JSON.stringify(err.response.data || {}).slice(0, 500);
    return `[HTTP ${status}] ${context ? context + ': ' : ''}${body}`;
  }
  if (err.code) return `[${err.code}] ${context ? context + ': ' : ''}${err.message}`;
  return err.message || String(err);
}

// ---------------------------------------------------------------------------
// CLI arg parser (lightweight, no deps)
// ---------------------------------------------------------------------------

/**
 * Parse process.argv into an object:  --key value → { key: "value" }.
 * Flags without a value become true.  Stops at the first non-option arg.
 */
export function parseArgs(argv = process.argv.slice(2)) {
  const opts = {};
  let positional = [];
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === '--') { positional.push(...argv.slice(i + 1)); break; }
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        opts[key] = argv[++i];
      } else {
        opts[key] = true;
      }
    } else {
      positional.push(arg);
    }
    i++;
  }
  return { opts, positional };
}

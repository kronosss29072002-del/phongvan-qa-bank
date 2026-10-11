/**
 * xray_auth.js — authenticate with Xray and (optionally) verify the token.
 *
 * Cloud:   POST https://xray.cloud.getxray.app/api/v2/authenticate
 *          body { client_id, client_secret } → JWT string (no "Bearer" prefix)
 * Server:  uses Jira base URL + PAT; no separate auth call — Bearer PAT is sent
 *          directly with each request to /rest/raven/... (Raven API v1.0)
 *
 * Usage:
 *   node xray_auth.js                          # print token only
 *   node xray_auth.js --verify                 # auth + verify with a real API call
 *   node xray_auth.js --save                   # write token to .xray-token in integrations/
 *
 * Env: XRAY_PLATFORM=cloud|server (default cloud), XRAY_CLIENT_ID,
 *      XRAY_CLIENT_SECRET (cloud); JIRA_BASE_URL, JIRA_PAT (server).
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createXrayAxios, formatAxiosError, parseArgs, env } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TOKEN_FILE = resolve(__dirname, '..', '.xray-token');

const USAGE = `Usage:
  node xray_auth.js                # print Xray token
  node xray_auth.js --verify       # authenticate then verify with a real API call
  node xray_auth.js --save         # also write the token to .xray-token (gitignored)
  node xray_auth.js --help`;

async function authenticateCloud() {
  const clientId = env('XRAY_CLIENT_ID');
  const clientSecret = env('XRAY_CLIENT_SECRET');
  const { data } = await createXrayAxios(null).post('/authenticate', {
    client_id: clientId,
    client_secret: clientSecret,
  });
  if (typeof data !== 'string' || data.length < 20) {
    throw new Error(`Unexpected authenticate response (expected JWT string): ${JSON.stringify(data)}`);
  }
  return data;
}

async function verifyToken(platform, token) {
  if (platform === 'cloud') {
    const { data } = await createXrayAxios(token).get('/test');
    return `Cloud OK: /test returned ${typeof data === 'object' ? JSON.stringify(data).slice(0, 120) : JSON.stringify(data)}`;
  }
  // Server: Raven API has no clean ping endpoint; use the Jira base to confirm
  // the PAT is accepted by the instance (Raven endpoints also need Jira project perms).
  const baseUrl = process.env.JIRA_BASE_URL;
  if (!baseUrl) {
    throw new Error('JIRA_BASE_URL is required for Xray Server verification.');
  }
  const { default: axios } = await import('axios');
  const { data } = await axios.get(`${baseUrl.replace(/\/+$/, '')}/rest/api/2/myself`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return `Server OK: authenticated as ${data.displayName || data.name || 'unknown user'} (${data.key || data.emailAddress || ''})`;
}

async function main() {
  const { opts } = parseArgs();
  if (opts.help) {
    console.log(USAGE);
    process.exit(0);
  }

  const platform = (process.env.XRAY_PLATFORM || 'cloud').toLowerCase();
  if (!['cloud', 'server'].includes(platform)) {
    console.error(`XRAY_PLATFORM must be "cloud" or "server", got "${platform}".`);
    process.exit(1);
  }

  let token;
  try {
    token = platform === 'cloud'
      ? await authenticateCloud()
      : env('JIRA_PAT'); // Server: PAT is the token, no separate auth call
  } catch (err) {
    console.error(formatAxiosError(err, 'Xray authentication failed'));
    process.exit(1);
  }

  if (opts['save']) {
    try {
      writeFileSync(TOKEN_FILE, token.trim() + '\n', { mode: 0o600 });
      console.log(`Token saved to ${TOKEN_FILE}`);
    } catch (err) {
      console.error(`Could not write token file: ${err.message}`);
      process.exit(1);
    }
  }

  if (opts['verify']) {
    try {
      console.log(await verifyToken(platform, token));
    } catch (err) {
      console.error(formatAxiosError(err, 'Token verification failed'));
      process.exit(1);
    }
  } else {
    console.log(token);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
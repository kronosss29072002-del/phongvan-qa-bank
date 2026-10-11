/**
 * jira_fetcher.js — fetch Jira issues / requirements and render as JSON or Markdown.
 *
 * Usage:
 *   node jira_fetcher.js --issue PROJ-123
 *   node jira_fetcher.js --issue PROJ-123 --format md
 *   node jira_fetcher.js --project PROJ --type Story --max 20
 *   node jira_fetcher.js --jql "project = PROJ AND status = 'To Do'"
 *   node jira_fetcher.js --epic PROJ-10 --format md
 *
 * Env (see SKILL.md): JIRA_BASE_URL, JIRA_EMAIL + JIRA_API_TOKEN (Cloud)
 *                    or JIRA_PAT (Server), JIRA_PROJECT_KEY (optional default)
 */

import { createJiraAxios, adfToPlainText, paginateJira, formatAxiosError, parseArgs, jqlEscape } from './utils.js';

const USAGE = `Usage:
  node jira_fetcher.js --issue <KEY> [--format md|json]
  node jira_fetcher.js --project <KEY> [--type <ISSUETYPE>] [--max N] [--format md|json]
  node jira_fetcher.js --jql "<JQL>" [--max N] [--format md|json]
  node jira_fetcher.js --epic <KEY> [--format md|json]

Options:
  --issue KEY     Fetch a single issue by key
  --project KEY   Fetch issues in a project (env JIRA_PROJECT_KEY used if omitted)
  --type TYPE     Filter by issue type (e.g. Story, Bug, Task, Requirement)
  --jql "..."     Raw JQL query (overrides project/type)
  --epic KEY      Fetch child issues of an epic
  --max N         Max issues to return (default 50)
  --format fmt    Output format: json | md (default json)
  --help          Show this help`;

function jiraDescription(issue) {
  const desc = issue.fields?.description;
  if (!desc) return '';
  if (typeof desc === 'string') return desc; // Server: plain text
  return adfToPlainText(desc);               // Cloud: ADF
}

function jiraIssueToObject(issue) {
  return {
    key: issue.key,
    id: issue.id,
    type: issue.fields?.issuetype?.name || null,
    status: issue.fields?.status?.name || null,
    summary: issue.fields?.summary || '',
    priority: issue.fields?.priority?.name || null,
    assignee: issue.fields?.assignee?.displayName || null,
    reporter: issue.fields?.reporter?.displayName || null,
    created: issue.fields?.created || null,
    updated: issue.fields?.updated || null,
    labels: issue.fields?.labels || [],
    components: (issue.fields?.components || []).map((c) => c.name),
    fixVersions: (issue.fields?.fixVersions || []).map((v) => v.name),
    storyPoints: issue.fields?.customfield_10016 ?? null, // common Cloud field; may vary
    description: jiraDescription(issue),
    url: issue.self || null,
  };
}

function renderMarkdown(issues, meta = {}) {
  const lines = [];
  if (meta.title) lines.push(`# ${meta.title}`, '');

  for (const issue of issues) {
    lines.push(`## ${issue.key} — ${issue.summary}`);
    lines.push('');
    lines.push(`- **Type:** ${issue.type || 'n/a'}`);
    lines.push(`- **Status:** ${issue.status || 'n/a'}`);
    if (issue.priority) lines.push(`- **Priority:** ${issue.priority}`);
    if (issue.assignee) lines.push(`- **Assignee:** ${issue.assignee}`);
    lines.push('');
    if (issue.description) {
      lines.push(issue.description.trim(), '');
    } else {
      lines.push('_No description._', '');
    }
    lines.push('---', '');
  }
  return lines.join('\n');
}

async function fetchSingleIssue(axios, key) {
  const { data } = await axios.get(`/rest/api/2/issue/${encodeURIComponent(key)}`);
  return jiraIssueToObject(data);
}

async function fetchByJql(axios, jql, max) {
  const issues = [];
  for await (const issue of paginateJira(async (startAt, maxResults) => {
    const { data } = await axios.get('/rest/api/2/search', {
      params: {
        jql,
        startAt,
        maxResults,
        fields: 'summary,issuetype,status,priority,assignee,reporter,created,updated,labels,components,fixVersions,description,parent,subtasks',
      },
    });
    return { data: data.issues, total: data.total };
  }, max)) {
    issues.push(issue);
  }
  return issues.map(jiraIssueToObject);
}

async function fetchChildrenOfEpic(axios, epicKey, max) {
  // Get epic's project + classic-style "parent" search; fall back to resolution through search API.
  const { data: epic } = await axios.get(`/rest/api/2/issue/${encodeURIComponent(epicKey)}`, {
    params: { fields: 'summary,project,issuetype' },
  });
  const parent = epic.fields?.issuetype?.name?.toLowerCase() === 'epic'
    ? epicKey
    : epic.fields?.parent?.key;
  if (!parent) {
    throw new Error(`Issue ${epicKey} is not an epic and has no parent epic.`);
  }
  return fetchByJql(axios, `"parent" = "${parent}" ORDER BY created ASC`, max);
}

async function main() {
  const { opts } = parseArgs();
  if (opts.help || Object.keys(opts).length === 0) {
    console.log(USAGE);
    process.exit(0);
  }

  const format = opts.format || 'json';
  if (!['json', 'md'].includes(format)) {
    console.error(`Unknown format "${format}". Use json or md.`);
    process.exit(1);
  }

  const max = opts.max !== undefined ? Number(opts.max) : 50;
  if (!Number.isInteger(max) || max < 1) {
    console.error(`--max must be a positive integer, got "${opts.max}".`);
    process.exit(1);
  }

  const axios = createJiraAxios();
  let issues = [];
  let title = null;

  try {
    if (opts.issue) {
      issues = [await fetchSingleIssue(axios, opts.issue)];
      title = `Requirement ${opts.issue}`;
    } else if (opts.jql) {
      issues = await fetchByJql(axios, opts.jql, max);
    } else if (opts.epic) {
      issues = await fetchChildrenOfEpic(axios, opts.epic, max);
      title = `Story / Task of epic ${opts.epic} (${issues.length})`;
    } else if (opts.project) {
      const project = opts.project;
      const jql = opts.type
        ? `project = "${jqlEscape(project)}" AND issuetype = "${jqlEscape(opts.type)}" ORDER BY created DESC`
        : `project = "${jqlEscape(project)}" ORDER BY created DESC`;
      issues = await fetchByJql(axios, jql, max);
      title = `${project} — ${opts.type || 'all issue types'} (${issues.length})`;
    } else {
      const fallbackProject = process.env.JIRA_PROJECT_KEY;
      if (fallbackProject) {
        issues = await fetchByJql(axios, `project = "${jqlEscape(fallbackProject)}" ORDER BY created DESC`, max);
        title = `${fallbackProject} — all issues (${issues.length})`;
      } else {
        console.error(USAGE);
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(formatAxiosError(err, 'Jira request failed'));
    process.exit(1);
  }

  if (format === 'md') {
    if (issues.length === 0) {
      console.log(title ? `# ${title}\n\n_No issues found._` : '_No issues found._');
    } else {
      console.log(renderMarkdown(issues, { title }));
    }
  } else {
    console.log(JSON.stringify({ title, count: issues.length, issues }, null, 2));
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
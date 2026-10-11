#!/usr/bin/env node
/**
 * Deep Budget Mode — Stop hook.
 *
 * Decide whether Claude may stop, based on REAL token usage measured from
 * the session transcript (message.usage fields), with guessed estimates as
 * fallback when the transcript is unavailable.
 *
 * Exit code 2 + JSON reason  -> keep working (budget not consumed)
 * Exit code 0                 -> allow stop
 *
 * Auto-allows stop when stop_hook_active=true (block cap reached).
 */
const fs = require('fs');
const path = require('path');

const BUDGET_FILE = path.join(process.cwd(), '.claude', 'deep-budget.json');
const TOLERANCE = 100000; // ±100k: allow stop within this of target

/** Round down to next multiple of checkpoint (e.g. 250k, 500k, 1M). */
function checkpointLevel(used) {
  const cps = [1000000, 500000, 100000];
  for (const cp of cps) {
    const lvl = Math.floor(used / cp) * cp;
    if (lvl > 0) return { lvl, cp };
  }
  return null;
}

/** Sum real usage per line; returns {used, counted} or null on any problem. */
function countTranscript(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;
  let used = 0;
  let counted = 0;
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      let entry;
      try { entry = JSON.parse(line); } catch (e) { continue; }
      let usage = null;
      if (entry && entry.message && entry.message.usage) usage = entry.message.usage;
      else if (entry && entry.usage) usage = entry.usage;
      if (!usage) continue;
      const tokens =
        (usage.input_tokens | 0) +
        (usage.output_tokens | 0) +
        (usage.cache_creation_input_tokens | 0);
      if (tokens > 0) { used += tokens; counted++; }
    }
    return { used, counted };
  } catch (e) {
    return null;
  }
}

function main() {
  let inputData = '';
  try { inputData = fs.readFileSync(0, 'utf-8'); } catch (e) { process.exit(0); }
  let hook;
  try { hook = JSON.parse(inputData); } catch (e) { process.exit(0); }

  // Block cap reached — allow stop (prevents infinite loop)
  if (hook.stop_hook_active === true) process.exit(0);

  let budget;
  try { budget = JSON.parse(fs.readFileSync(BUDGET_FILE, 'utf-8')); }
  catch (e) { process.exit(0); } // skill not active

  // Prefer real transcript count; fall back to guessed estimate
  const t = countTranscript(hook.transcript_path);
  const used = t ? t.used : (budget.usedGuess || 0);

  budget.usedReal = t ? t.used : (budget.usedReal || 0);
  budget.lastTranscriptPath = hook.transcript_path || budget.lastTranscriptPath;
  try { fs.writeFileSync(BUDGET_FILE, JSON.stringify(budget, null, 2)); } catch (e) {}

  const target = budget.targetTokens || 0;
  const remaining = target - used;

  if (remaining <= TOLERANCE) {
    budget.completed = true;
    try { fs.writeFileSync(BUDGET_FILE, JSON.stringify(budget, null, 2)); } catch (e) {}
    process.exit(0); // allow stop
  }

  // Pacing: emit checkpoint milestone once, then stay quiet (avoid logging every block)
  let pacingNote = '';
  if (budget.checkpointsSeen === undefined) budget.checkpointsSeen = [];
  const cp = checkpointLevel(used);
  if (cp && !budget.checkpointsSeen.includes(cp.lvl)) {
    budget.checkpointsSeen.push(cp.lvl);
    pacingNote = ` [checkpoint passed: ${cp.lvl.toLocaleString()}]`;
  }

  budget.usedReal = used;
  budget.lastUpdated = 'now';
  try { fs.writeFileSync(BUDGET_FILE, JSON.stringify(budget, null, 2)); } catch (e) {}

  const reason =
    `Deep Budget Mode: ~${used.toLocaleString()} / ${target.toLocaleString()} tokens used ` +
    `(${((used / target) * 100).toFixed(1)}%, ${t ? 'real transcript' : 'estimated'} count).` +
    `${pacingNote} ~${remaining.toLocaleString()} remaining — continue the next phase from ` +
    `.claude/deep-budget-plan.md (recon → research → design → implement → verify → review). ` +
    `Do not stop yet.`;
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(2);
}

main();
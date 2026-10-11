---
name: deep-budget-mode
description: Force Claude Code to consume a user-specified token budget before stopping. Use when user says "sử dụng X token", "use X tokens and finish the project", "deep work", "deep-budget", or wants sustained multi-session work without premature stopping. Sets up a Stop hook that blocks Claude from stopping until the estimated budget is consumed. NOT for quick tasks.
---

# Deep Budget Mode

## What This Does

Makes Claude Code keep working until ~N tokens consumed (±100k tolerance).
Uses Stop hook + heuristic estimation + mandatory deep-thinking protocol.

## Key Design (real counting, not guessing)

- The **Stop hook counts REAL usage** from the session transcript
  (`message.usage`: input + output + cache_creation) — not the model's guess.
- Per-message usage is small for all but the largest turns, so the hook always
  stops within **±100k** of target. cumulative usage is the sum of every
  `usage` line, regardless of compaction/session length.
- `usedGuess` (model estimates per phase) is only a fallback when the
  transcript is unavailable.
- Block cap (8) auto-allows a stop; on block, the hook's `reason` is fed back
  to Claude as the next instruction (continue working).

## When to Use

- User explicitly sets large budget ("sử dụng X token", "use 10B tokens")
- Exhaustive project completion expected
- Deep work / marathon sessions

## Activation Protocol

### 1. Parse budget
```bash
python3 .claude/skills/deep-budget-mode/scripts/init_budget.py <target_tokens>
```
Accepts natural language: '10 tỷ', '1.5M', '500k', '1000000', '2 triệu'.

### 2. Install Stop hook
```bash
cp .claude/skills/deep-budget-mode/scripts/check_budget.js .claude/hooks/check_budget.js
chmod +x .claude/hooks/check_budget.js
```
Add Stop hook config to `.claude/settings.json` — see [references/hook-setup.md](references/hook-setup.md).

### 3. Execute — mandatory protocol

**Every phase follows [references/research-protocol.md](references/research-protocol.md):**
RECON → RESEARCH → DESIGN → IMPLEMENT → VERIFY → REVIEW

Apply [references/thinking-framework.md](references/thinking-framework.md) throughout:
- Hunt Before You Build (never code blind)
- Generate → Eliminate → Select (consider alternatives)
- Pre-Flight Checklist (before every implementation)
- Adversarial Self-Critique (after every deliverable)

**Plan file:** Maintain `.claude/deep-budget-plan.md` — append per phase with
what, why, alternatives considered, chosen approach, reasoning, verification results.

After each phase:
```bash
python3 .claude/skills/deep-budget-mode/scripts/update_budget.py <estimate> "<phase description>"
```

## Agent Orchestration (use them, don't solo)

| Need | Agent |
|------|-------|
| Locate code | Explore / scout |
| Library docs | WebFetch / Context7 / researcher |
| Design options | planner / brainstormer |
| Diagnose failure | debugger |
| Code quality | code-reviewer |

## Estimation
[references/estimation-guide.md](references/estimation-guide.md).
Rule of thumb: each tool call ≈ 5k-20k tokens. Update per phase (10-30 total).

## Session Continuation (marathon)

- **Compaction:** never reset progress; `usedReal` keeps summing real usage.
  When context fills, update the budget file + plan file, then continue;
  the Stop hook keeps blocking until the target is met.
- **Cross-session:** `claude --continue` resumes the same transcript, so the
  hook keeps counting. On resume, follow
  [references/system-prompt-resume.md](references/system-prompt-resume.md):
  read budget file + plan file FIRST, continue from the first incomplete
  phase — never re-plan or redo.
- If blocked by UI/environment limits for a long time (3+ compactions without
  progress), tell the user and reassess the target.
- **API errors (524/5xx):** Run marathon via
  [scripts/robust-resume.sh](scripts/robust-resume.sh) instead of bare `claude`.
  It auto-detects 524/ETIMEDOUT/ECONNRESET, backs off (20s→5min exponential),
  and retries with `claude --continue` up to 10×. This uses the SHARED engine
  [.claude/skills/common/retry.sh](../common/retry.sh) — the same retry
  available to every skill. See [references/retry-guide.md](references/retry-guide.md).

## Completion Report

When the hook allows a stop: report target, REAL usage consumed
(`usedReal` from budget file), tasks completed, remaining work. Usage is
measured, not estimated — but compaction/session limits still apply, so the
real figure is the last transcript sum the hook recorded.

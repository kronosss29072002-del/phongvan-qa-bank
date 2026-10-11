# Marathon Resume — System Prompt Reentry

When a deep-budget session is resumed (`claude --continue`, `/resume`, or a
new session invoking the skill again), the model must re-anchor on the saved
state instead of starting fresh or re-planning from zero.

## On every resume, FIRST read state

1. Read `.claude/deep-budget.json` (target, usedReal/usedGuess, completedTasks,
   checkpoints).
2. Read `.claude/deep-budget-plan.md` (phases, current phase, next action,
   findings, ownership).
3. Read status from the last transcript continuation, if any.

## Then continue, not restart

- Do NOT re-plan the whole project.
- Do NOT re-do completed phases.
- Pick the FIRST incomplete phase from the plan and run its 6-step loop
  (recon → research → design → implement → verify → review).
- Preserve prior decisions & findings from the plan file (they are the
  source of truth — don't second-guess without a real reason).

## Budget re-anchoring

- `usedReal` from the budget file is cumulative real transcript usage across
  compactions/sessions. Trust it over your own guess.
- The Stop hook will keep blocking until `usedReal` reaches target, so on
  resume the loop simply continues where it left off.

## If plan file is missing

Reconstruct a minimal plan: list completed tasks from `completedTasks` in the
budget file, then decompose the remaining work into phases and start.

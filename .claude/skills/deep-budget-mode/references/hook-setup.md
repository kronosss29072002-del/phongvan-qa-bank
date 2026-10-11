# Stop Hook Setup

Command-type Stop hook. Reads `.claude/deep-budget.json` + the session
transcript's real `message.usage` token counts. Blocks the turn (exit 2)
while real usage is >100k below target.

## Install

```bash
mkdir -p .claude/hooks
cp .claude/skills/deep-budget-mode/scripts/check_budget.js .claude/hooks/check_budget.js
chmod +x .claude/hooks/check_budget.js
```

Append the `Stop` event to `.claude/settings.json` (merge with existing hooks,
do not overwrite):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check_budget.js"
          }
        ]
      }
    ]
  }
}
```

## How counting works

- Claude Code passes `transcript_path` to the Stop hook on stdin.
- The hook parses every JSONL line's `message.usage` and sums
  `input_tokens + output_tokens + cache_creation_input_tokens`
  (= model-compute tokens; cheap cache *reads* are excluded).
- Budget file stores `usedReal` (last transcript sum) and `usedGuess`
  (fallback when no transcript, e.g. other tools).
- Decision uses real count when available.

## Stop-hook block cap

Claude Code auto-allows a stop after 8 consecutive blocks
(`stop_hook_active: true` in hook input) to avoid infinite loops.
The hook checks this and exits 0. Raise the cap if legitimate phases need more:
- `export CLAUDE_CODE_STOP_HOOK_BLOCK_CAP=50`
- or set under `env` in `.claude/settings.json`.

Eight blocks is usually 8 model turns — enough for one substantial phase.

## Uninstall

1. Remove `Stop` from `.claude/settings.json`.
2. Delete `.claude/hooks/check_budget.js`.
3. Delete `.claude/deep-budget.json` and `.claude/deep-budget-plan.md`.

# API Retry Guide (524 / 5xx resilience)

Transient proxy errors (Cloudflare 524 timeout, 502/503, ECONNRESET) kill a
`claude` session before the budget is consumed. Handle them with the retry
wrapper, not by hand.

## The retry wrapper

`scripts/robust-resume.sh` runs `claude --continue`, detects transient errors,
backs off, and retries — keeping the marathon alive through outages.

```bash
# Start (first run) with auto-retry
.claude/skills/deep-budget-mode/scripts/robust-resume.sh

# Already mid-marathon, resume with retries
.claude/skills/deep-budget-mode/scripts/robust-resume.sh --resume

# Tune retries / backoff
.claude/skills/deep-budget-mode/scripts/robust-resume.sh --max-retries 15 --backoff 20
```

## What it detects

| Signature | Meaning |
|-----------|---------|
| `524` / `origin_response_timeout` / `Proxy Read Timeout` | Cloudflare origin timeout — the 524 you saw |
| `502` / `503` / `529` | Bad gateway / unavailable / overloaded |
| `ETIMEDOUT` / `ECONNRESET` / `ECONNREFUSED` / `socket hang up` | Network-level drops |
| `"retryable": true` | Cloudflare explicit retry signal |

Detection reads the last 200 lines of the session's stderr — no false
positives on normal exits.

## Backoff schedule (default)

| Retry | Wait |
|-------|------|
| 1 | 20s |
| 2 | 30s |
| 3 | 45s |
| 4 | 68s |
| 5 | 101s |
| 6 | 152s (2m30s) |
| 7 | 228s (3m48s) |
| 8-10 | 300s (5m) cap |

Total worst case ~27 minutes across 10 retries.

## Integration with deep-budget-mode

- The Stop hook (`.claude/deep-budget.json`) is **not reset** by a crash — the
  transcript persists, `usedReal` keeps summing on the next run.
- `--continue` resumes the same transcript, so the hook keeps counting
  accumulated usage. Follow `references/system-prompt-resume.md` on resume.
- Keep the wrapper running in a terminal (or `nohup`/`tmux`) for unattended
  overnights.

## Env knobs

```bash
MAX_RETRIES=15                 # retry count (default 10)
BACKOFF=30                     # base backoff seconds (default 20)
CLAUDE_EXTRA_ARGS="--dangerously-skip-permissions"  # extra claude flags
LOG_FILE=.claude/deep-budget-retry.log              # log path
```

## Exit codes

- `0` — session finished normally (budget reached or user stopped)
- `1` — retries exhausted, still failing; resume manually with `claude --continue`
- other — non-transient failure (real error, not network); check the log

## Manual resume after exhaustion

```bash
claude --continue
# or re-arm the wrapper (budget state persists)
.claude/skills/deep-budget-mode/scripts/robust-resume.sh --resume
```
#!/usr/bin/env bash
# retry.sh — Shared auto-retry engine for Claude Code.
#
# Wraps any long-running command (a claude session, a test run, a build, a
# script) and retries it after transient failures (524/5xx/ETIMEDOUT/...),
# with exponential backoff. Drop-in for any skill that must survive outages.
#
# Usage:
#   retry.sh -- "claude --continue"
#   retry.sh --max-retries 15 --backoff 20 -- "npm run build"
#   MAX_RETRIES=5 BACKOFF=10 retry.sh -- "./my-script.sh"
#
# Exit codes:
#   0  command succeeded (or retries succeeded)
#   1  retries exhausted
#   N  non-transient failure, propagated from the command
#
# Design:
#   - Generic: takes any command as positional args after `--`
#   - Detects transient signatures in the last 200 lines of stderr
#   - Exponential backoff: base × 1.5^(n), capped at MAX_BACKOFF
#   - Writes a retry log + PID file for external control

set -euo pipefail

# ─── Defaults ───────────────────────────────────────────────────────
MAX_RETRIES="${MAX_RETRIES:-10}"
BASE_BACKOFF="${BACKOFF:-20}"          # seconds; fast start, exponential growth
MAX_BACKOFF="${MAX_BACKOFF:-300}"      # cap at 5 minutes
LOG_FILE="${LOG_FILE:-.claude/retry.log}"
PID_FILE="${PID_FILE:-.claude/retry.pid}"
DRY_RUN="${DRY_RUN:-0}"                # 1 = don't actually run the command

# ─── Parse args ─────────────────────────────────────────────────────
COMMAND=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-retries) MAX_RETRIES="$2"; shift 2 ;;
    --backoff)     BASE_BACKOFF="$2"; shift 2 ;;
    --max-backoff) MAX_BACKOFF="$2"; shift 2 ;;
    --dry-run)     DRY_RUN=1; shift ;;
    --)            shift; COMMAND=("$@"); break ;;
    -h|--help)
      echo "Usage: retry.sh [opts] -- <command...>"
      echo "  --max-retries N   retry count (default 10)"
      echo "  --backoff S       base backoff seconds (default 20)"
      echo "  --max-backoff S   backoff cap seconds (default 300)"
      echo "  --dry-run         parse/validate without running"
      exit 0 ;;
    *) COMMAND=("$@"); break ;;
  esac
done

if [[ ${#COMMAND[@]} -eq 0 ]]; then
  echo "ERROR: no command given. Usage: retry.sh [opts] -- <command...>" >&2
  exit 2
fi

# ─── Helpers ────────────────────────────────────────────────────────
ts()  { date '+%Y-%m-%d %H:%M:%S'; }
log() { local msg="[$(ts)] $1"; echo "$msg" | tee -a "$LOG_FILE"; }

detect_transient_error() {
  local stderr_file="$1"
  [[ -f "$stderr_file" ]] || return 1
  local tail
  tail=$(tail -200 "$stderr_file" 2>/dev/null) || return 1

  # Cloudflare 524 origin timeout (the common one)
  echo "$tail" | grep -qiE '524|origin_response_timeout|Proxy Read Timeout' && return 0
  # Other transient HTTP statuses
  echo "$tail" | grep -qiE '"status":(502|503|529)|bad.gateway|service.unavailable|overloaded' && return 0
  # Network-level drops
  echo "$tail" | grep -qiE 'ETIMEDOUT|ECONNRESET|ECONNREFUSED|socket hang up' && return 0
  # Cloudflare explicit retry signal
  echo "$tail" | grep -qiE '"retryable":\s*true' && return 0
  return 1
}

calculate_backoff() {
  local attempt=$1
  python3 -c "print(int(min($BASE_BACKOFF * (1.5 ** $attempt), $MAX_BACKOFF)))" 2>/dev/null \
    || echo "$BASE_BACKOFF"
}

# ─── Main loop ──────────────────────────────────────────────────────
mkdir -p .claude
log "retry.sh: command='${COMMAND[*]}' max_retries=$MAX_RETRIES base_backoff=${BASE_BACKOFF}s"
echo $$ > "$PID_FILE"

attempts=0
consecutive_transient=0

while true; do
  attempts=$((attempts + 1))
  stderr_file="/tmp/retry-stderr-$$.log"

  log "Attempt $attempts/$MAX_RETRIES: ${COMMAND[*]}"

  if [[ "$DRY_RUN" == "1" ]]; then
    log "[dry-run] would run: ${COMMAND[*]}"
    exit 0
  fi

  set +e
  bash -c "${COMMAND[*]}" 2> >(tee -a "$stderr_file" >&2)
  exit_code=$?
  set -e

  # Success — done
  if [[ $exit_code -eq 0 ]]; then
    log "Command succeeded (exit 0)."
    rm -f "$PID_FILE"
    exit 0
  fi

  # Transient error → backoff + retry
  if detect_transient_error "$stderr_file"; then
    consecutive_transient=$((consecutive_transient + 1))

    if [[ $attempts -ge $MAX_RETRIES ]]; then
      log "ERROR: max retries ($MAX_RETRIES) reached. Last exit: $exit_code"
      log "Resume manually: ${COMMAND[*]}"
      rm -f "$PID_FILE"
      exit 1
    fi

    backoff=$(calculate_backoff "$consecutive_transient")
    log "Transient error (attempt $attempts). Waiting ${backoff}s..."
    sleep "$backoff"
    log "Retrying (attempt $((attempts + 1))/$MAX_RETRIES)..."
    continue
  fi

  # Non-transient error — propagate, don't retry
  log "Non-transient exit code $exit_code. Stopping."
  rm -f "$PID_FILE"
  exit "$exit_code"
done

#!/usr/bin/env bash
# robust-resume.sh — Claude Code marathon driver (deep-budget-mode).
#
# Thin wrapper over the shared retry engine (common/retry.sh): runs
# `claude --continue` with auto-retry on transient API errors (524/5xx/...).
#
# New code can also call the shared engine directly:
#   .claude/skills/common/retry.sh -- "claude --continue"
#
# Usage:
#   ./robust-resume.sh                        # start + auto-retry
#   ./robust-resume.sh --max-retries 15       # override retry count
#   ./robust-resume.sh --backoff 20           # override base backoff
#   CLAUDE_EXTRA_ARGS="--dangerously-skip-permissions" ./robust-resume.sh
#
# Exit codes:
#   0 = session exited normally (budget consumed or user stopped)
#   1 = all retries exhausted, session still failing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RETRY_ENGINE="$SCRIPT_DIR/../../common/retry.sh"

EXTRA_ARGS="${CLAUDE_EXTRA_ARGS:-}"
RETRY_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-retries|--backoff|--max-backoff)
      RETRY_ARGS+=("$1" "$2"); shift 2 ;;
    --resume|-c)  shift ;;
    --dry-run)    RETRY_ARGS+=("--dry-run"); shift ;;
    -h|--help)
      echo "robust-resume.sh — Claude Code marathon with auto-retry"
      echo "Usage: ./robust-resume.sh [--max-retries N] [--backoff S] [--max-backoff S]"
      echo "Extra claude flags via CLAUDE_EXTRA_ARGS env."
      echo "Engine: common/retry.sh (shared by all skills)"
      exit 0 ;;
    *) EXTRA_ARGS="$EXTRA_ARGS $1"; shift ;;
  esac
done

export LOG_FILE="${LOG_FILE:-.claude/deep-budget-retry.log}"

exec "$RETRY_ENGINE" "${RETRY_ARGS[@]}" -- "claude --continue $EXTRA_ARGS"

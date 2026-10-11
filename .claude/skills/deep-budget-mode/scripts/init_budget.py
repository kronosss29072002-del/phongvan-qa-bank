#!/usr/bin/env python3
"""Initialize deep-budget-mode tracking.

Usage:
    python3 init_budget.py <target_tokens>

target_tokens accepts natural language: '10 tỷ', '1.5M', '500k', '1000000'.
Creates .claude/deep-budget.json. Run from project root.
"""
import os
import sys

from budget_lib import BUDGET_PATH, fmt, fresh_budget, parse_tokens, save_budget


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 init_budget.py <target_tokens>", file=sys.stderr)
        print("  e.g. '10 tỷ' | '1B' | '500k' | '1000000'", file=sys.stderr)
        sys.exit(1)

    target = parse_tokens(sys.argv[1])
    if target is None or target <= 0:
        print(f"Error: cannot parse '{sys.argv[1]}' as a token count", file=sys.stderr)
        sys.exit(1)

    os.makedirs(".claude", exist_ok=True)
    budget = fresh_budget(
        target,
        session_id=os.environ.get("CLAUDE_SESSION_ID", "unknown"),
        started_at="now",
    )
    save_budget(budget)

    print(f"✅ Budget initialized: target {fmt(target)} tokens")
    print(f"   Tracking file: {BUDGET_PATH}")


if __name__ == "__main__":
    main()
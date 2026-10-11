#!/usr/bin/env python3
"""Record a completed phase in deep-budget-mode tracking.

Usage:
    python3 update_budget.py <estimate_guess_tokens> "<phase description>"

Updates usedGuess (model's heuristic estimate), appends to completedTasks,
writes current status. Real token counting is done by the Stop hook from
the transcript; guessed numbers are a fallback for environments where the
transcript is unavailable.
"""
import sys

from budget_lib import fmt, load_budget, save_budget, status_line


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 update_budget.py <guess_tokens> [\"phase description\"]", file=sys.stderr)
        sys.exit(1)

    try:
        guess = int(sys.argv[1])
    except ValueError:
        print(f"Error: '{sys.argv[1]}' is not a valid integer", file=sys.stderr)
        sys.exit(1)

    desc = sys.argv[2] if len(sys.argv) > 2 else "unnamed phase"

    budget = load_budget()
    if budget is None:
        print("Error: .claude/deep-budget.json not found. Run init_budget.py first.", file=sys.stderr)
        sys.exit(1)

    budget["usedGuess"] += guess
    budget["completedTasks"].append(desc)
    budget["usedReal"] = budget.get("usedReal") or 0
    budget["lastUpdated"] = "now"
    save_budget(budget)

    print(f"[phase-recorded] {desc} | guessed +{fmt(guess)} | {status_line(budget)}")


if __name__ == "__main__":
    main()
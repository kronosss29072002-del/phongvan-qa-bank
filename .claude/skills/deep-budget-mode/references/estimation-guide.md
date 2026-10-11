# Token Estimation Guide

Model cannot read its own cumulative token count. Use these estimates.

## Per-Action Estimates (input + output combined)

| Action | ~Tokens |
|--------|---------|
| Read 1 small file (≤50 lines) | 3k-8k |
| Read 1 medium file (50-200 lines) | 8k-25k |
| Read 1 large file (200-500 lines) | 25k-60k |
| Read 1 very large file (500+ lines) | 50k-150k |
| Write 50 lines of code | 10k-25k |
| Write 200 lines of code | 40k-100k |
| Edit small change (1-10 lines) | 3k-8k |
| Edit medium change (10-50 lines) | 8k-20k |
| Bash command (simple) | 2k-5k |
| Bash command (complex output) | 5k-30k |
| Grep/Glob search | 2k-10k |
| Agent subagent (small task) | 30k-80k |
| Agent subagent (large task) | 80k-200k |
| Explore agent (medium sweep) | 20k-60k |
| WebFetch 1 page | 5k-20k |
| WebSearch query | 5k-15k |

## Milestone-Based Estimation

Rather than tracking every action, estimate by milestones:

1. **Exploration phase** (reading codebase): 100k-500k
2. **Planning phase** (writing specs): 50k-200k
3. **Implementation phase**: 200k-2M (depends on scope)
4. **Testing phase**: 100k-500k
5. **Review & fix phase**: 100k-500k
6. **Documentation phase**: 50k-200k

## Update Cadence

After each significant milestone, run:
```bash
python3 .claude/skills/deep-budget-mode/scripts/update_budget.py <estimate> "<description>"
```

Don't update after every single tool call — batch updates per task/phase.
Aim for 10-30 updates total, not hundreds.

## Rough Project Size Estimates

| Project type | Full cycle ~Tokens |
|-------------|-------------------|
| Single API endpoint | 200k-500k |
| Feature module (CRUD) | 500k-1.5M |
| Full-page UI component | 300k-1M |
| Large refactor (multi-file) | 1M-5M |
| Full project (from scratch) | 5M-50M |
| Exhaustive deep audit | 10M-100M |

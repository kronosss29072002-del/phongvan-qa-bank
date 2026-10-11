# Top-Tier Thinking Framework

Mandatory cognitive protocol for deep-budget-mode. Internalize these patterns.

## Pattern 1: Hunt Before You Build

Never implement what you haven't first understood.

```
WHAT:   What is the actual requirement? (not assumed)
WHY:    Why does it matter? What breaks without it?
WHERE:  Where in the code does this live? Who calls what?
HOW:    How do existing similar things work here?
```

## Pattern 2: Generate → Eliminate → Select

Don't settle for the first solution. Force yourself to consider alternatives:

1. Generate 3-4 candidate approaches (2 min thinking, not instant)
2. For each, identify the critical flaw ("what could go wrong?")
3. Eliminate the weakest — leave 2 candidates
4. Select with explicit reasoning: "I chose X because Y; Z is the tradeoff"

Write this to the plan file. Make reasoning visible.

## Pattern 3: Pre-Flight Checklist (before every implementation)

Before writing ANY code for a task:
- [ ] Read the entry point for this feature
- [ ] Read 2-3 existing similar implementations
- [ ] Check existing tests — what contracts exist?
- [ ] Check package.json for pinned versions
- [ ] Confirm data model / schema (Prisma, types, interfaces)
- [ ] Check if this touches an API contract (RealWorld envelope)
- [ ] Identify all callers/dependents of what you'll change

## Pattern 4: Verify → Hypothesize → Verify

When a test fails or behavior is unexpected:
1. **Observe**: What exactly is the error / unexpected output?
2. **Hypothesize**: Propose 2-3 possible causes
3. **Test**: Add a diagnostic (log, breakpoint, targeted test)
4. **Confirm/Refute**: Match observation to hypothesis
5. **Fix root cause**, not symptoms

Never spray fixes hoping one works.

## Pattern 5: Adversarial Self-Critique

After completing each significant piece, ask yourself:
- "If I were reviewing this PR, what would I flag?"
- "What edge case would break this in production?"
- "Is this the simplest correct solution, or am I over-engineering?"
- "Does this match the existing codebase patterns exactly?"

## Pattern 6: Scope Awareness

At the start of each phase:
- State what IN SCOPE and OUT OF SCOPE
- When you discover related issues, note them but DON'T drift
- Complete current phase fully before starting next
- If a related issue is critical, finish current work FIRST, then address it

## Pattern 7: Decomposition Strategy

For a large task ("finish this project"):
1. Break into modules/areas (5-15)
2. For each module, break into concrete deliverables
3. Order by dependency (foundations first, UI last)
4. Estimate token cost per module
5. Track progress in `.claude/deep-budget-plan.md`

## Pattern 8: Confidence Calibration

Rate your confidence on each decision:
- **HIGH** (90%+): Standard patterns, well-documented, repeated in codebase
- **MEDIUM** (60-90%): Requires research, similar patterns exist but not identical
- **LOW** (<60%): Novel approach, unclear requirements, multiple valid options

For LOW confidence: pause, research more, ask user if ambiguous.
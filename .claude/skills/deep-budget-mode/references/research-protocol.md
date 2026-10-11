# Deep Research & Thinking Protocol

Mandatory loop for EVERY phase of deep-budget-mode work. Never skip a step.
Percentages are of remaining budget.

## The 6-Step Phase Loop

### 1. RECON (5-10%)
- Map the codebase before ANY edit
- Read: project tree, README, entry points, module layout, conventions
- Use Explore/scout agents in parallel for broad sweeps
- Output: written understanding of structure + where changes will land

### 2. RESEARCH (10-20%)
- Read the ACTUAL code that touches the change — never guess
- Read existing tests to learn behavior contracts
- External: WebFetch docs, WebSearch, Context7 for library APIs
- Spawn researcher agent for non-obvious questions
- NEVER implement a feature without first reading how surrounding code does it

### 3. DESIGN (think before act)
- Write a plan to `.claude/deep-budget-plan.md` (append per phase):
  what, why, options considered, chosen approach, tradeoffs
- List edge cases & failure modes to handle
- Match codebase patterns — not your own preferences
- Hard problem? Spawn Plan/brainstormer for a second view

### 4. IMPLEMENT (small verifiable steps)
- One concern per step; verify after each step (build/test)
- Match surrounding style, comment density, naming

### 5. VERIFY (gate — never pass without this)
- Run relevant tests + build + lint
- Fix ALL failures — never leave a red build
- Not obvious? Spawn debugger agent

### 6. REVIEW (adversarial)
- Re-read every file you touched (diff-style)
- Spawn code-reviewer subagent on the changed set
- Ask: bugs? edge cases? missed requirements? security? perf?
- Fix findings until clean

## Research Questions to Always Ask
- Where does this pattern already exist in the repo?
- What breaks if I change this? (callers, tests, contracts)
- What do existing tests say the behavior must be?
- Which library version is pinned? (package.json / lockfile)

## When to Spawn Agents (use them, don't solo)

| Question | Agent |
|----------|-------|
| Where is X in the codebase? | Explore / scout |
| Best practice for library Y? | researcher / WebFetch / Context7 |
| Why is this failing? | debugger |
| Is this code good? | code-reviewer |
| Design approach? | planner / brainstormer |

## Thinking Before Every Action
- State (briefly) what you expect to find/achieve BEFORE reading or coding
- After the action, state what you learned
- Keeps reasoning visible; catches wrong assumptions early
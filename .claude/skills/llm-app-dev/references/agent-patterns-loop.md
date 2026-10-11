# Agent Patterns: Loop & Memory

> ReAct and Claude-native tool-use agent loops, memory, planning + execution. Orchestration: see `agent-orchestration.md`.

## The ReAct Loop (Thought -> Action -> Observation)

```
User asks -> Model thinks -> Calls tool -> Sees result -> Thinks again...
```

The model is the router. Your code executes tools and feeds results back. The loop ends when the model returns a final text answer (no `tool_use` block).

```python
messages = [{"role": "user", "content": user_query}]
turns = 0
while True:
    resp = client.messages.create(
        model="claude-opus-5", max_tokens=8192, tools=tools, messages=messages
    )
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason != "tool_use":
        break
    turns += 1
    if turns > MAX_TURNS:  # 10-25; prevent runaway loops
        break
    results = execute_tool_calls(resp.content)
    messages.append({"role": "user", "content": results})
```

Always set a recursion limit (10-25 turns). Catch `stop_reason === "max_tokens"` and handle gracefully.

## Claude-Native Tool-Use Agents

Claude's built-in `tool_use` IS a ReAct agent. You don't need a framework for single-tool agents.

```typescript
const tools = [
  { name: "search", description: "Web search", input_schema: { /* ... */ } },
  { name: "calculator", description: "Evaluate math", input_schema: { /* ... */ } },
  { name: "file_reader", description: "Read file contents", input_schema: { /* ... */ } },
];
```

Key decisions:
- Tool descriptions are instructions to the model. Be precise: `"Search the company wiki for information about X"` beats `"Search for things"`.
- Limit to 5-10 tools per agent; beyond that, tool-selection degrades.
- Use `strict: true` for tools with rigid schemas; `auto` otherwise.
- Add guardrails (timeout, max tool calls, human approval) to the raw loop; see `agent-orchestration.md`.

## Memory Patterns

| Pattern | Scope | Implementation |
|---|---|---|
| Conversation buffer | Full history | Resend all messages each turn (simplest; watch context limits) |
| Sliding window | Last N turns | Drop oldest messages when approaching context limit |
| Summary memory | Long sessions | Summarize old turns into a system message periodically |
| Vector memory | Cross-session facts | Store facts in a vector store; retrieve by query each turn |
| Entity memory | Specific entities | Track named entities and their attributes across turns |

### Summary memory implementation

```python
async def summarize_if_needed(messages, client, max_turns=20):
    if len(messages) <= max_turns:
        return messages
    old = messages[:max_turns]
    summary = client.messages.create(
        model="claude-haiku-4-5", max_tokens=512,
        messages=[{"role": "user", "content": f"Summarize this conversation:\n{format(old)}"}]
    )
    return [
        {"role": "system", "content": f"Previous context: {summary.content[0].text}"},
        *messages[max_turns:]
    ]
```

## Planning + Execution Separation

For complex tasks, separate the planning step from execution:

```python
plan = client.messages.create(
    model="claude-opus-5", max_tokens=2048,
    messages=[{"role": "user", "content": f"Create a step-by-step plan for: {task}"}]
)

steps = parse_plan(plan.content[0].text)
accumulated = ""
for step in steps:
    result = client.messages.create(
        model="claude-sonnet-5", max_tokens=2048,
        messages=[{"role": "user", "content": f"Execute: {step}\nContext: {accumulated}"}]
    )
    accumulated += result.content[0].text
```

Plan with a capable model, execute with a cheaper one. Feed accumulated context forward between steps.
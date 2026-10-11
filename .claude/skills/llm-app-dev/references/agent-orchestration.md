# Agent Orchestration: LangGraph, Multi-Agent, Safety

> State machines, multi-agent patterns, guardrails, and evaluation. Raw loops and memory: see `agent-patterns-loop.md`.

## LangGraph State Machines (LangGraph.js v1.0)

LangGraph adds state persistence, conditional routing, and human-in-the-loop to the agent loop.

```typescript
import { StateGraph, StateSchema, MessagesValue, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const State = new StateSchema({ messages: MessagesValue });

const callLlm = async (state) => {
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
};

const shouldRoute = (state) => {
  const last = state.messages.at(-1);
  if (last?.tool_calls?.length) return "tools";
  return END;
};

const graph = new StateGraph(State)
  .addNode("agent", callLlm)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldRoute, ["tools", END])
  .addEdge("tools", "agent")
  .compile({ recursionLimit: 25 });

const result = await graph.invoke({ messages: userMessages });
```

When to use LangGraph instead of a raw loop: persistence (checkpointer), human-in-the-loop interrupts, branching logic, or multi-agent routing.

## Multi-Agent Orchestration

### Supervisor pattern

```
User -> Supervisor -> Worker A (search)
                    -> Worker B (code)
                    -> Worker C (write)
                    -> Supervisor -> final answer
```

### Hierarchical pattern

Supervisor delegates to sub-supervisors, each managing their own workers. Use for tasks that decompose into independent sub-problems.

### Swarm pattern

Agents hand off to each other based on expertise; the current agent decides who to delegate next. Good when the task domain is unpredictable.

```typescript
// Supervisor decides which worker to call next; each worker is a node or subgraph
const supervisorRoute = (state) => state.nextAgent;  // set by LLM tool call
graph.addNode("search_worker", searchAgentNode);
graph.addNode("code_worker", codeAgentNode);
graph.addConditionalEdges("supervisor", supervisorRoute, ["search_worker", "code_worker", END]);
```

## Guardrails and Safety

- **Input validation**: sanitize user input before passing to tools. Never pass raw user text to shell commands or SQL.
- **Output filtering**: scan model output for PII, secrets, or dangerous instructions before serving.
- **Tool permissions**: allow/deny lists. Mark tools `read_only` vs `destructive`; require human approval for destructive operations.
- **Human-in-the-loop**: interrupt before high-impact tools (`type: "interrupt"` in LangGraph, or an approval gate in the raw loop).
- **Rate limiting**: cap tool calls per request (max 20-30) and per minute.
- **Timeout**: per-turn timeouts; kill stuck tool executions.

```python
MAX_TOOL_CALLS = 20
tool_call_count = 0
while resp.stop_reason == "tool_use":
    tool_call_count += 1
    if tool_call_count > MAX_TOOL_CALLS:
        raise AgentLoopError("Exceeded max tool calls")
    results = execute_tool_calls(resp.content)
```

## Evaluating Agents

Agents are non-deterministic. Evaluate with:

| Method | What It Tests | How |
|---|---|---|
| Trajectory eval | Tools called in the right order? | Compare tool-call sequence against expected trajectory |
| Outcome eval | Final answer correct? | Compare against golden answers with LLM-judge |
| Cost eval | Tokens/turns to reach answer? | Track `usage` across all turns |
| Robustness eval | Edge cases handled? | Empty input, adversarial input, missing tools, tool failures |
| Loop termination | Always terminates? | Run with recursion limit; count turns over 100 sample requests |

Run agents in eval mode against 50-100 sample tasks before deploying. Monitor p95 turn count and total cost in production.
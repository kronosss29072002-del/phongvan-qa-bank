# LangChain.js / LangGraph.js Integration Reference

> When and how to use LangChain.js and LangGraph.js in a Claude-powered project. Graph/state-machine patterns live in `agent-orchestration.md`; raw API calls in `claude-api-core.md`.

## Package Map

| Need | Package |
|---|---|
| LangGraph agent loop | `@langchain/langgraph` |
| Prebuilt agent (createReactAgent) | `@langchain/langgraph/prebuilt` |
| LangChain chat model wrapper | `@langchain/anthropic` |
| Tools | `@langchain/core/tools` |
| Messages (HumanMessage, AIMessage) | `@langchain/core/messages` |
| Embeddings | `@langchain/anthropic` (voyage) or `@langchain/community` |
| Vector stores | `@langchain/pinecone`, `@langchain/weaviate`, `@langchain/community` (pgvector) |

## LangGraph Graph Patterns

State machine basics (StateGraph, nodes, conditional edges, `ToolNode`) are in `agent-orchestration.md`. The shape is identical with LangChain wrappers: `new ChatAnthropic({ model: "claude-opus-5" })` replaces the raw client, and `model.bindTools(tools)` replaces passing `tools` to `messages.create`.

Conditional routing rule: the third argument to `addConditionalEdges` lists all possible target nodes -- the router must return only names from this list.

## Persistence and Memory

### Checkpointer (conversation persistence)
```typescript
import { MemorySaver } from "@langchain/langgraph";

const checkpointer = new MemorySaver();
const graph = compiledGraph.compile({ checkpointer });

// Each invocation needs a thread_id
await graph.invoke(input, { configurable: { thread_id: "user-123" } });
```

### Store (long-term memory)
```typescript
import { MemoryStore } from "@langchain/langgraph";

const store = new MemoryStore();
const graph = compiledGraph.compile({ checkpointer, store });

// Inside a node: access via runtime
const node = async (state, runtime) => {
  const memories = await runtime.store?.search(["memories", userId]);
  // ...
};
```

## Streaming with LangGraph

```typescript
const stream = await graph.streamEvents(
  { messages: [{ role: "user", content: "Write a function..." }] },
  { version: "v3" }
);
for await (const event of stream) {
  if (event.event === "on_chat_model_stream") {
    process.stdout.write(event.data?.chunk?.content ?? "");
  }
}
```

`streamEvents` with `version: "v3"` is the standard. It emits events from all nodes -- model streams, tool invocations, node transitions.

## LangSmith Tracing

```typescript
// Automatic tracing via environment variables:
//   export LANGCHAIN_TRACING_V2=true
//   export LANGSMITH_API_KEY=...

// Or explicit tracer for selective tracing:
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
const tracer = new LangChainTracer();
await graph.invoke(input, { callbacks: [tracer] });
```

## When to Use LangChain vs Raw API

| Use Raw Claude API | Use LangChain/LangGraph |
|---|---|
| Single-step calls | Multi-step agent with persistence |
| You control the full loop | You need checkpointer, human-in-the-loop |
| Tool list is stable and small (< 5 tools) | Complex routing, conditional branching |
| No need for persistence | Multi-agent supervisor/swarm patterns |
| Simpler is better (fewer deps) | You want LangSmith tracing built-in |

Rule: start with raw API. Add LangGraph when you need persistence or branching. Add LangChain wrappers only when the abstraction saves real code.

## Anti-Patterns

| Pattern | Problem | Fix |
|---|---|---|
| `Chain({ prompt, llm, outputParser })` for simple calls | Unnecessary abstraction; harder to debug | `llm.invoke(messages)` directly |
| Wrapping a single Claude call in a chain | Adds deps, hides errors | Direct SDK call |
| Over-nesting subgraphs | Debugging nightmare; opaque flow | Keep graphs shallow; use clear node names |
| Ignoring `recursionLimit` | Infinite loops consume budget | Always set `recursionLimit: 25` on `.compile()` |
| LangChain message classes everywhere | Conversion overhead | Native Claude messages for the main flow; convert at LangGraph boundaries only |
| Not checking `stop_reason` in agent loop | Silent failures; wrong results | Always branch on `stop_reason` before reading content |
| `createReactAgent` without understanding the loop | Debugging becomes trial-and-error | Write the raw loop first; switch to prebuilt when stable |
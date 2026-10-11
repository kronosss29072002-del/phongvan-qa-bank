---
name: llm-app-dev
description: Build LLM-powered applications with Claude and LangChain.js/LangGraph.js — Claude Messages API (tool use, streaming, prompt caching, structured output), agent loops (ReAct, tool-use agents, multi-agent systems), and RAG pipelines (chunking, embeddings, vector stores, retrieval, evaluation). Use when writing a chatbot, a RAG/retrieval app, an agent or tool-use loop, an LLM content pipeline, or when deciding between Claude API, LangChain, and raw orchestration.
license: MIT
version: 1.0.0
---

# LLM App Development

## When to Use
- Chatbots and assistants: Claude Messages API with system prompts, streaming, conversation history.
- RAG applications: chunking, embeddings, vector retrieval, citation tracking.
- Agents: tool-use loops, ReAct, LangGraph state machines, multi-agent orchestration.
- Content pipelines: extraction, classification, summarization at volume (use Message Batches).

## Architecture Overview
Treat the LLM as a reasoning engine, not a database:
1. **Request**: system prompt (stable behavior) + user/tool messages (volatile state).
2. **Reasoning**: the model returns text, `tool_use` blocks, or structured output.
3. **Orchestration**: your code (or LangGraph) executes tools and feeds results back.
4. **Memory**: conversation history you resend, summaries, or external stores.

## Quick Start

### Claude API — basic call (TypeScript)
```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY
const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 1024,
  system: "Answer in plain text; cite sources when asked.",
  messages: [{ role: "user", content: "Summarize the key risk in this report." }],
});
console.log(response.content[0].text);
```

### Claude API — tool use loop (Python)
```python
import anthropic

client = anthropic.Anthropic()
tools = [{
    "name": "lookup_price",
    "description": "Get the current price of a product SKU.",
    "input_schema": {"type": "object",
                     "properties": {"sku": {"type": "string"}},
                     "required": ["sku"]},
}]
messages = [{"role": "user", "content": "How much does SKU-447 cost?"}]

while True:
    response = client.messages.create(model="claude-opus-5", max_tokens=1024,
                                      tools=tools, messages=messages)
    messages.append({"role": "assistant", "content": response.content})
    if response.stop_reason != "tool_use":
        break  # final answer lives in response.content
    results = [{"type": "tool_result", "tool_use_id": b.id,
                "content": run_tool(b.name, b.input)}
               for b in response.content if b.type == "tool_use"]
    messages.append({"role": "user", "content": results})
```

## Best Practices
- **Prompt engineering**: specify output format and failure behavior; give examples; keep instructions byte-identical so caching works. Put volatile data (timestamps, request IDs, per-request questions) after the last `cache_control` breakpoint.
- **Token management**: set `max_tokens` per route (classify ~256, generation 2048-8192, streaming up to 128K). Count with the `count_tokens` endpoint, never tiktoken. Judge cost per completed task, not per request.
- **Streaming**: default to streaming for long output; render deltas or await the final message. No fixed sleeps anywhere in the pipeline.
- **Error handling**: catch most-specific-first (`RateLimitError` → `APIStatusError` → `APIConnectionError`); 429/529 retry with exponential backoff honoring `retry-after`; the SDK auto-retries 408/409/429/5xx (`max_retries` default 2).
- **Testing**: assert on real outcomes (tool results, final answers), never on whether the model was called.

## Reference Navigation
- [Claude API core](references/claude-api-core.md) — model tiers, tool use, streaming, structured output.
- [Claude API advanced](references/claude-api-advanced.md) — prompt caching, extended thinking, budgets, error handling.
- [RAG pipeline](references/rag-pipeline.md) — chunking, embeddings, vector store selection, retrieval, reranking, evaluation, failure modes.
- [Agent loop & memory](references/agent-patterns-loop.md) — ReAct loop, Claude-native tool-use agents, memory patterns, planning + execution.
- [Agent orchestration](references/agent-orchestration.md) — LangGraph state machines, multi-agent patterns, guardrails, evaluation.
- [LangChain/LangGraph integration](references/langchain-integration.md) — packages, persistence, streaming, tracing, anti-patterns.

## Decision Matrix
| Need | Choose |
|---|---|
| One-off call, classification, extraction | `client.messages.create` — no framework |
| Multi-step pipeline you fully control | Claude API + your own loop |
| Open-ended agent with tools | LangGraph.js (`StateGraph` + `ToolNode`) |
| Server-hosted agent (sandbox, scheduling) | Managed Agents / Claude Agent SDK |
| Bulk async jobs (24h window) | Message Batches (50% discount) |
| Embeddings | Voyage AI (Anthropic partner), `text-embedding-3-large`, self-host BGE |
| Vector store | Pinecone / Weaviate / Qdrant (managed), pgvector (in-stack), in-memory (dev) |
| Reasoning tier | `claude-opus-5` (default), `claude-sonnet-5` (cost), `claude-haiku-4-5` (high volume, latency) |
# Claude API Core Patterns

> Messages API: model selection, tool use, streaming, structured output.

## Model Selection

| Model | ID | Context | Best For | Price (in/out per 1M) |
|---|---|---|---|---|
| Opus 5 | `claude-opus-5` | 1M | Hard reasoning, coding, agents | $5 / $25 |
| Sonnet 5 | `claude-sonnet-5` | 1M | Good cost/quality, high volume | $2 / $10 |
| Haiku 4.5 | `claude-haiku-4-5` | 200K | Classification, extraction, latency | $1 / $5 |

Pick Haiku for deterministic extraction/classification with small prompts. Otherwise start with Opus.

## System Prompt

The `system` field sets stable behavior -- instructions, examples, formatting rules.

```typescript
const response = await client.messages.create({
  model: "claude-opus-5",
  system: [{ type: "text", text: "You extract structured data. Return JSON." }],
  max_tokens: 2048,
  messages: [{ role: "user", content: "Ticket: order 1234 is late" }]
});
```

Rules: be specific about output format; specify failure behavior; keep volatile content after the cached prefix; no assistant prefills on Opus 5 / Sonnet 5 / 4.6+.

## Tool Use

```typescript
const tools = [{
  name: "get_order_status",
  description: "Get delivery status for an order by ID.",
  input_schema: {
    type: "object",
    properties: { order_id: { type: "string", description: "Order number" } },
    required: ["order_id"]
  }
}];
```

```python
messages = [{"role": "user", "content": "Where is order ORD-9876?"}]
while True:
    resp = client.messages.create(
        model="claude-opus-5", max_tokens=2048, tools=tools, messages=messages
    )
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason != "tool_use":
        break
    results = [{"type": "tool_result", "tool_use_id": b.id,
                "content": str(run_handler(b.name, b.input))}
               for b in resp.content if b.type == "tool_use"]
    messages.append({"role": "user", "content": results})
```

Rules: execute parallel tool calls concurrently, return all results in one message; failed tools use `"is_error": true`; `strict: true` requires `additionalProperties: false` + `required`.

## Streaming

```typescript
const stream = client.messages.stream({
  model: "claude-opus-5", max_tokens: 8192,
  system: "You are a helpful coding assistant.",
  messages: [{ role: "user", content: "Write a FastAPI endpoint for user CRUD." }],
});
for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    process.stdout.write(event.delta.text);
  }
}
```

Stream when `max_tokens > 4096`, input is long, or the UI shows tokens. SSE events: `message_start`, `content_block_start/delta`, `content_block_stop`, `message_delta` (stop_reason, output_tokens), `message_stop`.

## Structured Output (JSON Schema)

```typescript
const response = await client.messages.create({
  model: "claude-opus-5", max_tokens: 1024,
  output_config: {
    format: {
      type: "json_schema", name: "extracted_entities",
      schema: {
        type: "object",
        properties: {
          people: { type: "array", items: { type: "string" } },
          dates:  { type: "array", items: { type: "string" } }
        },
        required: ["people", "dates"], additionalProperties: false
      }
    }
  },
  messages: [{ role: "user", content: "Extract entities from: ..." }]
});
```

Use when downstream code expects a specific shape, you want to avoid parsing failures, or the task is extraction/classification. Do not combine with forced tool use.
# Claude API Advanced Patterns

> Prompt caching, extended thinking, token budgets, error handling. Core calls live in `claude-api-core.md`.

---

## Prompt Caching

Cache the stable prefix (system prompt, tools). Cached input tokens cost 10% of base price; cache reads on Opus 5 / Sonnet 5 are 90% off (see live pricing docs).

```typescript
const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 2048,
  system: [
    { type: "text", text: longSystemPrompt, cache_control: { type: "ephemeral" } }
  ],
  tools: [/* ... */],
  messages: [{ role: "user", content: userInput }]  // volatile tail, after cache
});
```

Validate: `response.usage.cache_creation_input_tokens` and `cache_read_input_tokens`. Zero reads = silent invalidator (e.g. `datetime.now()` in the system prompt).

Rules:
- Any byte change in the prefix invalidates everything after it.
- Render order: `tools` then `system` then `messages`. Stable first, volatile last.
- Max 4 breakpoints per request; minimum cacheable prefix 512-4096 tokens (model-dependent).

---

## Extended Thinking / Adaptive Thinking

Use `thinking: { type: "adaptive" }` on Opus 5 and Sonnet 5. The model decides how much to think; depth is controlled with `output_config.effort`.

```typescript
const response = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 16384,
  thinking: { type: "adaptive" },
  output_config: { effort: "high" },  // low | medium | high | xhigh | max
  messages: [{ role: "user", content: "Explain this proof step by step." }]
});
```

Effort levels: `low` (classification, routing), `medium` (most tasks), `high` (default), `xhigh` (coding, agents), `max` (correctness-critical, expensive).

---

## Token Budgeting

| Route | Recommended `max_tokens` |
|---|---|
| Classification / extraction | 256-512 |
| Chat / Q&A | 1024-4096 |
| Code generation (streaming) | 8192-65536 |
| Large context synthesis (streaming) | up to 128000 |

Verify large prompts with `count_tokens` before sending:
```typescript
const count = await client.messages.countTokens({
  model: "claude-opus-5",
  system: "...",
  messages: [{ role: "user", content: documentText }]
});
console.log(count.input_tokens);
```

---

## Error Handling

Catch most-specific-first:
```python
try:
    response = client.messages.create(...)
except anthropic.RateLimitError:
    # 429 -- exponential backoff, honor Retry-After header
except anthropic.InternalServerError:
    # 529 overloaded -- retry with backoff
except anthropic.BadRequestError as e:
    # 400 -- malformed request; log and fail immediately
except anthropic.APIStatusError as e:
    # Catch-all for HTTP errors
except anthropic.APIConnectionError:
    # Network failure -- retry
```

The SDK auto-retries 408, 409, 429, 5xx (`max_retries=2` in Python). Add jitter to exponential backoff to avoid a thundering herd on recovery.

---

## Best Practices

- Set machine-level rate limits as a safety net, not the primary mechanism; most 429s recover via retry.
- Check `response.usage` on every call -- input, output, and cache hits drive cost.
- Keep system prompts byte-identical between requests; only the volatile tail changes.
- If `stop_reason` is `max_tokens`, output was truncated -- prompt for the continuation.
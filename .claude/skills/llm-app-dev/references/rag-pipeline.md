# RAG Pipeline Reference

> Architecture patterns for retrieval-augmented generation with Claude and external stores.

## Chunking Strategies

| Strategy | Best For | Implementation |
|---|---|---|
| Fixed-size (512-1024 tokens, 128 overlap) | Fast baseline; well-structured docs | Split on token count; 10-20% overlap |
| Recursive character splitter | Natural language with paragraph breaks | `\n\n` -> `\n` -> sentence -> character |
| Semantic chunking | Varying document density | Embed adjacent sentences; split where cosine similarity drops |
| Markdown / HTML aware | Technical docs, knowledge bases | Split on `##` headings; preserve header as metadata |
| Document-aware (PDF, code) | Multi-format corpora | One chunk per page/function; attach source to metadata |

Rule: chunks should be 2-4x the average query length. Too small: lost context. Too large: diluted relevance.

## Embedding Models

| Provider | Model | Dimensions | Notes |
|---|---|---|---|
| Voyage AI (Anthropic partner) | `voyage-3` | 1024 | Best MTEB scores; native Anthropic integration |
| OpenAI | `text-embedding-3-large` | 3072 (or 256 truncated) | Widely supported; dimension reduction |
| Cohere | `embed-v3` | 1024 | Strong multilingual; `input_type` for search vs indexing |
| Self-hosted | BGE-large-en / BAAI | 1024 | Good cost/quality; run via `infinity-emb` or ONNX |

Normalize all vectors to unit length before storing -- required for cosine similarity.

## Vector Store Selection

| Store | Managed? | Best For | Key Property |
|---|---|---|---|
| Pinecone | Yes | Low-ops production | Serverless, fast hybrid search, native filtering |
| Weaviate | Yes or self-hosted | Multi-tenancy, hybrid search | Built-in BM25 + vector, metadata filtering |
| Qdrant | Yes or self-hosted | Performance-sensitive | Quantization (product/scalar) |
| pgvector | In-stack (PostgreSQL) | Already running Postgres | No extra infra; HNSW or IVFFlat index |
| Chroma | Self-hosted / embedded | Prototyping | Simple API; good local dev |

Start with Chroma for prototyping; pgvector if Postgres is already in the stack; Pinecone or Weaviate for managed production.

## Retrieval Strategies

```python
# Similarity baseline (add metadata filter at query time)
results = vector_store.similarity_search(qv, k=10, filter={"source": "docs"})
# MMR diversity -- lambda_mult=0.5 balances relevance vs diversity
results = vector_store.max_marginal_relevance_search(qv, k=10, lambda_mult=0.5)
# Hybrid -- Weaviate bm25 + near_vector; Pinecone sparse + dense
results = client.query.get("Chunk").with_near_vector({"vector": qv}).with_bm25(query="...").do()
results = index.query(vector=dense, sparse_vector=sparse, top_k=10)
# Rerank: 20-50 candidates -> top 5-10 with a cross-encoder (~50-200ms)
reranked = reranker.rank(query, candidates, top_k=5)  # CohereRerank("rerank-v3") or local cross-encoder
```

## Context Window Management

```python
def build_context(query, vector_store, max_tokens=6000):
    reranked = reranker.rank(query, vector_store.similarity_search(query, k=30), top_k=10)
    parts, total = [], 0
    for chunk in reranked:
        n = estimate_tokens(chunk.page_content)
        if total + n > max_tokens:
            break
        parts.append(chunk.page_content)
        total += n
    return "\n---\n".join(parts)
```

## Citation Tracking

Attach source metadata at index time and prompt Claude to cite:
```python
doc.metadata = {"source": "handbook.pdf", "page": 42, "section": "Benefits", "chunk_id": "handbook-42-3"}
```
Prompt: `For each claim, include a citation like [source: page 42] referring to the provided context. If the context doesn't contain the answer, say "I don't have enough information."`

Parse `[source: ...]` from the response to link back to the originating document.

## Evaluation Metrics

| Metric | What It Measures | How to Compute |
|---|---|---|
| Retrieval relevance | Do chunks contain the answer? | LLM-judge: "Is the answer derivable from these chunks?" |
| Faithfulness | Answer stays faithful to context? | Compare each claim in the answer to source chunks |
| Context recall | Retrieval captured all needed info? | LLM-judge per ground-truth answer |
| Answer correctness | Final answer matches expected? | Exact match for factual QA; LLM-judge for open-ended |

Minimal eval: 30-50 query/golden-answer pairs, run with `recall@5` and faithfulness. Add cases as failures surface.

## Common Failure Modes and Fixes

| Failure | Symptom | Fix |
|---|---|---|
| Chunk too small | Model answers without context | Increase chunk size / overlap |
| Chunk too large | Answers diluted; misses specifics | Smaller semantic chunks |
| Wrong embedding model | Poor recall on domain queries | Switch to domain-appropriate model (BGE, Cohere) |
| Missing metadata filter | Irrelevant results | Add `filter` on source/date/category at query time |
| No reranking | First pass misses best chunks | Add cross-encoder reranker |
| Context overflow | Answer truncated | Budget context tokens; summarize overflow chunks |
| Model hallucinates despite context | Fabricated facts | "Only answer from provided context"; faithfulness eval |
| Stale index | Outdated chunks returned | Sync on document changes; `updated_at` metadata |
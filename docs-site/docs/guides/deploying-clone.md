---
sidebar_position: 5
---

# Deploying a Clone

Once you have a portrait, you can deploy it as a conversational clone via the Clone API.

## Quick Start

```bash
# Start with a portrait file
athanor serve --portrait ./portrait.json --port 3001

# Chat with it
curl -X POST http://localhost:3001/api/clone/default/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your approach to technical debt?"}'
```

## Configuration

The Clone API is configured via environment variables or CLI flags:

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3001 | API server port |
| `LLM_PROVIDER` | anthropic | LLM provider (anthropic, openai, ollama) |
| `LLM_MODEL` | — | Model override |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `OLLAMA_BASE_URL` | http://localhost:11434 | Ollama server URL |
| `DATABASE_URL` | — | PostgreSQL connection (optional) |
| `PORTRAIT_PATH` | — | Path to portrait JSON |
| `VECTOR_TOP_K` | 10 | Vector search candidates |
| `RERANK_TOP_N` | 15 | Reranking pool size |
| `CONTEXT_BUDGET_TOKENS` | 4000 | Max context tokens |

## API Endpoints

### Chat

```http
POST /api/clone/:portraitId/chat
Content-Type: application/json

{
  "message": "Your question here",
  "history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ]
}
```

### List Portraits

```http
GET /api/portraits
```

### Portrait Stats

```http
GET /api/portraits/:id/stats
```

### Query Chunks

```http
GET /api/portraits/:id/chunks?cluster=technical-decision-making&type=heuristic&limit=10
```

### Get Chunk with Relations

```http
GET /api/portraits/:id/chunks/:chunkId
```

## Docker Deployment

For production, use the Docker Compose setup:

```bash
cd docker

# Start infrastructure + API
docker compose --profile full up -d

# The API is available at http://localhost:3001
# The Explorer UI is available at http://localhost:3000
```

## The RAG Pipeline

When a message comes in, the Clone API runs a 4-stage retrieval pipeline:

1. **Vector Search** — Find semantically similar chunks (top-K candidates)
2. **Graph Expansion** — Walk relations up to depth 2 to pull connected context
3. **Reranking** — Score by relevance, uniqueness weight, relation bonuses, and layer coverage
4. **Context Assembly** — Select chunks within the token budget, ordered by semantic layer

The assembled context is injected into the LLM prompt alongside the clone's system prompt (generated from the portrait).

## MCP Integration

You can also expose a clone via the Model Context Protocol for use with AI assistants:

```bash
athanor mcp --portrait ./portrait.json --transport stdio
```

See [MCP Server API](../api/mcp-server) for details.

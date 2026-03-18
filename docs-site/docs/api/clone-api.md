---
sidebar_position: 3
---

# Clone API Reference

The Clone API is a REST server (Hono framework) that serves loaded portraits via a graph-aware RAG pipeline.

## Endpoints

### Health Check

```http
GET /
```

Returns server status and loaded portrait count.

### Chat with Clone

```http
POST /api/clone/:portraitId/chat
Content-Type: application/json

{
  "message": "What is your approach to technical debt?",
  "history": [
    {"role": "user", "content": "Previous question"},
    {"role": "assistant", "content": "Previous answer"}
  ]
}
```

**Response:**
```json
{
  "response": "I think about technical debt in terms of...",
  "chunks_used": ["TDM-HEUR-001", "TDM-ANTI-003"],
  "confidence": 0.87
}
```

### List Portraits

```http
GET /api/portraits
```

**Response:**
```json
[
  {"id": "alex-chen", "name": "Alex Chen", "chunk_count": 127}
]
```

### Get Portrait

```http
GET /api/portraits/:id
```

Returns full portrait JSON.

### Portrait Statistics

```http
GET /api/portraits/:id/stats
```

**Response:**
```json
{
  "chunk_count": 127,
  "relation_count": 89,
  "clusters": ["technical-decision-making", "team-leadership", ...],
  "type_distribution": {"heuristic": 23, "belief": 18, ...},
  "completeness_score": 0.72,
  "critical_ratio": 0.34,
  "average_confidence": 0.81
}
```

### Query Chunks

```http
GET /api/portraits/:id/chunks?cluster=technical-decision-making&type=heuristic&uniqueness=CRITICAL&search=monolith&limit=10
```

All query parameters are optional filters.

### Get Chunk with Relations

```http
GET /api/portraits/:id/chunks/:chunkId
```

Returns the chunk plus all relations it participates in.

## RAG Pipeline

The chat endpoint uses a 4-stage retrieval pipeline:

### 1. Vector Search

In-memory keyword/TF-IDF search (or vector embeddings when available). Returns `topK` candidates (default 10).

### 2. Graph Expansion

BFS traversal up to depth 2 from each vector-search hit. Follows relations: INSTANTIATES, LEARNED_FROM, EXPRESSED_THROUGH, CONTRASTS_WITH. Tracks hop distance for scoring.

### 3. Reranking

Each candidate is scored:

```
score = relevance × uniquenessWeight × relationBonus × layerBonus
```

- **uniquenessWeight**: CRITICAL (1.5), HIGH (1.2), MEDIUM (1.0)
- **relationBonus**: direct (1.0), 1-hop (1.3), 2-hop (1.1)
- **layerBonus**: 1.2 if the result set spans 3+ semantic layers

### 4. Context Assembly

Top-N chunks (default 15) are sorted by semantic layer (identity → knowledge → context) and assembled within the token budget (default 4000 tokens).

## Configuration

```typescript
interface CloneApiConfig {
  port: number;              // default: 3001
  databaseUrl: string | null;
  llmProvider: 'anthropic' | 'openai' | 'ollama';
  llmModel?: string;
  apiKey?: string;
  ollamaBaseUrl: string;     // default: http://localhost:11434
  portraitPath: string | null;
  portraitId: string | null;
  vectorTopK: number;        // default: 10
  rerankTopN: number;        // default: 15
  contextBudgetTokens: number; // default: 4000
}
```

## Programmatic Usage

```typescript
import { createServer } from '@athanor/clone-api';

const server = createServer({
  port: 3001,
  llmProvider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  portraitPath: './portrait.json',
});

await server.start();
```

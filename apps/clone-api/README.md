# @athanor/clone-api

REST API server for the Athanor identity cloning toolkit. Serves loaded portraits via a graph-aware RAG pipeline.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/clone/:id/chat` | Chat with a clone |
| GET | `/api/portraits` | List portraits |
| GET | `/api/portraits/:id` | Get portrait |
| GET | `/api/portraits/:id/stats` | Portrait statistics |
| GET | `/api/portraits/:id/chunks` | Query chunks (with filters) |
| GET | `/api/portraits/:id/chunks/:chunkId` | Chunk with relations |

## RAG Pipeline

1. **Vector Search** — Semantic similarity (top-K candidates)
2. **Graph Expansion** — BFS through relations (depth 2)
3. **Reranking** — Uniqueness weight, relation bonus, layer coverage
4. **Context Assembly** — Token-budgeted, layer-ordered context

## Usage

```bash
athanor serve --portrait ./portrait.json --port 3001
```

## License

MIT

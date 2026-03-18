# @athanor/mcp-server

MCP (Model Context Protocol) server for Athanor identity portraits. Exposes portrait data and clone capabilities to AI assistants like Claude Code and Cursor.

## Tools

| Tool | Description |
|------|-------------|
| `search_athanor` | Search portrait chunks using text similarity (pgvector/TF-IDF) |
| `get_portrait_stats` | Get completeness stats, chunk/relation counts, cluster distribution |
| `find_related_chunks` | Traverse the relation graph from a starting chunk |
| `ask_clone` | Full RAG pipeline: vector search + graph expansion + reranking + LLM |
| `list_clusters` | List all clusters with chunk counts and types |

## Resources

| URI Pattern | Description |
|-------------|-------------|
| `athanor://portraits/{id}` | Full portrait JSON |
| `athanor://portraits/{id}/chunks/{chunk_id}` | Single chunk |

## Transports

- **stdio** (default) — for Claude Code, Cursor, and other local MCP clients
- **SSE** — for web-based clients over HTTP

## Usage

### Claude Code

Add to your Claude Code MCP config (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "athanor": {
      "command": "npx",
      "args": ["athanor-mcp", "--portrait", "/path/to/portrait.json"],
      "env": {
        "LLM_PROVIDER": "anthropic",
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

### Cursor

Add to Cursor's MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "athanor": {
      "command": "npx",
      "args": ["athanor-mcp", "--portrait", "./portrait.json"]
    }
  }
}
```

### CLI

```bash
# stdio transport (default)
athanor mcp --portrait ./portrait.json

# SSE transport on custom port
athanor mcp --transport sse --port 3001 --portrait ./portrait.json

# Direct invocation
npx athanor-mcp --portrait ./portrait.json
```

### Standalone (SSE)

```bash
npx athanor-mcp --transport sse --port 3001 --portrait ./portrait.json
```

Then connect your MCP client to `http://localhost:3001/sse`.

## Configuration

All configuration via environment variables (same as clone-api):

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT` | `stdio` | Transport type: `stdio` or `sse` |
| `PORT` | `3001` | SSE server port |
| `PORTRAIT_PATH` | — | Path to portrait JSON file |
| `LLM_PROVIDER` | `ollama` | LLM provider: `anthropic`, `openai`, `ollama` |
| `LLM_MODEL` | — | Model name (provider-specific) |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `VECTOR_TOP_K` | `10` | Number of vector search results |
| `RERANK_TOP_N` | `15` | Number of results after reranking |
| `CONTEXT_BUDGET_TOKENS` | `4000` | Max tokens for context assembly |

## Development

```bash
pnpm install
pnpm --filter @athanor/mcp-server build
pnpm --filter @athanor/mcp-server test
pnpm --filter @athanor/mcp-server dev -- --portrait ./portrait.json
```

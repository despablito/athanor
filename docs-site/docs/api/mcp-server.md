---
sidebar_position: 4
---

# MCP Server API

The Athanor MCP Server exposes portrait data and clone capabilities as tools and resources for AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io/).

## Starting the Server

```bash
# Stdio transport (for Claude Code, Cursor, etc.)
athanor mcp --portrait ./portrait.json --transport stdio

# SSE transport (for web clients)
athanor mcp --portrait ./portrait.json --transport sse --port 8080
```

## Tools

### search_athanor

Search across portrait chunks by text similarity.

**Parameters:**
| Name | Type | Required | Description |
|---|---|---|---|
| `query` | string | yes | Search text |
| `portrait_id` | string | no | Specific portrait (defaults to first loaded) |
| `top_k` | number | no | Max results (default 10) |

### get_portrait_stats

Get portrait statistics including completeness, chunk counts, and cluster coverage.

**Parameters:**
| Name | Type | Required | Description |
|---|---|---|---|
| `portrait_id` | string | no | Specific portrait |

### find_related_chunks

Traverse the relation graph from a starting chunk.

**Parameters:**
| Name | Type | Required | Description |
|---|---|---|---|
| `chunk_id` | string | yes | Starting chunk ID |
| `depth` | number | no | Traversal depth (default 2) |
| `relation_types` | string[] | no | Filter by relation type |

### ask_clone

Full RAG pipeline — ask the clone a question and get a response.

**Parameters:**
| Name | Type | Required | Description |
|---|---|---|---|
| `message` | string | yes | The question |
| `portrait_id` | string | no | Specific portrait |
| `history` | object[] | no | Conversation history |

### list_clusters

List all clusters in a portrait with chunk counts and type breakdown.

**Parameters:**
| Name | Type | Required | Description |
|---|---|---|---|
| `portrait_id` | string | no | Specific portrait |

## Resources

### Portrait

**URI:** `athanor://portraits/{id}`

Returns the full portrait JSON. Listed in `resources/list`.

### Chunk

**URI:** `athanor://portraits/{id}/chunks/{chunk_id}`

Returns a single chunk as JSON. Accessed via resource templates.

## Configuration for Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "athanor": {
      "command": "npx",
      "args": ["@athanor/mcp-server", "--portrait", "/path/to/portrait.json"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

## Configuration

```typescript
interface McpServerConfig {
  transport: 'stdio' | 'sse';
  port: number;               // default: 8080 (SSE only)
  portraitPath: string | null;
  llmProvider: 'anthropic' | 'openai' | 'ollama';
  llmModel?: string;
  apiKey?: string;
  ollamaBaseUrl: string;
  vectorTopK: number;         // default: 10
  rerankTopN: number;         // default: 15
  contextBudgetTokens: number; // default: 4000
}
```

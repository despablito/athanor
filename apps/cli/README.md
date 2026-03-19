# @athanor/cli

Command-line interface for the Athanor identity cloning toolkit. Manages the full portrait lifecycle.

## Commands

| Command | Description |
|---|---|
| `init <name>` | Create a new portrait |
| `import <path>` | Load an existing portrait JSON |
| `validate [path]` | Validate portrait against the protocol |
| `stats [path]` | Show portrait statistics |
| `export [path]` | Export to JSON, Markdown, Obsidian, or Cypher |
| `extract <source>` | Extract chunks from a transcript/document |
| `meta-generate` | Generate meta-chunks from patterns |
| `clone-prompt` | Synthesize system prompt for a clone |
| `embed` | Generate vector embeddings |
| `explore` | Analyze and filter chunks |
| `serve` | Start the Clone API server |
| `mcp` | Start the MCP server |

## Usage

```bash
# Via pnpm from monorepo root
pnpm --filter @athanor/cli dev -- <command>

# Or after global link
athanor <command>
```

## License

MIT

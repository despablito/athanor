# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the monorepo root (`athanor/`):

```bash
pnpm install          # Install all workspace dependencies
pnpm build            # Build all packages (Turborepo)
pnpm test             # Run all tests (Vitest)
pnpm lint             # ESLint across all packages
pnpm dev              # Watch mode for all packages
pnpm clean            # Remove dist/ and build artifacts
```

Run against a single package:
```bash
pnpm --filter @athanor/core run test
pnpm --filter @athanor/extractor run build
pnpm --filter @athanor/cli run dev
```

Run the CLI in dev mode (without building):
```bash
pnpm athanor <command>   # e.g. pnpm athanor init <name>
```

## Architecture

This is a **pnpm + Turborepo monorepo** for an AI identity cloning system. It models human identity as a typed knowledge graph of "Chunks" connected by typed Relations — rather than embeddings alone.

### Package layout

```
packages/
  athanor-core/        # Types, Portrait class, GraphStore abstraction, validator, export
  athanor-extractor/   # LLM extraction pipeline: chunker → classifier → linker → meta-generator
  athanor-interviewer/ # 5-phase adaptive AI interview agent + red-team inquisitor
apps/
  cli/                 # Commander.js CLI (main entry: src/bin/athanor.ts)
  clone-api/           # Hono REST API with graph-aware RAG
  explorer/            # Next.js 14 + D3.js force-directed graph visualization
integrations/
  mcp-server/          # MCP server exposing search/stats/ask_clone/related tools
```

### Data model (`@athanor/core`)

- **Portrait**: top-level identity capsule, contains Chunks + Relations + metadata
- **Chunk**: atomic identity unit; 15 types (`heuristic`, `belief`, `emotion`, `contradiction`, `hard_rule`, `meta`, etc.); carries `uniqueness` (CRITICAL/HIGH/MEDIUM), `confidence` [0–1], `cluster`, and `provenance`
- **Relation**: 6 types connecting chunks (`INSTANTIATES`, `ENABLES`, `LEARNED_FROM`, `CONTRASTS_WITH`, `HARDCODED_EXCEPTION`, `EXPRESSED_THROUGH`)
- **GraphStore**: interface with two implementations — `SqliteGraphStore` (local default, libSQL) and `PostgresGraphStore` (enterprise, requires PostgreSQL + Apache AGE)

### Extraction pipeline (`@athanor/extractor`)

LLM calls flow through: `chunker.ts` → `classifier.ts` (deduplication) → `linker.ts` (relation detection) → `meta-generator.ts` (synthesis). Provider abstraction in `provider.ts` supports Anthropic, OpenAI, and Ollama.

### RAG in clone-api

4-stage pipeline: vector search → graph traversal expansion → reranking → context assembly. Implemented in `apps/clone-api/src/rag.ts`.

### JSON Schemas

Chunk, Relation, and Portrait formats are formally specified in `schema/` and validated via AJV. The protocol spec is in `protocol/PROTOCOL.md`.

## Key conventions

- TypeScript strict mode throughout; no `any` without justification
- Chunk and Relation types are TypeScript `as const` union types defined in `packages/athanor-core/src/types.ts` — extend them there first when adding new types
- Storage backend is selected via `graph-factory.ts`; default is SQLite, PostgreSQL requires `DATABASE_URL` env var
- LLM provider is selected via env: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or Ollama base URL

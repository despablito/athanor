<div align="center">

# Athanor

**Deep identity cloning through structured knowledge graphs — not shallow vector similarity.**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![CI](https://github.com/anthropics/athanor/actions/workflows/ci.yml/badge.svg)](https://github.com/anthropics/athanor/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D22-green.svg)](.nvmrc)

[Quick Start](#quick-start) · [Documentation](docs/) · [Protocol](protocol/PROTOCOL.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## Why Athanor?

Most AI "personality" tools treat identity as a flat bag of traits or a vector embedding over someone's writing style. They produce clones that sound vaguely like you on the surface but collapse under any probing question. Ask them *why* they hold a belief, what exceptions they'd carve out, or how two contradictory preferences coexist — and the illusion breaks. That's because shallow approaches discard the structure that makes a person coherent.

Athanor takes a fundamentally different approach. It models identity as a **typed, directed knowledge graph** of atomic units called *Chunks* — heuristics, beliefs, emotions, contradictions, anti-patterns, rituals, and more — connected by meaningful *Relations* like INSTANTIATES, CONTRASTS_WITH, and HARDCODED_EXCEPTION. Each chunk carries provenance (where it came from), confidence (how certain we are), and uniqueness (how distinctive it is to this person). The result is a *Portrait*: a rich, traversable map of how someone actually thinks, not just what they say.

When you talk to an Athanor Clone, it doesn't retrieve the top-5 similar paragraphs. It runs a **graph-aware RAG pipeline** that starts with semantic search, expands through the relation graph to pull in connected reasoning, reranks by uniqueness and structural importance, and assembles context across identity/knowledge/context layers. The clone knows *why* it holds a position, can articulate the tensions in its own worldview, and respects the confidence levels of its own knowledge. This is depth, not surface.

## Quick Start

```bash
# 1. Start infrastructure (PostgreSQL + Ollama)
cd docker && docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Build all packages
pnpm build

# 4. Initialize a new portrait
pnpm --filter @athanor/cli dev -- init "Alex Chen"

# 5. Extract chunks from a transcript
pnpm --filter @athanor/cli dev -- extract interview.txt \
  --provider anthropic \
  --api-key $ANTHROPIC_API_KEY \
  --subject "Alex Chen"

# 6. Validate the portrait
pnpm --filter @athanor/cli dev -- validate

# 7. Start the Clone API
pnpm --filter @athanor/cli dev -- serve --portrait ./portrait.json

# 8. Chat with the clone
curl -X POST http://localhost:3001/api/clone/default/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What do you think about microservices?"}'

# 9. Explore visually
pnpm --filter @athanor/explorer dev
# Open http://localhost:3000
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Athanor Monorepo                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────┐    │
│  │   @athanor/   │  │    @athanor/      │  │     @athanor/      │    │
│  │     core      │  │    extractor      │  │     clone-api      │    │
│  │              │  │                  │  │                    │    │
│  │  Types       │  │  Chunker        │  │  Hono REST API    │    │
│  │  Portrait    │──│  Classifier     │──│  RAG Pipeline     │    │
│  │  GraphStore  │  │  Linker         │  │    ┌────────────┐ │    │
│  │  Validator   │  │  Meta-Generator │  │    │ 1. Vector  │ │    │
│  │  Export      │  │  Clone-Prompt   │  │    │ 2. Graph   │ │    │
│  │              │  │  Embedder       │  │    │ 3. Rerank  │ │    │
│  │              │  │                  │  │    │ 4. Assemble│ │    │
│  └──────┬───────┘  └────────┬─────────┘  │    └────────────┘ │    │
│         │                   │             └─────────┬──────────┘    │
│         │                   │                       │               │
│  ┌──────┴───────────────────┴───────────────────────┴──────────┐   │
│  │                        @athanor/cli                          │   │
│  │  init · import · validate · stats · export · extract         │   │
│  │  meta-generate · clone-prompt · embed · explore · serve · mcp│   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────┐              ┌────────────────────────┐      │
│  │  @athanor/explorer│              │  @athanor/mcp-server   │      │
│  │  Next.js + D3     │              │  MCP Tools & Resources │      │
│  │  Force Graph      │              │  search · stats · ask  │      │
│  │  Cluster Map      │              │  related · clusters    │      │
│  │  Stats Dashboard  │              │  stdio / SSE transport │      │
│  └──────────────────┘              └────────────────────────┘      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                    Infrastructure                         │      │
│  │  PostgreSQL + Apache AGE (graph)  ·  Ollama (local LLM)  │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

## How It Compares

| Feature | Athanor | Delphi | Uare.ai | Character.ai |
|---|---|---|---|---|
| Identity model | Typed knowledge graph | Profile summary | Trait vectors | Conversation fine-tune |
| Chunk types | 14 (heuristic, belief, emotion, contradiction...) | N/A | ~5 traits | N/A |
| Relations | 6 typed (INSTANTIATES, CONTRASTS_WITH...) | None | None | None |
| Uniqueness scoring | 3-level (CRITICAL/HIGH/MEDIUM) | None | None | None |
| Confidence tracking | Per-chunk 0.0–1.0 | None | None | None |
| Provenance | 9 source types | Limited | None | None |
| Retrieval | Graph-aware RAG (4-stage) | Simple retrieval | Vector only | Full context |
| Contradictions | First-class (HARDCODED_EXCEPTION) | Ignored | Ignored | Averaged out |
| Export formats | JSON, Cypher, Markdown, Obsidian | Proprietary | Proprietary | None |
| Self-hostable | Yes (Docker) | No | No | No |
| Open source | Apache 2.0 | No | No | No |

## Stack

| Component | Technology | Purpose |
|---|---|---|
| Core Library | TypeScript, AJV | Types, validation, graph storage, export |
| Extractor | Anthropic/OpenAI/Ollama | LLM-powered chunk extraction pipeline |
| Clone API | Hono, PostgreSQL, Apache AGE | REST API with graph-aware RAG |
| Explorer | Next.js, React, D3.js, Tailwind | Interactive portrait visualization |
| CLI | Commander.js | Full portrait lifecycle management |
| MCP Server | @modelcontextprotocol/sdk | AI assistant integration |
| Infrastructure | Docker, PostgreSQL, Ollama | Self-hosted deployment |
| Build | Turborepo, pnpm, Vitest | Monorepo orchestration and testing |

## Project Structure

```
athanor/
├── packages/
│   ├── athanor-core/        # Core types, Portrait, GraphStore, validation, export
│   └── athanor-extractor/   # LLM extraction: chunker, classifier, linker, embedder
├── apps/
│   ├── cli/                 # CLI: init, extract, validate, serve, explore, mcp
│   ├── clone-api/           # REST API: chat, portraits, chunks, stats
│   └── explorer/            # Web UI: D3 force graph, cluster map, stats dashboard
├── integrations/
│   └── mcp-server/          # MCP tools: search, stats, related, ask_clone
├── protocol/                # PROTOCOL.md — the Athanor Protocol specification
├── schema/                  # JSON Schema: chunk, relation, portrait
├── docker/                  # Docker Compose: PostgreSQL + AGE, Ollama
└── examples/                # Example portraits and tutorials
```

## The Athanor Protocol

The [Athanor Protocol](protocol/PROTOCOL.md) defines the data model for identity capture:

- **Chunks** — Atomic units of identity (14 types: heuristic, belief, emotion, contradiction, anti-pattern, ritual...)
- **Relations** — Directed edges (6 types: INSTANTIATES, ENABLES, LEARNED_FROM, CONTRASTS_WITH, HARDCODED_EXCEPTION, EXPRESSED_THROUGH)
- **Portraits** — Complete identity capsules with metadata, provenance, and confidence scoring
- **Clones** — AI agents loaded with a Portrait, respecting uniqueness and confidence levels

## Roadmap

- [ ] **v0.2** — Multi-modal extraction (voice, video, images)
- [ ] **v0.3** — Portrait diffing and merging (track identity evolution over time)
- [ ] **v0.4** — Collaborative portraits (multiple observers contribute chunks)
- [ ] **v0.5** — Neo4j backend option alongside Apache AGE
- [ ] **v1.0** — Stable protocol, published JSON-LD context, npm packages on registry

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and how to add new chunk types, relation types, and extraction prompts.

## License

[Apache License 2.0](LICENSE)

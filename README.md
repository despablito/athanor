<div align="center">

# Athanor

**Deep identity cloning through structured knowledge graphs — not shallow vector similarity.**

<p>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://github.com/despablito/athanor/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/despablito/athanor/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=for-the-badge" alt="TypeScript"></a>
  <a href=".nvmrc"><img src="https://img.shields.io/badge/Node-%3E%3D22-green.svg?style=for-the-badge" alt="Node"></a>
</p>

[Quick Start](#quick-start) · [How It Works](#how-it-works) · [Protocol](protocol/PROTOCOL.md) · [Docs](docs-site/) · [Contributing](CONTRIBUTING.md)

</div>

---

## Why Athanor?

Most AI "personality" tools treat identity as a flat bag of traits or a vector embedding over someone's writing style. They produce clones that sound vaguely like you on the surface but collapse under any probing question. Ask them *why* they hold a belief, what exceptions they'd carve out, or how two contradictory preferences coexist — and the illusion breaks.

Athanor takes a fundamentally different approach. It models identity as a **typed, directed knowledge graph** of atomic units called *Chunks* — heuristics, beliefs, emotions, contradictions, anti-patterns, rituals, and more — connected by meaningful *Relations* like INSTANTIATES, CONTRASTS_WITH, and HARDCODED_EXCEPTION. Each chunk carries provenance, confidence, and uniqueness. The result is a *Portrait*: a rich, traversable map of how someone actually thinks.

When you talk to an Athanor Clone, it doesn't retrieve the top-5 similar paragraphs. It runs a **graph-aware RAG pipeline** — semantic search, graph expansion, uniqueness reranking, layer assembly — so the clone knows *why* it holds a position and can articulate the tensions in its own worldview.

## Highlights

- **Structured identity model** — 14 chunk types, 6 relation types, 3-level uniqueness scoring, per-chunk confidence tracking
- **AI Interviewer** — 5-phase adaptive interview agent that extracts deep identity fragments through guided conversation
- **Graph-aware RAG** — 4-stage retrieval: vector search → graph expansion → reranking → layer assembly
- **Interactive Explorer** — D3.js force-directed graph visualization with cluster maps and stats dashboards
- **MCP Integration** — First-class Model Context Protocol server for AI assistant integration (Claude, Cursor, etc.)
- **Multi-provider LLM** — Works with Anthropic, OpenAI, and Ollama (local)
- **Full export** — JSON, Cypher, Markdown, Obsidian vault
- **Self-hostable** — Docker Compose with PostgreSQL + Apache AGE + Ollama

## Quick Start

**Prerequisites:** Node >= 22, pnpm, Docker (for infrastructure)

```bash
# Clone and install
git clone https://github.com/despablito/athanor.git
cd athanor
pnpm install

# Start infrastructure (PostgreSQL + Ollama)
cd docker && docker compose up -d && cd ..

# Build all packages
pnpm build

# Initialize a new portrait
pnpm --filter @athanor/cli dev -- init "Alex Chen"

# Run an AI-guided interview to build the portrait
pnpm --filter @athanor/cli dev -- interview \
  --provider anthropic \
  --api-key $ANTHROPIC_API_KEY

# Or extract chunks from an existing transcript
pnpm --filter @athanor/cli dev -- extract interview.txt \
  --provider anthropic \
  --api-key $ANTHROPIC_API_KEY \
  --subject "Alex Chen"

# Validate the portrait
pnpm --filter @athanor/cli dev -- validate

# Start the Clone API and chat
pnpm --filter @athanor/cli dev -- serve --portrait ./portrait.json
curl -X POST http://localhost:3001/api/clone/default/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What do you think about microservices?"}'

# Explore visually — open http://localhost:3000
pnpm --filter @athanor/explorer dev
```

## How It Works

```
                    ┌─────────────────────┐
                    │   Source Material    │
                    │  transcripts, notes, │
                    │  interviews, docs    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    AI Interviewer    │
                    │  5-phase adaptive    │
                    │  identity extraction │
                    └──────────┬──────────┘
                               │
              ┌────────────────▼────────────────┐
              │          Extraction Pipeline      │
              │  Chunker → Classifier → Linker   │
              │  → Meta-Generator → Embedder     │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │           Portrait               │
              │  Typed knowledge graph of        │
              │  chunks + relations + metadata   │
              └───────┬────────────────┬────────┘
                      │                │
         ┌────────────▼──┐    ┌───────▼──────────┐
         │  Clone API     │    │    Explorer       │
         │  Graph-aware   │    │  D3.js force      │
         │  RAG pipeline  │    │  graph + stats    │
         └────────────────┘    └──────────────────┘
```

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           Athanor Monorepo                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  @athanor/    │  │  @athanor/        │  │  @athanor/               │   │
│  │    core       │  │    extractor      │  │    interviewer           │   │
│  │               │  │                   │  │                          │   │
│  │  Types        │  │  Chunker          │  │  5-Phase Interview Agent │   │
│  │  Portrait     │──│  Classifier       │──│  Adaptive Depth Detect   │   │
│  │  GraphStore   │  │  Linker           │  │  Session Scheduling      │   │
│  │  Validator    │  │  Meta-Generator   │  │  Transcript → Chunks     │   │
│  │  Export       │  │  Embedder         │  │                          │   │
│  └──────┬────────┘  └────────┬──────────┘  └─────────┬────────────────┘  │
│         │                    │                        │                   │
│  ┌──────┴────────────────────┴────────────────────────┴──────────────┐   │
│  │                         @athanor/cli                               │   │
│  │  init · import · validate · stats · export · extract               │   │
│  │  interview · meta-generate · clone-prompt · embed · serve · mcp    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐     │
│  │ @athanor/explorer │  │ @athanor/clone-api│  │ @athanor/mcp-server│     │
│  │ Next.js + D3      │  │ Hono REST API     │  │ MCP Tools          │     │
│  │ Force Graph       │  │ Graph-aware RAG   │  │ search · stats     │     │
│  │ Cluster Map       │  │ 4-stage pipeline  │  │ ask · related      │     │
│  │ Stats Dashboard   │  │ Chat endpoint     │  │ stdio / SSE        │     │
│  └──────────────────┘  └──────────────────┘  └────────────────────┘     │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                       Infrastructure                               │   │
│  │  PostgreSQL + Apache AGE (graph)  ·  pgvector  ·  Ollama (LLM)   │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
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
| Open source | MIT | No | No | No |

## Project Structure

```
athanor/
├── packages/
│   ├── athanor-core/          # Core types, Portrait, GraphStore, validation, export
│   ├── athanor-extractor/     # LLM extraction: chunker, classifier, linker, embedder
│   └── athanor-interviewer/   # AI interview agent: 5-phase adaptive identity extraction
├── apps/
│   ├── cli/                   # CLI: init, interview, extract, validate, serve, explore
│   ├── clone-api/             # REST API: chat, portraits, chunks, stats
│   └── explorer/              # Web UI: D3 force graph, cluster map, stats dashboard
├── integrations/
│   └── mcp-server/            # MCP tools: search, stats, related, ask_clone
├── protocol/                  # PROTOCOL.md — the Athanor Protocol specification
├── schema/                    # JSON Schema: chunk, relation, portrait
├── docs-site/                 # Docusaurus documentation site
├── docker/                    # Docker Compose: PostgreSQL + AGE, Ollama
└── examples/                  # Example portraits (fictional CTO)
```

## Stack

| Component | Technology | Purpose |
|---|---|---|
| Core Library | TypeScript, AJV | Types, validation, graph storage, export |
| Extractor | Anthropic/OpenAI/Ollama | LLM-powered chunk extraction pipeline |
| Interviewer | LLM + adaptive prompts | 5-phase identity interview with depth detection |
| Clone API | Hono, PostgreSQL, Apache AGE | REST API with graph-aware RAG |
| Explorer | Next.js, React, D3.js, Tailwind | Interactive portrait visualization |
| CLI | Commander.js | Full portrait lifecycle management |
| MCP Server | @modelcontextprotocol/sdk | AI assistant integration (Claude, Cursor) |
| Infrastructure | Docker, PostgreSQL, Ollama | Self-hosted deployment |
| Build | Turborepo, pnpm, Vitest | Monorepo orchestration and testing |

## The Athanor Protocol

The [Athanor Protocol](protocol/PROTOCOL.md) defines the data model for identity capture:

- **Chunks** — Atomic units of identity (14 types: heuristic, belief, emotion, contradiction, anti-pattern, ritual...)
- **Relations** — Directed edges (6 types: INSTANTIATES, ENABLES, LEARNED_FROM, CONTRASTS_WITH, HARDCODED_EXCEPTION, EXPRESSED_THROUGH)
- **Portraits** — Complete identity capsules with metadata, provenance, and confidence scoring
- **Clones** — AI agents loaded with a Portrait, respecting uniqueness and confidence levels

## Development

Prefer `pnpm` for builds. Requires **Node >= 22**.

```bash
git clone https://github.com/despablito/athanor.git
cd athanor
pnpm install
pnpm build

# Run all tests
pnpm test

# Dev loop (auto-reload on changes)
pnpm --filter @athanor/cli dev -- <command>

# Lint
pnpm lint

# Type check
pnpm build
```

Individual packages:

```bash
# Core library
pnpm --filter @athanor/core test

# Extractor
pnpm --filter @athanor/extractor test

# Interviewer
pnpm --filter @athanor/interviewer test

# Explorer (dev server on :3000)
pnpm --filter @athanor/explorer dev

# Clone API (dev server on :3001)
pnpm --filter @athanor/clone-api dev
```

## CLI Commands

```
athanor init <name>            Create a new portrait
athanor interview              Run AI-guided identity interview
athanor import <file>          Import chunks from JSON/transcript
athanor extract <file>         LLM-extract chunks from text
athanor validate               Validate portrait against schemas
athanor stats                  Portrait statistics and coverage
athanor meta-generate          Generate meta-chunks (patterns, principles)
athanor clone-prompt           Generate system prompt for clone
athanor embed                  Generate embeddings for chunks
athanor export                 Export to Cypher, Markdown, Obsidian
athanor serve                  Start the Clone API server
athanor explore                Open the Explorer UI
athanor mcp                    Start the MCP server
```

## Roadmap

- [ ] **v0.2** — Multi-modal extraction (voice, video, images)
- [ ] **v0.3** — Portrait diffing and merging (track identity evolution over time)
- [ ] **v0.4** — Collaborative portraits (multiple observers contribute chunks)
- [ ] **v0.5** — Neo4j backend option alongside Apache AGE
- [ ] **v1.0** — Stable protocol, published JSON-LD context, npm packages on registry

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and how to add new chunk types, relation types, and extraction prompts.

## License

[MIT License](LICENSE)

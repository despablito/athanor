<div align="center">

# Athanor

**Deep identity cloning through structured knowledge graphs — not shallow vector similarity.**

<p>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://github.com/despablito/athanor/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/despablito/athanor/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=for-the-badge" alt="TypeScript"></a>
  <a href=".nvmrc"><img src="https://img.shields.io/badge/Node-%3E%3D22-green.svg?style=for-the-badge" alt="Node"></a>
</p>

[Quick Start](#-quick-start-the-magic-mirror) · [How It Works](#how-it-works) · [Protocol](protocol/PROTOCOL.md) · [Docs](docs-site/) · [Contributing](CONTRIBUTING.md)

</div>

---

## Why Athanor?

Most AI “personality” tools treat identity as a flat bag of traits or a single embedding over writing style. They *sound* like you until someone asks *why* you believe something, what exceptions you’d carve out, or how two contradictory preferences coexist — then the illusion breaks.

Athanor models identity as a **typed, directed knowledge graph** of atomic units called *Chunks* — heuristics, beliefs, emotions, contradictions, anti-patterns, rituals, and more — connected by meaningful *Relations* (e.g. `INSTANTIATES`, `CONTRASTS_WITH`, `HARDCODED_EXCEPTION`). Each chunk carries provenance, confidence, and uniqueness. The result is a **Portrait**: a traversable map of how someone actually thinks.

When you talk to an Athanor **Clone**, retrieval isn’t “top-5 similar paragraphs.” It’s **graph-aware RAG** — semantic search, graph expansion, uniqueness-aware scoring, and layer assembly — so the clone can articulate *why* it holds a position and surface tensions in its own worldview.

---

## Highlights

- **Zero-config local mode** — Embedded graph + vector database (libSQL/SQLite). **No Docker required** to get started.
- **Structured identity model** — 14 chunk types, 6 relation types, 3-level uniqueness scoring, per-chunk confidence
- **AI Interviewer** — 5-phase adaptive interview agent for deep identity extraction
- **Graph-aware RAG** — Vector search → graph expansion → reranking → layer assembly
- **Interactive chat** — `athanor chat` for a terminal clone session (no HTTP server)
- **Interactive Explorer** — D3.js force-directed graph, cluster maps, stats dashboards
- **MCP integration** — Model Context Protocol server for Claude, Cursor, and friends
- **Multi-provider LLM** — Anthropic, OpenAI, and Ollama (local)
- **Full export** — JSON, Cypher, Markdown, Obsidian vault
- **Self-hostable** — Optional Docker Compose for PostgreSQL + Apache AGE + Ollama when you want enterprise scale

---

## ✨ Quick Start: The Magic Mirror

**Prerequisites:** Node ≥ 22 (see `.nvmrc`). No containers required for the path below.

```bash
npm install -g @athanor/cli

athanor init "My Clone"

athanor extract ./my_notes.txt --provider anthropic

athanor chat
```

That’s it: a portrait on disk, chunks extracted from your text, then a **live interactive clone** in your terminal — ask questions, probe beliefs, and watch graph-aware retrieval keep the model grounded.

> **Contributors / monorepo:** clone the repo, run `pnpm install && pnpm build`, then run the CLI with **`pnpm athanor <command>`** (root script) or `pnpm --filter @athanor/cli dev -- <command>`. Same commands; no global install needed.

For **Anthropic / OpenAI** (`--provider anthropic` or `openai`), put keys in a **`.env`** at the repo root (or `apps/cli/.env`). The CLI loads the first `.env` it finds walking up from the current working directory — Node does not read `.env` files by itself.

---

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
         │  Clone API    │    │    Explorer       │
         │  + CLI chat   │    │  D3.js force      │
         │  Graph-aware  │    │  graph + stats    │
         │  RAG pipeline │    │                   │
         └───────────────┘    └──────────────────┘
```

---

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
│  │  init · import · validate · stats · export · extract · chat        │   │
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
│  │                    Dual Storage Layer                            │   │
│  │  ┌─────────────────────────────┬─────────────────────────────┐ │   │
│  │  │ Local (zero-friction)          │ Enterprise (optional)      │ │   │
│  │  │ Embedded DB: libSQL/SQLite     │ PostgreSQL + Apache AGE    │ │   │
│  │  │ + JSON portraits on disk       │ + pgvector · Docker Compose│ │   │
│  │  └─────────────────────────────┴─────────────────────────────┘ │   │
│  │  LLM: Ollama (local) · Anthropic / OpenAI (cloud)                │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## How It Compares

| Feature | Athanor | Delphi | Uare.ai | Character.ai |
|---|---|---|---|---|
| Identity model | Typed knowledge graph | Profile summary | Trait vectors | Conversation fine-tune |
| Chunk types | 14 (heuristic, belief, emotion, contradiction…) | N/A | ~5 traits | N/A |
| Relations | 6 typed (INSTANTIATES, CONTRASTS_WITH…) | None | None | None |
| Uniqueness scoring | 3-level (CRITICAL/HIGH/MEDIUM) | None | None | None |
| Confidence tracking | Per-chunk 0.0–1.0 | None | None | None |
| Provenance | 9 source types | Limited | None | None |
| Retrieval | Graph-aware RAG (4-stage) | Simple retrieval | Vector only | Full context |
| Contradictions | First-class (HARDCODED_EXCEPTION) | Ignored | Ignored | Averaged out |
| Export formats | JSON, Cypher, Markdown, Obsidian | Proprietary | Proprietary | None |
| Self-hostable | Yes (local embedded DB or Docker) | No | No | No |
| Open source | MIT | No | No | No |

---

## Project Structure

```
athanor/
├── packages/
│   ├── athanor-core/          # Types, Portrait, graph stores (Postgres / libSQL), validation, export
│   ├── athanor-extractor/     # LLM extraction: chunker, classifier, linker, embedder
│   └── athanor-interviewer/   # AI interview agent: 5-phase adaptive identity extraction
├── apps/
│   ├── cli/                   # CLI: init, interview, extract, validate, chat, serve, …
│   ├── clone-api/             # REST API: chat, portraits, chunks, stats
│   └── explorer/              # Web UI: D3 force graph, cluster map, stats dashboard
├── integrations/
│   └── mcp-server/            # MCP tools: search, stats, related, ask_clone
├── protocol/                  # PROTOCOL.md — the Athanor Protocol specification
├── schema/                    # JSON Schema: chunk, relation, portrait
├── docs-site/                 # Docusaurus documentation site
├── docker/                    # Optional: PostgreSQL + AGE, Ollama
└── examples/                  # Example portraits (fictional CTO)
```

---

## Stack

| Component | Technology | Purpose |
|---|---|---|
| Core Library | TypeScript, AJV | Types, validation, dual graph backends, export |
| Extractor | Anthropic / OpenAI / Ollama | LLM-powered chunk extraction pipeline |
| Interviewer | LLM + adaptive prompts | 5-phase identity interview with depth detection |
| Clone API | Hono | REST API with graph-aware RAG |
| Explorer | Next.js, React, D3.js, Tailwind | Interactive portrait visualization |
| CLI | Commander.js | Full portrait lifecycle + `chat` |
| MCP Server | @modelcontextprotocol/sdk | AI assistant integration (Claude, Cursor) |
| Local storage | libSQL / SQLite, JSON | Zero-friction default |
| Enterprise storage | PostgreSQL, Apache AGE, pgvector | Optional scale-out graph + vectors |
| Build | Turborepo, pnpm, Vitest | Monorepo orchestration and testing |

---

## The Athanor Protocol

The [Athanor Protocol](protocol/PROTOCOL.md) defines the data model for identity capture:

- **Chunks** — Atomic units of identity (14 types: heuristic, belief, emotion, contradiction, anti-pattern, ritual…)
- **Relations** — Directed edges (6 types: INSTANTIATES, ENABLES, LEARNED_FROM, CONTRASTS_WITH, HARDCODED_EXCEPTION, EXPRESSED_THROUGH)
- **Portraits** — Complete identity capsules with metadata, provenance, and confidence scoring
- **Clones** — AI agents loaded with a Portrait, respecting uniqueness and confidence levels

---

## Development

We use **pnpm** and **Node ≥ 22**.

```bash
git clone https://github.com/despablito/athanor.git
cd athanor
pnpm install
pnpm build
pnpm test
pnpm lint
```

```bash
pnpm --filter @athanor/cli dev -- <command>
pnpm --filter @athanor/explorer dev
pnpm --filter @athanor/clone-api dev
```

---

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
athanor chat                   Interactive terminal chat with your clone
athanor serve                  Start the Clone API server
athanor explore                Open the Explorer UI
athanor mcp                    Start the MCP server
```

---

## Roadmap

- [ ] **v0.2** — Zero-friction local engine (embedded SQLite graph + vector store; first-class `athanor chat` + libSQL path)
- [ ] **v0.3** — Adversarial self-play (red-team the clone’s identity to surface cognitive dissonance and blind spots)
- [ ] **v0.4** — Continuous latent persona (graph-augmented LoRA fine-tuning tied to the portrait)
- [ ] **v1.0** — Stable protocol, published JSON-LD context, npm packages on the public registry

---

## Contributing

**You belong here.** Whether you’re fixing a typo, tightening a prompt, improving a diagram, or adding a storage backend — we’re glad you showed up.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code style, and how to extend chunk types, relations, and extraction prompts. Open an issue to propose bigger ideas; open a PR for focused changes. Be kind, be clear, and ship small.

---

## License

Athanor is released under the **[MIT License](LICENSE)** — permissive, commercial-friendly, and simple. Use it in your product, your research, or your weekend hack. Attribution appreciated; legal headaches not required.

If you build something cool, tell us — we’d love to see it.

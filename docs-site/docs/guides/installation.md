---
sidebar_position: 1
---

# Installation

Athanor can be installed via Docker (recommended), from npm, or built from source.

## Docker (Recommended)

The fastest way to get the full stack running:

```bash
git clone https://github.com/anthropics/athanor.git
cd athanor/docker
docker compose up -d
```

This starts:
- **PostgreSQL + Apache AGE** — Graph database on port 5432
- **Ollama** — Local LLM inference on port 11434

To also start the Clone API and Explorer UI:

```bash
docker compose --profile full up -d
```

This adds:
- **Clone API** — REST API on port 3001
- **Explorer** — Web UI on port 3000

## From npm (Development)

### Prerequisites

- **Node.js** >= 22 (see `.nvmrc`)
- **pnpm** >= 10

### Steps

```bash
# Clone the repository
git clone https://github.com/anthropics/athanor.git
cd athanor

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Verify installation
pnpm test
```

### Using the CLI

After building, you can run the CLI directly:

```bash
# Via pnpm
pnpm --filter @athanor/cli dev -- <command>

# Or link globally
cd apps/cli
pnpm link --global
athanor --help
```

## From Source

```bash
git clone https://github.com/anthropics/athanor.git
cd athanor

# Install dependencies
pnpm install

# Build in watch mode for development
pnpm dev
```

## Infrastructure Setup

### PostgreSQL + Apache AGE

If you're not using Docker, install Apache AGE manually:

```bash
# The database schema
athanor db schema --database-url postgresql://user:pass@localhost:5432/athanor
```

### Ollama (Optional)

For local LLM inference (no API keys needed):

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2

# Pull an embedding model
ollama pull nomic-embed-text
```

### API Keys

For cloud LLM providers, set environment variables:

```bash
# Anthropic (Claude)
export ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
export OPENAI_API_KEY=sk-...
```

## Verify Installation

```bash
# Build everything
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint

# Try the CLI
pnpm --filter @athanor/cli dev -- --help
```

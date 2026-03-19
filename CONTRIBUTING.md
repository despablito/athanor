# Contributing to Athanor

Thank you for your interest in contributing to Athanor! This document covers everything you need to get started.

## Development Setup

### Prerequisites

- **Node.js** >= 22 (see `.nvmrc`)
- **pnpm** >= 10
- **Docker** (optional — only for PostgreSQL + Apache AGE or the Compose stack; local dev can use embedded SQLite / JSON)

### Getting Started

```bash
# Clone the repo
git clone https://github.com/anthropics/athanor.git
cd athanor

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint
```

### Development Mode

```bash
# Watch mode for all packages
pnpm dev

# Work on a specific package
pnpm --filter @athanor/core dev
pnpm --filter @athanor/cli dev -- <command>
pnpm --filter @athanor/explorer dev
```

### Infrastructure

```bash
# Start PostgreSQL + Ollama
cd docker && docker compose up -d
```

## Project Structure

```
packages/
  athanor-core/        # Core types, Portrait, validation, export
  athanor-extractor/   # LLM extraction pipeline
apps/
  cli/                 # Command-line interface
  clone-api/           # REST API with RAG pipeline
  explorer/            # Next.js web UI
integrations/
  mcp-server/          # Model Context Protocol server
protocol/              # Protocol specification
schema/                # JSON Schema definitions
```

## Code Style

- **TypeScript** everywhere — strict mode, no `any` unless absolutely necessary
- **ESLint** with typescript-eslint recommended + strict
- **Vitest** for all tests
- Keep functions small and focused
- Prefer explicit types over inference for public APIs
- Use `type` imports where possible

Run the linter before committing:

```bash
pnpm lint
```

## How to Add a New Chunk Type

1. **Update the protocol** — Add the type to `protocol/PROTOCOL.md` with a clear definition
2. **Update the schema** — Add the type to the enum in `schema/chunk.schema.json`
3. **Update core types** — Add to `ChunkType` union and `CHUNK_TYPES` array in `packages/athanor-core/src/types.ts`
4. **Assign a semantic layer** — Update the layer mapping in `apps/clone-api/src/rag.ts`
5. **Update extraction prompts** — Add the type to the chunker prompt in `packages/athanor-extractor/src/chunker.ts`
6. **Add tests** — Add test cases for validation and extraction
7. **Update docs** — Add the type to `docs-site/docs/concepts/three-layers.md`

## How to Add a New Relation Type

1. **Update the protocol** — Add the relation to `protocol/PROTOCOL.md`
2. **Update the schema** — Add to the enum in `schema/relation.schema.json`
3. **Update core types** — Add to `RelationType` union and `RELATION_TYPES` array in `packages/athanor-core/src/types.ts`
4. **Update RAG expansion** — Add the relation to the traversal list in `apps/clone-api/src/rag.ts`
5. **Update extraction** — Add detection logic in `packages/athanor-extractor/src/linker.ts`
6. **Add tests**
7. **Update docs** — Add to `docs-site/docs/concepts/relations.md`

## How to Write Extraction Prompts

The extraction pipeline uses structured prompts in:
- `packages/athanor-extractor/src/chunker.ts` — Chunk identification
- `packages/athanor-extractor/src/classifier.ts` — Deduplication
- `packages/athanor-extractor/src/linker.ts` — Relation detection
- `packages/athanor-extractor/src/meta-generator.ts` — Meta-chunk synthesis

Guidelines for prompt changes:
- **Be specific** — List all chunk types and relation types in the prompt
- **Include examples** — Show the expected JSON output format
- **Test with multiple providers** — Prompts should work with Anthropic, OpenAI, and Ollama
- **Preserve confidence calibration** — Don't inflate confidence scores

## PR Process

1. **Fork** the repository
2. **Create a feature branch** from `main`: `git checkout -b my-feature`
3. **Make your changes** — keep commits focused and atomic
4. **Write tests** for new functionality
5. **Run the full suite**: `pnpm build && pnpm test && pnpm lint`
6. **Open a pull request** against `main`
7. **Describe your changes** — what, why, and how to test

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Lint passes (`pnpm lint`)
- [ ] New functionality has tests
- [ ] Protocol/schema changes are reflected in code and docs
- [ ] No breaking changes to public APIs (or clearly documented)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), version 2.1.

## CI, Changesets, and releases

- **CI** (`.github/workflows/ci.yml`) runs on every PR and on pushes to `main`: `pnpm lint`, `pnpm test`, and `pnpm build`, with pnpm store + Turborepo `.turbo` caching.
- **npm releases** (`.github/workflows/publish.yml`) uses [Changesets](https://github.com/changesets/changesets). After you merge a “Version packages” PR, the workflow publishes with `changeset publish` (see `package.json` scripts `changeset`, `version-packages`, `release`).
- **Docs** (`.github/workflows/docs.yml`) builds `docs-site/` and pushes static output to the **`gh-pages`** branch.

**Maintainers:** add an **`NPM_TOKEN`** repository secret (npm automation token with publish access) so releases can publish to the registry. `GITHUB_TOKEN` is supplied automatically for opening version PRs and pushing `gh-pages`.

**Proposing a release:** run `pnpm changeset` locally, commit the generated `.changeset/*.md` file, and open a PR. After merge, the bot opens a version PR; when that merges, packages publish (if `NPM_TOKEN` is set).

For GitHub Pages docs, enable **Settings → Pages → Deploy from a branch** using **`gh-pages`** branch.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

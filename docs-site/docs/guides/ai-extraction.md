---
sidebar_position: 5
---

# AI Extraction

The Athanor Extractor uses LLMs to automatically extract chunks from source material. This guide covers the extraction pipeline, provider configuration, and best practices.

## Provider Setup

The extractor supports three LLM providers:

### Anthropic (Recommended)

```bash
export ANTHROPIC_API_KEY=sk-ant-...

athanor extract source.txt \
  --provider anthropic \
  --model claude-sonnet-4-20250514
```

### OpenAI

```bash
export OPENAI_API_KEY=sk-...

athanor extract source.txt \
  --provider openai \
  --model gpt-4o
```

### Ollama (Local, No API Key)

```bash
# Make sure Ollama is running with a model pulled
ollama pull llama3.2

athanor extract source.txt \
  --provider ollama \
  --model llama3.2
```

## The Extraction Pipeline

### 1. Chunking

The chunker reads raw text and identifies candidate identity fragments. It looks for:
- Decision rationales and heuristics
- Strong opinions and beliefs
- Emotional reactions and patterns
- Behavioral routines
- Contradictions and exceptions

Each candidate gets an initial type, cluster, and confidence score.

### 2. Classification

The classifier compares candidates against the existing portrait:
- **Accepted** — New, distinct information
- **Rejected** — Too generic or not identity-relevant
- **Duplicate** — Already captured by an existing chunk

Deduplication is semantic, not lexical — the classifier understands when two differently-worded chunks express the same underlying trait.

### 3. Relation Detection

After chunks are added, the linker analyzes pairs for meaningful relationships:

```bash
athanor extract source.txt \
  --provider anthropic \
  --detect-relations \
  --portrait ./portrait.json
```

### 4. Meta-Generation

Once you have enough chunks (50+), generate meta-chunks:

```bash
athanor meta-generate \
  --provider anthropic \
  --portrait ./portrait.json
```

### 5. Embedding

Generate vector embeddings for semantic search:

```bash
athanor embed \
  --provider ollama \
  --model nomic-embed-text \
  --portrait ./portrait.json
```

Supported embedding providers:
- **Ollama** — `nomic-embed-text` (768 dimensions, default)
- **OpenAI** — `text-embedding-3-small` (1536 dimensions)

## Programmatic Usage

```typescript
import { Extractor } from '@athanor/extractor';

const extractor = new Extractor({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Extract from text
const result = await extractor.fromTranscript(text, {
  subject: 'Alex Chen',
  source: 'interview',
});

console.log(`Accepted: ${result.accepted.length}`);
console.log(`Rejected: ${result.rejected.length}`);
console.log(`Duplicates: ${result.duplicates.length}`);

// Detect relations
const relations = await extractor.detectRelations(portrait);

// Generate meta-chunks
const metaChunks = await extractor.generateMetaChunks(portrait);

// Generate clone prompt
const systemPrompt = await extractor.generateClonePrompt(portrait);
```

## Best Practices

- **Use high-quality sources** — The extractor can only find what's in the text. Rich, explanatory sources produce better chunks.
- **Process sources iteratively** — Extract one source at a time. The classifier gets better as the portrait grows.
- **Review low-confidence chunks** — Anything below 0.5 confidence should be manually reviewed.
- **Use Anthropic for extraction** — Claude models produce the most nuanced chunk identification.
- **Use Ollama for embeddings** — Saves cost and runs locally with good quality.

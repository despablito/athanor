# @athanor/extractor

LLM-powered extraction pipeline for the Athanor identity cloning toolkit. Extracts structured chunks from source material using Anthropic, OpenAI, or Ollama.

## Usage

```typescript
import { Extractor } from '@athanor/extractor';

const extractor = new Extractor({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Extract chunks from text
const result = await extractor.fromTranscript(text, {
  subject: 'Alex Chen',
  source: 'interview',
});

// Detect relations between chunks
const relations = await extractor.detectRelations(portrait);

// Generate meta-chunks
const metaChunks = await extractor.generateMetaChunks(portrait);

// Generate clone system prompt
const systemPrompt = await extractor.generateClonePrompt(portrait);

// Generate embeddings
const embeddings = await extractor.embedChunks(portrait);
```

## Pipeline Stages

1. **Chunker** — Identifies candidate identity fragments from raw text
2. **Classifier** — Deduplicates and classifies against existing portrait
3. **Linker** — Detects relations between chunks
4. **Meta-Generator** — Synthesizes cross-cutting patterns
5. **Clone-Generator** — Builds system prompts for clones
6. **Embedder** — Generates vector embeddings (Ollama or OpenAI)

## Providers

| Provider | Default Model | API Key |
|---|---|---|
| Anthropic | claude-sonnet-4-20250514 | `ANTHROPIC_API_KEY` |
| OpenAI | gpt-4o | `OPENAI_API_KEY` |
| Ollama | llama3.2 (default; override with `OLLAMA_MODEL` / `--model`) | None (local) |

## License

MIT

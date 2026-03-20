---
sidebar_position: 2
---

# @athanor/extractor API

The extractor provides LLM-powered extraction of chunks from source material.

## Extractor

```typescript
import { Extractor } from '@athanor/extractor';

const extractor = new Extractor({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-20250514', // optional
});
```

### Configuration

```typescript
interface ExtractorConfig {
  provider: 'anthropic' | 'openai' | 'ollama';
  model?: string;
  apiKey?: string;
  baseUrl?: string; // For Ollama (default: http://localhost:11434)
  embeddingProvider?: 'ollama' | 'openai';
  embeddingModel?: string;
}
```

### Default Models

| Provider | Default Model |
|---|---|
| Anthropic | claude-sonnet-4-20250514 |
| OpenAI | gpt-4o |
| Ollama | llama3.2 (or `OLLAMA_MODEL`) |

### Methods

#### `fromTranscript(text, options): Promise<ExtractionResult>`

Extract chunks from a transcript or conversation.

```typescript
const result = await extractor.fromTranscript(interviewText, {
  subject: 'Alex Chen',
  source: 'interview',
  portrait: existingPortrait, // optional — for deduplication
});

console.log(result.chunks);     // ChunkCandidate[] — all extracted
console.log(result.classified); // ClassifiedChunk[] — with duplicate info
console.log(result.accepted);   // ChunkCandidate[] — new, accepted chunks
console.log(result.rejected);   // ChunkCandidate[] — too generic
console.log(result.duplicates); // ChunkCandidate[] — already in portrait
```

#### `fromDocuments(texts, options): Promise<ExtractionResult>`

Extract chunks from multiple documents.

```typescript
const result = await extractor.fromDocuments(
  [blogPost, email, meetingNotes],
  { subject: 'Alex Chen' }
);
```

#### `detectRelations(portrait): Promise<RelationCandidate[]>`

Analyze a portrait and propose relations between chunks.

```typescript
const relations = await extractor.detectRelations(portrait);
// [{ source: 'TDM-HEUR-001', target: 'TDM-STOR-005', type: 'LEARNED_FROM', description: '...' }]
```

#### `generateMetaChunks(portrait): Promise<ChunkCandidate[]>`

Generate meta-chunks that capture cross-cutting patterns.

```typescript
const metaChunks = await extractor.generateMetaChunks(portrait);
```

#### `generateClonePrompt(portrait): Promise<string>`

Synthesize a system prompt for a Clone based on the portrait.

```typescript
const systemPrompt = await extractor.generateClonePrompt(portrait);
```

#### `embedChunks(portrait, onProgress?): Promise<EmbeddedChunk[]>`

Generate vector embeddings for all chunks.

```typescript
const embeddings = await extractor.embedChunks(portrait, (progress) => {
  console.log(`${progress.current}/${progress.total}`);
});

// [{ chunkId: 'TDM-HEUR-001', embedding: Float64Array }]
```

### Types

```typescript
interface ChunkCandidate {
  cluster: string;
  type: ChunkType;
  uniqueness: Uniqueness;
  source: SourceType;
  confidence: number;
  context_tags: string[];
  content: string;
}

interface ClassifiedChunk extends ChunkCandidate {
  isDuplicate: boolean;
  duplicateOf?: ChunkId;
  isGeneric: boolean;
}

interface RelationCandidate {
  source: ChunkId;
  target: ChunkId;
  type: RelationType;
  description: string;
}

interface EmbeddedChunk {
  chunkId: ChunkId;
  embedding: number[];
}

interface ExtractionResult {
  chunks: ChunkCandidate[];
  classified: ClassifiedChunk[];
  accepted: ChunkCandidate[];
  rejected: ChunkCandidate[];
  duplicates: ChunkCandidate[];
}
```

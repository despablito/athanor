---
sidebar_position: 1
---

# @athanor/core API

The core library provides types, the Portrait class, GraphStore, validation, and export functions.

## Portrait

The main class for creating and manipulating identity portraits.

```typescript
import { Portrait } from '@athanor/core';

const portrait = new Portrait({
  name: 'Alex Chen',
  id: 'alex-chen',
});
```

### Methods

#### `addChunk(input: ChunkInput): Chunk`

Add a chunk to the portrait. The chunk ID is auto-generated from the cluster and type.

```typescript
const chunk = portrait.addChunk({
  author: 'observer@example.com',
  cluster: 'technical-decision-making',
  type: 'heuristic',
  uniqueness: 'CRITICAL',
  source: 'interview',
  confidence: 0.92,
  context_tags: ['architecture'],
  content: 'Always start with a monolith unless you have 50+ engineers.',
});
// chunk.chunk_id === 'TDM-HEUR-001'
```

#### `addRelation(input: RelationInput): Relation`

Create a directed edge between two chunks.

```typescript
portrait.addRelation({
  source: 'TDM-HEUR-001',
  target: 'TDM-STOR-005',
  type: 'LEARNED_FROM',
  description: 'Heuristic learned from migration incident',
});
```

#### `removeChunk(chunkId: ChunkId): void`

Remove a chunk and its associated relations.

#### `getChunk(chunkId: ChunkId): Chunk | undefined`

Retrieve a single chunk by ID.

#### `getChunksByCluster(cluster: string): Chunk[]`

Get all chunks in a cluster.

#### `getChunksByType(type: ChunkType): Chunk[]`

Get all chunks of a specific type.

#### `getRelatedChunks(chunkId: ChunkId, depth?: number): Chunk[]`

Graph traversal — get chunks connected to the given chunk, up to the specified depth (default 1).

#### `stats(): PortraitStats`

Compute portrait statistics:

```typescript
interface PortraitStats {
  chunkCount: number;
  relationCount: number;
  clusters: string[];
  typeDistribution: Record<string, number>;
  completenessScore: number;
  criticalRatio: number;
  averageConfidence: number;
}
```

#### `validate(): ValidationResult`

Validate the portrait against the Athanor Protocol.

#### `toJSON(): PortraitJSON`

Serialize the portrait to JSON.

## GraphStore

PostgreSQL + Apache AGE integration for persistent graph storage.

```typescript
import { GraphStore } from '@athanor/core';

const store = new GraphStore({
  connectionString: 'postgresql://user:pass@localhost:5432/athanor',
});

await store.connect();
await store.importPortrait(portrait);

// Cypher queries
const result = await store.query(
  "MATCH (c:Chunk {type: 'heuristic'}) RETURN c"
);

// Graph traversal
const neighbors = await store.getNeighbors('TDM-HEUR-001', 2, ['INSTANTIATES']);

const exported = await store.exportPortrait('alex-chen');
```

## Validation

```typescript
import { validateChunk, validateRelation, validatePortrait } from '@athanor/core';

const chunkResult = validateChunk(chunk);
// { valid: boolean, errors: string[], warnings: string[] }

const portraitResult = validatePortrait(portraitJSON);
// Checks: CRITICAL ratio, orphan chunks, cluster coverage, etc.
```

## Export Functions

```typescript
import { toJSON, toCypher, toMarkdown, toObsidian } from '@athanor/core';

// JSON serialization
const json = toJSON(portrait);

// Cypher CREATE statements
const cypher = toCypher(portrait);

// Markdown document grouped by cluster
const markdown = toMarkdown(portrait);

// Map of Obsidian-compatible files (one per chunk)
const vault = toObsidian(portrait);
// Record<string, string> — filename → content
```

## Types

```typescript
type ChunkType =
  | 'heuristic' | 'anti-pattern' | 'preference' | 'belief'
  | 'fact' | 'skill' | 'emotion' | 'story'
  | 'contradiction' | 'style' | 'framework' | 'rant'
  | 'meta' | 'ritual';

type RelationType =
  | 'INSTANTIATES' | 'ENABLES' | 'LEARNED_FROM'
  | 'CONTRASTS_WITH' | 'HARDCODED_EXCEPTION' | 'EXPRESSED_THROUGH';

type Uniqueness = 'CRITICAL' | 'HIGH' | 'MEDIUM';

type SourceType =
  | 'interview' | 'email' | 'document' | 'code'
  | 'meeting' | 'chat' | 'social' | 'observation' | 'inferred';
```

## Constants

```typescript
import {
  CHUNK_TYPES,          // string[]
  RELATION_TYPES,       // string[]
  UNIQUENESS_LEVELS,    // string[]
  SOURCE_TYPES,         // string[]
  RECOMMENDED_CLUSTERS, // string[]
} from '@athanor/core';
```

# @athanor/core

Core library for the Athanor identity cloning toolkit. Provides types, the Portrait class, GraphStore (PostgreSQL + Apache AGE), validation, and export functions.

## Usage

```typescript
import { Portrait, validatePortrait, toMarkdown } from '@athanor/core';

// Create a portrait
const portrait = new Portrait({ name: 'Alex Chen', id: 'alex-chen' });

// Add chunks
portrait.addChunk({
  author: 'observer',
  cluster: 'technical-decision-making',
  type: 'heuristic',
  uniqueness: 'CRITICAL',
  source: 'interview',
  confidence: 0.92,
  context_tags: ['architecture'],
  content: 'Always start with the simplest architecture that could work.',
});

// Add relations
portrait.addRelation({
  source: 'TDM-HEUR-001',
  target: 'TDM-STOR-005',
  type: 'LEARNED_FROM',
});

// Validate
const result = portrait.validate();

// Export
const markdown = toMarkdown(portrait);
```

## Exports

- **Classes**: `Portrait`, `GraphStore`
- **Functions**: `validateChunk`, `validateRelation`, `validatePortrait`, `toJSON`, `toCypher`, `toMarkdown`, `toObsidian`, `asChunkId`
- **Types**: `Chunk`, `Relation`, `PortraitJSON`, `ChunkType`, `RelationType`, `Uniqueness`, `SourceType`, `ValidationResult`, `PortraitStats`
- **Constants**: `CHUNK_TYPES`, `RELATION_TYPES`, `UNIQUENESS_LEVELS`, `SOURCE_TYPES`, `RECOMMENDED_CLUSTERS`

## License

MIT

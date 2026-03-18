import type { ChunkType, Uniqueness, SourceType, RelationType } from "@athanor/core";

export interface ChunkCandidate {
  cluster: string;
  type: ChunkType;
  uniqueness: Uniqueness;
  source: SourceType;
  confidence: number;
  context_tags: string[];
  content: string;
}

export interface ClassifiedChunk extends ChunkCandidate {
  duplicate: boolean;
  duplicate_of: string | null;
  notes: string;
}

export interface RelationCandidate {
  source: string;
  target: string;
  type: RelationType;
  description: string;
}

export interface EmbeddedChunk {
  chunk_id: string;
  content: string;
  embedding: number[];
}

export interface ExtractionResult {
  chunks: ChunkCandidate[];
  classified: ClassifiedChunk[];
  accepted: ChunkCandidate[];
  rejected: ChunkCandidate[];
  duplicates: ChunkCandidate[];
}

export interface ExtractorConfig {
  provider: "anthropic" | "openai" | "ollama";
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  embeddingProvider?: "ollama" | "openai";
  embeddingModel?: string;
}

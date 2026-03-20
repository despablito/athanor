import type { PortraitJSON } from "@athanor/core";
import {
  createProvider,
  createEmbeddingProvider,
  type LLMProvider,
  type EmbeddingProvider,
} from "./provider.js";
import { extractChunks, type ChunkerOptions } from "./chunker.js";
import { classifyChunks } from "./classifier.js";
import { detectRelations } from "./linker.js";
import { generateMetaChunks } from "./meta-generator.js";
import { generateClonePrompt } from "./clone-generator.js";
import { embedChunks, type EmbedProgress } from "./embedder.js";
import type {
  ExtractorConfig,
  ChunkCandidate,
  RelationCandidate,
  EmbeddedChunk,
  ExtractionResult,
} from "./types.js";

export class Extractor {
  private provider: LLMProvider;
  private embeddingProvider: EmbeddingProvider | null;

  constructor(config: ExtractorConfig) {
    this.provider = createProvider({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    });

    if (config.embeddingProvider) {
      this.embeddingProvider = createEmbeddingProvider({
        provider: config.embeddingProvider,
        model: config.embeddingModel,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });
    } else {
      this.embeddingProvider = null;
    }
  }

  async fromTranscript(
    text: string,
    options: ChunkerOptions & { portrait?: PortraitJSON } = {},
  ): Promise<ExtractionResult> {
    const portrait = options.portrait ?? emptyPortrait();

    // Step 1: Extract raw chunks
    const chunks = await extractChunks(this.provider, text, options);

    // Step 2: Classify and deduplicate
    const classified = await classifyChunks(this.provider, chunks, portrait);

    // Step 3: Separate accepted vs rejected
    const accepted = classified.filter((c) => !c.duplicate);
    const rejected = classified.filter((c) => c.duplicate);

    return { chunks, classified, accepted, rejected, duplicates: rejected };
  }

  async fromDocuments(
    texts: string[],
    options: ChunkerOptions & { portrait?: PortraitJSON } = {},
  ): Promise<ExtractionResult> {
    const allChunks: ChunkCandidate[] = [];
    const portrait = options.portrait ?? emptyPortrait();

    for (const text of texts) {
      const chunks = await extractChunks(this.provider, text, {
        ...options,
        source: options.source ?? "document",
      });
      allChunks.push(...chunks);
    }

    const classified = await classifyChunks(this.provider, allChunks, portrait);
    const accepted = classified.filter((c) => !c.duplicate);
    const rejected = classified.filter((c) => c.duplicate);

    return { chunks: allChunks, classified, accepted, rejected, duplicates: rejected };
  }

  async detectRelations(portrait: PortraitJSON): Promise<RelationCandidate[]> {
    return detectRelations(this.provider, portrait);
  }

  async generateMetaChunks(portrait: PortraitJSON): Promise<ChunkCandidate[]> {
    return generateMetaChunks(this.provider, portrait);
  }

  async generateClonePrompt(portrait: PortraitJSON): Promise<string> {
    return generateClonePrompt(this.provider, portrait);
  }

  async embedChunks(
    portrait: PortraitJSON,
    onProgress?: (progress: EmbedProgress) => void,
  ): Promise<EmbeddedChunk[]> {
    const provider = this.embeddingProvider;
    if (!provider) {
      throw new Error(
        "No embedding provider configured. Pass embeddingProvider in ExtractorConfig.",
      );
    }
    return embedChunks(provider, portrait, onProgress);
  }
}

function emptyPortrait(): PortraitJSON {
  return {
    version: "1.0.0-draft",
    subject: { name: "", id: "" },
    created_at: new Date().toISOString(),
    chunks: [],
    relations: [],
    metadata: {
      completeness_score: 0,
      chunk_count: 0,
      relation_count: 0,
      cluster_coverage: {},
    },
  };
}

// Re-export all public types and utilities
export type {
  LLMProvider,
  EmbeddingProvider,
  ProviderConfig,
  EmbeddingConfig,
} from "./provider.js";
export {
  createProvider,
  createEmbeddingProvider,
  AnthropicProvider,
  OpenAIProvider,
  OllamaProvider,
  OllamaEmbeddingProvider,
  OpenAIEmbeddingProvider,
  warmupOllamaChat,
  DEFAULT_OLLAMA_CHAT_MODEL,
  DEFAULT_OLLAMA_EMBEDDING_MODEL,
} from "./provider.js";
export type {
  ChunkCandidate,
  ClassifiedChunk,
  RelationCandidate,
  EmbeddedChunk,
  ExtractionResult,
  ExtractorConfig,
} from "./types.js";
export type { ChunkerOptions } from "./chunker.js";
export { extractChunks, normalizeChunkSource } from "./chunker.js";
export { classifyChunks } from "./classifier.js";
export { detectRelations } from "./linker.js";
export { generateMetaChunks } from "./meta-generator.js";
export {
  generateSecondOrderConsequences,
} from "./second-order.js";
export type { SecondOrderAnalysis, SecondOrderResult } from "./second-order.js";
export { generateClonePrompt } from "./clone-generator.js";
export { embedChunks } from "./embedder.js";
export type { EmbedProgress } from "./embedder.js";

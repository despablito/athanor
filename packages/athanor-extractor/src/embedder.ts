import type { PortraitJSON } from "@athanor/core";
import type { EmbeddingProvider } from "./provider.js";
import type { EmbeddedChunk } from "./types.js";

const BATCH_SIZE = 32;

export interface EmbedProgress {
  current: number;
  total: number;
  chunkId: string;
}

export async function embedChunks(
  provider: EmbeddingProvider,
  portrait: PortraitJSON,
  onProgress?: (progress: EmbedProgress) => void,
): Promise<EmbeddedChunk[]> {
  const chunks = portrait.chunks;
  const results: EmbeddedChunk[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.content);

    const embeddings = await provider.embed(texts);

    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      results.push({
        chunk_id: chunk.chunk_id as string,
        content: chunk.content,
        embedding: embeddings[j],
      });

      if (onProgress) {
        onProgress({
          current: i + j + 1,
          total: chunks.length,
          chunkId: chunk.chunk_id as string,
        });
      }
    }
  }

  return results;
}

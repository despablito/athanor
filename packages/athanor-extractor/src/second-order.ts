import type { Chunk, Portrait } from "@athanor/core";
import type { LLMProvider } from "./provider.js";
import { loadPrompt } from "./prompts.js";

export interface SecondOrderResult {
  sourceChunkId: string;
  consequence: string; // 2-4 sentences
  confidence: number; // 0.0–1.0
  reasoning: string; // why non-obvious
  suggestedChunk: Partial<Chunk>;
  suggestedRelation: {
    type: "ENABLES"; // always ENABLES: meta → consequence
    weight: number; // equals confidence
  };
}

export interface SecondOrderAnalysis {
  results: SecondOrderResult[];
  skipped: number;
  totalMetaChunks: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function buildUserContent(sourceChunk: Chunk, relatedChunks: Chunk[]): string {
  // Keep it machine-readable so we can reliably parse LLM JSON responses.
  return JSON.stringify(
    {
      meta_chunk: {
        chunk_id: sourceChunk.chunk_id,
        cluster: sourceChunk.cluster,
        type: sourceChunk.type,
        uniqueness: sourceChunk.uniqueness,
        confidence: sourceChunk.confidence,
        context_tags: sourceChunk.context_tags,
        content: sourceChunk.content,
      },
      related_chunks: relatedChunks.map((c) => ({
        chunk_id: c.chunk_id,
        cluster: c.cluster,
        type: c.type,
        uniqueness: c.uniqueness,
        confidence: c.confidence,
        context_tags: c.context_tags,
        content: c.content,
      })),
    },
    null,
    2,
  );
}

export async function generateSecondOrderConsequences(
  portrait: Portrait,
  provider: LLMProvider,
  options?: { confidenceThreshold?: number },
): Promise<SecondOrderAnalysis> {
  const confidenceThreshold = options?.confidenceThreshold ?? 0.75;

  const systemPrompt = await loadPrompt("second-order");
  const portraitJSON = portrait.toJSON();
  const metaChunks = portraitJSON.chunks.filter((c) => c.type === "meta");

  const results: SecondOrderResult[] = [];
  let skipped = 0;

  for (let i = 0; i < metaChunks.length; i++) {
    const sourceChunk = metaChunks[i];
    const relatedChunks = portrait.getRelatedChunks(sourceChunk.chunk_id, 1);

    const userContent = buildUserContent(sourceChunk, relatedChunks);
    const response = await provider.complete(systemPrompt, userContent);

    let parsed: { consequence: string | null; confidence: number; reasoning: string };
    try {
      parsed = JSON.parse(response) as {
        consequence: string | null;
        confidence: number;
        reasoning: string;
      };
    } catch {
      skipped++;
      if (i < metaChunks.length - 1) await sleep(1000);
      continue;
    }

    if (parsed.consequence === null || parsed.confidence < confidenceThreshold) {
      skipped++;
      if (i < metaChunks.length - 1) await sleep(1000);
      continue;
    }

    const confidence = parsed.confidence;
    results.push({
      sourceChunkId: sourceChunk.chunk_id,
      consequence: parsed.consequence,
      confidence,
      reasoning: parsed.reasoning,
      suggestedChunk: {
        cluster: sourceChunk.cluster,
        type: "meta",
        uniqueness: confidence > 0.9 ? "HIGH" : "MEDIUM",
        source: "second_order_analysis",
        confidence,
        content: parsed.consequence,
        context_tags: ["second_order", "consequence"],
        linked_chunks: [sourceChunk.chunk_id],
      },
      suggestedRelation: {
        type: "ENABLES",
        weight: confidence,
      },
    });

    if (i < metaChunks.length - 1) await sleep(1000);
  }

  return { results, skipped, totalMetaChunks: metaChunks.length };
}


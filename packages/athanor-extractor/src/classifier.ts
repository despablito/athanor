import type { PortraitJSON } from "@athanor/core";
import type { LLMProvider } from "./provider.js";
import type { ChunkCandidate, ClassifiedChunk } from "./types.js";
import { loadPrompt } from "./prompts.js";

export async function classifyChunks(
  provider: LLMProvider,
  candidates: ChunkCandidate[],
  portrait: PortraitJSON,
): Promise<ClassifiedChunk[]> {
  if (candidates.length === 0) return [];

  const systemPrompt = await loadPrompt("classification");

  const existingContext = buildPortraitContext(portrait);
  const candidateJSON = JSON.stringify(candidates, null, 2);

  const userPrompt = [
    "## Existing Portrait Context",
    existingContext,
    "",
    "## Candidate Chunks to Classify",
    candidateJSON,
  ].join("\n");

  const response = await provider.complete(systemPrompt, userPrompt);
  const classifications = parseClassificationResponse(response);

  return mergeClassifications(candidates, classifications);
}

function buildPortraitContext(portrait: PortraitJSON): string {
  if (portrait.chunks.length === 0) {
    return "Portrait is empty — no existing chunks.";
  }

  const lines: string[] = [];
  lines.push(`Subject: ${portrait.subject.name} (${portrait.subject.id})`);
  lines.push(`Existing chunks: ${portrait.chunks.length}`);
  lines.push(`Existing relations: ${portrait.relations.length}`);
  lines.push("");
  lines.push("Existing clusters and chunk counts:");

  const clusters = portrait.metadata.cluster_coverage;
  for (const [cluster, count] of Object.entries(clusters)) {
    lines.push(`  - ${cluster}: ${count} chunks`);
  }

  lines.push("");
  lines.push("Sample existing chunks (first 2 per cluster):");

  const byCluster = new Map<string, typeof portrait.chunks>();
  for (const chunk of portrait.chunks) {
    if (!byCluster.has(chunk.cluster)) byCluster.set(chunk.cluster, []);
    byCluster.get(chunk.cluster)!.push(chunk);
  }

  for (const [, chunks] of byCluster) {
    for (const chunk of chunks.slice(0, 2)) {
      lines.push(`  [${chunk.chunk_id}] ${chunk.type}/${chunk.uniqueness}: ${chunk.content.slice(0, 120)}...`);
    }
  }

  return lines.join("\n");
}

interface RawClassification {
  index: number;
  cluster: string;
  type: string;
  uniqueness: string;
  confidence: number;
  duplicate: boolean;
  duplicate_of: string | null;
  notes: string;
}

function parseClassificationResponse(response: string): RawClassification[] {
  let cleaned = response.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart === -1 || arrayEnd === -1) return [];

  try {
    const parsed = JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1));
    if (!Array.isArray(parsed)) return [];
    return parsed as RawClassification[];
  } catch {
    return [];
  }
}

function mergeClassifications(
  candidates: ChunkCandidate[],
  classifications: RawClassification[],
): ClassifiedChunk[] {
  return candidates.map((candidate, index) => {
    const classification = classifications.find((c) => c.index === index);
    if (classification) {
      return {
        ...candidate,
        cluster: classification.cluster || candidate.cluster,
        type: (classification.type as ChunkCandidate["type"]) || candidate.type,
        uniqueness: (classification.uniqueness as ChunkCandidate["uniqueness"]) || candidate.uniqueness,
        confidence: classification.confidence ?? candidate.confidence,
        duplicate: classification.duplicate ?? false,
        duplicate_of: classification.duplicate_of ?? null,
        notes: classification.notes ?? "",
      };
    }
    return {
      ...candidate,
      duplicate: false,
      duplicate_of: null,
      notes: "No classification returned — keeping original values.",
    };
  });
}

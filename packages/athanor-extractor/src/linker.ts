import type { PortraitJSON } from "@athanor/core";
import type { LLMProvider } from "./provider.js";
import type { RelationCandidate } from "./types.js";
import { RELATION_TYPES } from "@athanor/core";
import { loadPrompt } from "./prompts.js";

const BATCH_SIZE = 30;

export async function detectRelations(
  provider: LLMProvider,
  portrait: PortraitJSON,
): Promise<RelationCandidate[]> {
  if (portrait.chunks.length < 2) return [];

  const systemPrompt = await loadPrompt("linking");

  // For large portraits, process in batches grouped by cluster proximity
  const batches = buildChunkBatches(portrait);
  const allCandidates: RelationCandidate[] = [];

  for (const batch of batches) {
    const userPrompt = buildLinkingPrompt(batch, portrait);
    const response = await provider.complete(systemPrompt, userPrompt);
    const candidates = parseLinkingResponse(response);
    allCandidates.push(...candidates.filter((c) => validateRelationCandidate(c, portrait)));
  }

  return deduplicateRelations(allCandidates, portrait.relations);
}

function buildChunkBatches(portrait: PortraitJSON): PortraitJSON["chunks"][] {
  const chunks = portrait.chunks;
  if (chunks.length <= BATCH_SIZE) return [chunks];

  // Group by cluster, then create batches that include cross-cluster pairs
  const byCluster = new Map<string, typeof chunks>();
  for (const chunk of chunks) {
    if (!byCluster.has(chunk.cluster)) byCluster.set(chunk.cluster, []);
    byCluster.get(chunk.cluster)!.push(chunk);
  }

  const batches: typeof chunks[] = [];
  const clusters = [...byCluster.entries()];

  // Intra-cluster batches
  for (const [, clusterChunks] of clusters) {
    for (let i = 0; i < clusterChunks.length; i += BATCH_SIZE) {
      batches.push(clusterChunks.slice(i, i + BATCH_SIZE));
    }
  }

  // Cross-cluster batches: sample 2 chunks from each cluster pair
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const sample = [
        ...clusters[i][1].slice(0, 3),
        ...clusters[j][1].slice(0, 3),
      ];
      if (sample.length >= 2) {
        batches.push(sample);
      }
    }
  }

  return batches;
}

function buildLinkingPrompt(
  chunks: PortraitJSON["chunks"],
  portrait: PortraitJSON,
): string {
  const lines: string[] = [];
  lines.push(`Subject: ${portrait.subject.name}`);
  lines.push("");
  lines.push("## Chunks to analyze for relations:");
  lines.push("");

  for (const chunk of chunks) {
    lines.push(`### ${chunk.chunk_id} [${chunk.cluster}/${chunk.type}]`);
    lines.push(chunk.content);
    lines.push("");
  }

  return lines.join("\n");
}

function parseLinkingResponse(response: string): RelationCandidate[] {
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
    return parsed as RelationCandidate[];
  } catch {
    return [];
  }
}

function validateRelationCandidate(
  candidate: RelationCandidate,
  portrait: PortraitJSON,
): boolean {
  if (!candidate.source || !candidate.target || !candidate.type) return false;
  if (candidate.source === candidate.target) return false;
  if (!RELATION_TYPES.includes(candidate.type as typeof RELATION_TYPES[number])) return false;

  // Verify chunks exist
  const chunkIds = new Set(portrait.chunks.map((c) => c.chunk_id as string));
  if (!chunkIds.has(candidate.source) || !chunkIds.has(candidate.target)) return false;

  return true;
}

function deduplicateRelations(
  candidates: RelationCandidate[],
  existing: PortraitJSON["relations"],
): RelationCandidate[] {
  const existingKeys = new Set(
    existing.map((r) => `${r.source}→${r.target}→${r.type}`),
  );

  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = `${c.source}→${c.target}→${c.type}`;
    if (existingKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

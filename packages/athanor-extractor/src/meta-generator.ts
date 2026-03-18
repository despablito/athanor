import type { PortraitJSON } from "@athanor/core";
import type { LLMProvider } from "./provider.js";
import type { ChunkCandidate } from "./types.js";
import { loadPrompt } from "./prompts.js";

export async function generateMetaChunks(
  provider: LLMProvider,
  portrait: PortraitJSON,
): Promise<ChunkCandidate[]> {
  if (portrait.chunks.length < 5) return [];

  const systemPrompt = await loadPrompt("meta-analysis");
  const analysis = buildAnalysisPrompt(portrait);
  const response = await provider.complete(systemPrompt, analysis);

  return parseMetaResponse(response);
}

function buildAnalysisPrompt(portrait: PortraitJSON): string {
  const lines: string[] = [];

  lines.push(`Subject: ${portrait.subject.name}`);
  lines.push(`Total chunks: ${portrait.chunks.length}, relations: ${portrait.relations.length}`);
  lines.push("");

  // High-degree nodes
  const connectionCount = new Map<string, number>();
  for (const chunk of portrait.chunks) {
    connectionCount.set(chunk.chunk_id as string, 0);
  }
  for (const rel of portrait.relations) {
    connectionCount.set(rel.source as string, (connectionCount.get(rel.source as string) ?? 0) + 1);
    connectionCount.set(rel.target as string, (connectionCount.get(rel.target as string) ?? 0) + 1);
  }

  const topNodes = [...connectionCount.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  lines.push("## High-Degree Nodes (most connected chunks)");
  const chunkMap = new Map(portrait.chunks.map((c) => [c.chunk_id as string, c]));
  for (const [id, count] of topNodes) {
    const chunk = chunkMap.get(id);
    if (chunk) {
      lines.push(`- ${id} (${count} connections, ${chunk.cluster}/${chunk.type}): ${chunk.content.slice(0, 100)}...`);
    }
  }
  lines.push("");

  // Cross-cluster tags
  const tagClusters = new Map<string, Set<string>>();
  for (const chunk of portrait.chunks) {
    for (const tag of chunk.context_tags) {
      if (!tagClusters.has(tag)) tagClusters.set(tag, new Set());
      tagClusters.get(tag)!.add(chunk.cluster);
    }
  }

  const crossClusterTags = [...tagClusters.entries()]
    .filter(([, clusters]) => clusters.size > 1)
    .sort(([, a], [, b]) => b.size - a.size);

  lines.push("## Cross-Cluster Tags");
  for (const [tag, clusters] of crossClusterTags.slice(0, 15)) {
    lines.push(`- "${tag}" appears in: ${[...clusters].join(", ")}`);
  }
  lines.push("");

  // Tension pairs
  const tensions = portrait.relations.filter((r) => r.type === "CONTRASTS_WITH");
  lines.push("## Tension Pairs (CONTRASTS_WITH)");
  if (tensions.length === 0) {
    lines.push("- No tensions found.");
  } else {
    for (const t of tensions) {
      const src = chunkMap.get(t.source as string);
      const tgt = chunkMap.get(t.target as string);
      lines.push(`- ${t.source} ↔ ${t.target}: ${t.description ?? ""}`);
      if (src) lines.push(`  Source: ${src.content.slice(0, 80)}...`);
      if (tgt) lines.push(`  Target: ${tgt.content.slice(0, 80)}...`);
    }
  }
  lines.push("");

  // Learning chains
  const learned = portrait.relations.filter((r) => r.type === "LEARNED_FROM");
  lines.push("## Learning Chains (LEARNED_FROM)");
  if (learned.length === 0) {
    lines.push("- No learning chains found.");
  } else {
    for (const l of learned.slice(0, 10)) {
      lines.push(`- ${l.source} learned from ${l.target}: ${l.description ?? ""}`);
    }
  }
  lines.push("");

  // Cluster summaries
  lines.push("## Cluster Summaries");
  const byCluster = new Map<string, typeof portrait.chunks>();
  for (const chunk of portrait.chunks) {
    if (!byCluster.has(chunk.cluster)) byCluster.set(chunk.cluster, []);
    byCluster.get(chunk.cluster)!.push(chunk);
  }

  for (const [cluster, chunks] of byCluster) {
    lines.push(`### ${cluster} (${chunks.length} chunks)`);
    const types = new Map<string, number>();
    for (const c of chunks) {
      types.set(c.type, (types.get(c.type) ?? 0) + 1);
    }
    lines.push(`Types: ${[...types.entries()].map(([t, n]) => `${t}(${n})`).join(", ")}`);
    // Show first chunk as sample
    if (chunks[0]) {
      lines.push(`Sample: ${chunks[0].content.slice(0, 120)}...`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function parseMetaResponse(response: string): ChunkCandidate[] {
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

    // Validate and enforce meta-chunk constraints
    return (parsed as ChunkCandidate[]).filter((c) => {
      if (!c.content || c.content.length < 20) return false;
      c.cluster = "meta-patterns";
      c.type = "meta";
      c.source = "inferred";
      if (c.uniqueness !== "CRITICAL" && c.uniqueness !== "HIGH") {
        c.uniqueness = "HIGH";
      }
      if (typeof c.confidence !== "number" || c.confidence < 0 || c.confidence > 1) {
        c.confidence = 0.7;
      }
      if (!Array.isArray(c.context_tags)) {
        c.context_tags = [];
      }
      return true;
    });
  } catch {
    return [];
  }
}

import type { Chunk, Relation, PortraitJSON } from "@athanor/core";
import type { PortraitStore } from "./portrait-store.js";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ScoredChunk {
  chunk: Chunk;
  relevance: number;
  uniquenessWeight: number;
  relationBonus: number;
  layerBonus: number;
  finalScore: number;
  hopDistance: number;
}

export interface RetrievalResult {
  chunks: ScoredChunk[];
  totalRetrieved: number;
  totalUsed: number;
}

export interface RAGConfig {
  topK: number;
  topN: number;
  contextBudgetTokens: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const UNIQUENESS_WEIGHT: Record<string, number> = {
  CRITICAL: 1.5,
  HIGH: 1.2,
  MEDIUM: 1.0,
};

const RELATION_PATH_BONUS: Record<number, number> = {
  0: 1.0,  // direct vector hit
  1: 1.3,  // directly related
  2: 1.1,  // 2-hop neighbor
};

/** Relation types to follow during graph expansion */
const EXPANSION_RELATION_TYPES = new Set([
  "INSTANTIATES",
  "LEARNED_FROM",
  "EXPRESSED_THROUGH",
  "CONTRASTS_WITH",
]);

/** Chunk type → semantic layer classification */
const LAYER_MAP: Record<string, string> = {
  heuristic: "knowledge",
  "anti-pattern": "knowledge",
  preference: "knowledge",
  belief: "identity",
  fact: "context",
  skill: "context",
  emotion: "identity",
  story: "context",
  contradiction: "identity",
  style: "identity",
  framework: "knowledge",
  rant: "identity",
  meta: "knowledge",
  ritual: "identity",
};

// ─── Step 1: Vector Search (in-memory fallback) ────────────────────────────────

export function vectorSearch(
  store: PortraitStore,
  portraitId: string,
  query: string,
  topK: number,
): Map<string, { chunk: Chunk; score: number }> {
  const results = store.searchChunks(portraitId, query, topK);
  const map = new Map<string, { chunk: Chunk; score: number }>();
  for (const r of results) {
    map.set(r.chunk.chunk_id as string, { chunk: r.chunk, score: r.score });
  }
  return map;
}

// ─── Step 2: Graph Expansion ───────────────────────────────────────────────────

export function graphExpand(
  portrait: PortraitJSON,
  seedChunkIds: Set<string>,
  maxHops: number = 2,
): Map<string, { chunk: Chunk; hopDistance: number }> {
  const chunkMap = new Map<string, Chunk>();
  for (const c of portrait.chunks) {
    chunkMap.set(c.chunk_id as string, c);
  }

  // Build adjacency from relations matching our expansion types
  const adjacency = new Map<string, Array<{ target: string; type: string }>>();
  for (const rel of portrait.relations) {
    if (!EXPANSION_RELATION_TYPES.has(rel.type)) continue;
    const src = rel.source as string;
    const tgt = rel.target as string;
    if (!adjacency.has(src)) adjacency.set(src, []);
    if (!adjacency.has(tgt)) adjacency.set(tgt, []);
    adjacency.get(src)!.push({ target: tgt, type: rel.type });
    adjacency.get(tgt)!.push({ target: src, type: rel.type });
  }

  // BFS from seed nodes
  const visited = new Map<string, number>(); // chunk_id → hop distance
  const queue: Array<{ id: string; hops: number }> = [];

  for (const id of seedChunkIds) {
    visited.set(id, 0);
    queue.push({ id, hops: 0 });
  }

  while (queue.length > 0) {
    const { id, hops } = queue.shift()!;
    if (hops >= maxHops) continue;

    const neighbors = adjacency.get(id) ?? [];
    for (const { target } of neighbors) {
      if (!visited.has(target)) {
        visited.set(target, hops + 1);
        queue.push({ id: target, hops: hops + 1 });
      }
    }
  }

  const result = new Map<string, { chunk: Chunk; hopDistance: number }>();
  for (const [id, hopDistance] of visited) {
    const chunk = chunkMap.get(id);
    if (chunk) {
      result.set(id, { chunk, hopDistance });
    }
  }

  return result;
}

// ─── Step 3: Relation-aware Reranking ──────────────────────────────────────────

export function rerank(
  vectorHits: Map<string, { chunk: Chunk; score: number }>,
  graphExpanded: Map<string, { chunk: Chunk; hopDistance: number }>,
  topN: number,
): ScoredChunk[] {
  const allChunks = new Map<string, ScoredChunk>();

  // Merge vector hits and graph expanded results
  for (const [id, { chunk, hopDistance }] of graphExpanded) {
    const vectorHit = vectorHits.get(id);
    const relevance = vectorHit?.score ?? 0.3; // graph-only hits get baseline relevance
    const uniquenessWeight = UNIQUENESS_WEIGHT[chunk.uniqueness] ?? 1.0;
    const relationBonus = RELATION_PATH_BONUS[hopDistance] ?? 1.0;

    allChunks.set(id, {
      chunk,
      relevance,
      uniquenessWeight,
      relationBonus,
      layerBonus: 1.0, // computed below
      finalScore: 0,
      hopDistance,
    });
  }

  // Also include vector hits that weren't in graph expansion
  for (const [id, { chunk, score }] of vectorHits) {
    if (!allChunks.has(id)) {
      allChunks.set(id, {
        chunk,
        relevance: score,
        uniquenessWeight: UNIQUENESS_WEIGHT[chunk.uniqueness] ?? 1.0,
        relationBonus: 1.0,
        layerBonus: 1.0,
        finalScore: 0,
        hopDistance: 0,
      });
    }
  }

  // Compute layer coverage bonus
  const layers = new Set<string>();
  for (const sc of allChunks.values()) {
    const layer = LAYER_MAP[sc.chunk.type] ?? "context";
    layers.add(layer);
  }
  const layerBonus = layers.size >= 3 ? 1.15 : layers.size >= 2 ? 1.05 : 1.0;

  // Compute final scores
  for (const sc of allChunks.values()) {
    sc.layerBonus = layerBonus;
    sc.finalScore = sc.relevance * sc.uniquenessWeight * sc.relationBonus * sc.layerBonus;
  }

  // Sort and take top N
  return [...allChunks.values()]
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, topN);
}

// ─── Step 4: Context Assembly ──────────────────────────────────────────────────

const LAYER_ORDER: Record<string, number> = {
  identity: 0,
  knowledge: 1,
  context: 2,
};

export function assembleContext(
  rankedChunks: ScoredChunk[],
  relations: Relation[],
  budgetTokens: number,
): { context: string; usedChunks: ScoredChunk[] } {
  // Sort by layer: identity first, then knowledge, then context
  const sorted = [...rankedChunks].sort((a, b) => {
    const layerA = LAYER_ORDER[LAYER_MAP[a.chunk.type] ?? "context"] ?? 2;
    const layerB = LAYER_ORDER[LAYER_MAP[b.chunk.type] ?? "context"] ?? 2;
    if (layerA !== layerB) return layerA - layerB;
    return b.finalScore - a.finalScore;
  });

  // Build relation metadata for selected chunks
  const selectedIds = new Set(sorted.map((sc) => sc.chunk.chunk_id as string));
  const relMap = new Map<string, string[]>();
  for (const rel of relations) {
    const src = rel.source as string;
    const tgt = rel.target as string;
    if (selectedIds.has(src) && selectedIds.has(tgt)) {
      if (!relMap.has(src)) relMap.set(src, []);
      relMap.get(src)!.push(
        `This chunk ${rel.type} chunk ${tgt}${rel.description ? `: ${rel.description}` : ""}`,
      );
    }
  }

  // Assemble within budget
  const usedChunks: ScoredChunk[] = [];
  const lines: string[] = [];
  let tokenEstimate = 0;

  for (const sc of sorted) {
    const chunkId = sc.chunk.chunk_id as string;
    const header = `[${chunkId}] ${sc.chunk.cluster}/${sc.chunk.type} (${sc.chunk.uniqueness}, conf: ${sc.chunk.confidence.toFixed(2)})`;
    const body = sc.chunk.content;
    const relNotes = relMap.get(chunkId) ?? [];
    const relText = relNotes.length > 0 ? "\n" + relNotes.map((r) => `  → ${r}`).join("\n") : "";

    const block = `${header}\n${body}${relText}`;
    const blockTokens = estimateTokens(block);

    if (tokenEstimate + blockTokens > budgetTokens) break;

    lines.push(block);
    tokenEstimate += blockTokens;
    usedChunks.push(sc);
  }

  return {
    context: lines.join("\n\n"),
    usedChunks,
  };
}

// ─── Full RAG Pipeline ─────────────────────────────────────────────────────────

export function ragPipeline(
  store: PortraitStore,
  portrait: PortraitJSON,
  query: string,
  config: RAGConfig,
): RetrievalResult {
  // Step 1: Vector search
  const vectorHits = vectorSearch(store, portrait.subject.id, query, config.topK);

  // Step 2: Graph expansion
  const seedIds = new Set(vectorHits.keys());
  const expanded = graphExpand(portrait, seedIds, 2);

  // Step 3: Rerank
  const ranked = rerank(vectorHits, expanded, config.topN);

  return {
    chunks: ranked,
    totalRetrieved: expanded.size,
    totalUsed: ranked.length,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Rough token estimate: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

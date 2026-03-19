import type { Chunk, Relation, PortraitJSON } from "@athanor/core";
import type { PortraitStore } from "./portrait-store.js";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ChunkWithEmbedding = Chunk & {
  /**
   * Optional temporal metadata stored alongside chunks.
   * Present in some deployments; absent in the in-memory JSON mode.
   */
  _temporal?: {
    stability_score?: number;
    last_confirmed?: string;
    valid_until?: string;
  };
};

export interface ScoredChunk {
  chunk: ChunkWithEmbedding;
  score: number;
  breakdown: {
    similarity: number;
    stability: number;
    recency: number;
    relationBonus: number;
    uniquenessWeight: number;
  };
  isSeed: boolean;
  relationPath?: string; // e.g. "JK-MGT-001 → LEARNED_FROM → JK-CFO-003"
  hopCount?: number; // 0..2
}

export interface RetrievalMeta {
  seed_chunks: number;
  expanded_chunks: number;
  expired_filtered: number;
  total_context: number; // filled in by caller during context assembly
  expansion_paths: string[];
}

export interface RetrievalResult {
  chunks: ScoredChunk[];
  totalRetrieved: number;
  totalUsed: number;
  meta: Omit<RetrievalMeta, "total_context">;
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

const RELATION_BONUS_BY_HOP: Record<number, number> = {
  0: 1.0, // seed chunk
  1: 1.3, // 1-hop expanded
  2: 1.1, // 2-hop expanded
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
): Map<string, { chunk: ChunkWithEmbedding; hopDistance: number; relationPath?: string }> {
  const chunkMap = new Map<string, ChunkWithEmbedding>();
  for (const c of portrait.chunks) {
    chunkMap.set(c.chunk_id as string, c as ChunkWithEmbedding);
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

  // BFS from seed nodes (keeping a single discovered path per chunk)
  const visited = new Map<string, { hopDistance: number; relationPath?: string }>(); // chunk_id → hop + path
  const queue: Array<{ id: string; hops: number; pathStr: string }> = [];

  for (const id of seedChunkIds) {
    visited.set(id, { hopDistance: 0 });
    queue.push({ id, hops: 0, pathStr: id });
  }

  while (queue.length > 0) {
    const { id, hops, pathStr } = queue.shift()!;
    if (hops >= maxHops) continue;

    const neighbors = adjacency.get(id) ?? [];
    for (const { target, type } of neighbors) {
      if (!visited.has(target)) {
        const relationPath = `${pathStr} → ${type} → ${target}`;
        // Keep hop count + the first discovered relation path for this chunk
        visited.set(target, { hopDistance: hops + 1, relationPath });
        queue.push({ id: target, hops: hops + 1, pathStr: relationPath });
      }
    }
  }

  const result = new Map<string, { chunk: ChunkWithEmbedding; hopDistance: number; relationPath?: string }>();
  for (const [id, { hopDistance, relationPath }] of visited) {
    const chunk = chunkMap.get(id);
    if (chunk) {
      result.set(id, { chunk, hopDistance, relationPath });
    }
  }

  return result;
}

// ─── Step 3: Dynamic Scoring ──────────────────────────────────────────────────

export function scoreChunk(params: {
  chunk: ChunkWithEmbedding;
  similarity: number;
  isSeed: boolean;
  hopCount?: number;
  relationPath?: string;
}): ScoredChunk {
  const { chunk, similarity, isSeed } = params;
  const hopCount = params.hopCount ?? 0;

  const stability =
    typeof chunk._temporal?.stability_score === "number"
      ? chunk._temporal.stability_score
      : 0.7;

  let recency = 1;
  const lastConfirmed = chunk._temporal?.last_confirmed;
  if (lastConfirmed) {
    const ms = Date.now() - new Date(lastConfirmed).getTime();
    const hoursSince = Number.isFinite(ms) ? Math.max(0, ms / (1000 * 60 * 60)) : 0;
    recency = Math.pow(0.995, hoursSince);
  }

  const seedBonus = isSeed ? 0.15 : 0.0;
  const relationBonus = RELATION_BONUS_BY_HOP[hopCount] ?? 1.0;
  const uniquenessWeight = UNIQUENESS_WEIGHT[chunk.uniqueness] ?? 1.0;

  const combinedScore = similarity * 0.55 + stability * 0.2 + recency * 0.1 + seedBonus;
  const score = combinedScore * relationBonus * uniquenessWeight;

  return {
    chunk,
    score,
    breakdown: {
      similarity,
      stability,
      recency,
      relationBonus,
      uniquenessWeight,
    },
    isSeed,
    relationPath: params.relationPath,
    hopCount,
  };
}

function isExpiredSnapshot(chunk: ChunkWithEmbedding): boolean {
  const validUntil = chunk._temporal?.valid_until;
  if (!validUntil) return false;

  const untilMs = new Date(validUntil).getTime();
  if (!Number.isFinite(untilMs)) return false;
  return untilMs < Date.now();
}

function scoreCandidates(
  vectorHits: Map<string, { chunk: Chunk; score: number }>,
  graphExpanded: Map<string, { chunk: ChunkWithEmbedding; hopDistance: number; relationPath?: string }>,
): ScoredChunk[] {
  const allChunks = new Map<string, ScoredChunk>();

  // Score graph expansion candidates (includes seeds)
  for (const [id, { chunk, hopDistance, relationPath }] of graphExpanded) {
    const vectorHit = vectorHits.get(id);
    const similarity = vectorHit?.score ?? 0;
    const isSeed = vectorHits.has(id);

    allChunks.set(id, scoreChunk({
      chunk,
      similarity,
      isSeed,
      hopCount: hopDistance,
      relationPath,
    }));
  }

  // Score vector-only hits if any (should be rare in current portrait JSON mode)
  for (const [id, { chunk, score }] of vectorHits) {
    if (allChunks.has(id)) continue;
    const asWithTemporal = chunk as ChunkWithEmbedding;
    allChunks.set(id, scoreChunk({
      chunk: asWithTemporal,
      similarity: score,
      isSeed: true,
      hopCount: 0,
      relationPath: undefined,
    }));
  }

  return [...allChunks.values()];
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
    return b.score - a.score;
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

  // Step 3: Score + filter expired snapshots
  const scoredAll = scoreCandidates(vectorHits, expanded);
  const validChunks = scoredAll.filter((sc) => !isExpiredSnapshot(sc.chunk));
  const expiredFiltered = scoredAll.length - validChunks.length;

  const expansionPaths = [
    ...new Set(
      validChunks
        .filter((sc) => !sc.isSeed && sc.relationPath)
        .map((sc) => sc.relationPath as string),
    ),
  ];

  const ranked = validChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, config.topN);

  const seed_chunks = seedIds.size;
  const expanded_chunks = [...expanded.values()].filter((v) => v.hopDistance > 0).length;

  return {
    chunks: ranked,
    totalRetrieved: expanded.size,
    totalUsed: ranked.length,
    meta: {
      seed_chunks,
      expanded_chunks,
      expired_filtered: expiredFiltered,
      expansion_paths: expansionPaths,
    },
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Rough token estimate: ~4 chars per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

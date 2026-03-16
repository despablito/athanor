import type {
  Chunk,
  ChunkId,
  ChunkInput,
  ChunkType,
  Relation,
  RelationInput,
  PortraitSubject,
  PortraitJSON,
  PortraitStats,
  ValidationResult,
} from "./types.js";
import { CHUNK_TYPE_CODES, RECOMMENDED_CLUSTERS, asChunkId } from "./types.js";
import { validatePortrait } from "./validator.js";

const PROTOCOL_VERSION = "1.0.0-draft";

export class Portrait {
  private subject: PortraitSubject;
  private chunks: Map<ChunkId, Chunk> = new Map();
  private relations: Relation[] = [];
  private counters: Map<string, number> = new Map();

  constructor(subject: PortraitSubject) {
    this.subject = { ...subject };
  }

  private nextId(cluster: string, type: ChunkType): ChunkId {
    const clusterPrefix = cluster
      .split("-")
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 4);

    const typeCode = CHUNK_TYPE_CODES[type];
    const counterKey = `${clusterPrefix}-${typeCode}`;
    const current = this.counters.get(counterKey) ?? 0;
    const next = current + 1;
    this.counters.set(counterKey, next);

    const seq = String(next).padStart(3, "0");
    return asChunkId(`${clusterPrefix}-${typeCode}-${seq}`);
  }

  addChunk(input: ChunkInput): Chunk {
    const chunkId = this.nextId(input.cluster, input.type);
    const chunk: Chunk = {
      chunk_id: chunkId,
      author: input.author ?? this.subject.name,
      cluster: input.cluster,
      type: input.type,
      uniqueness: input.uniqueness,
      source: input.source,
      confidence: input.confidence,
      context_tags: input.context_tags ?? [],
      linked_chunks: input.linked_chunks ?? [],
      content: input.content,
    };
    this.chunks.set(chunkId, chunk);
    return chunk;
  }

  addRelation(input: RelationInput): Relation {
    if (!this.chunks.has(input.source)) {
      throw new Error(`Source chunk not found: ${input.source}`);
    }
    if (!this.chunks.has(input.target)) {
      throw new Error(`Target chunk not found: ${input.target}`);
    }
    const relation: Relation = { ...input };
    this.relations.push(relation);
    return relation;
  }

  removeChunk(chunkId: ChunkId): void {
    this.chunks.delete(chunkId);
    this.relations = this.relations.filter(
      (r) => r.source !== chunkId && r.target !== chunkId,
    );
  }

  getChunk(chunkId: ChunkId): Chunk | undefined {
    return this.chunks.get(chunkId);
  }

  getChunksByCluster(cluster: string): Chunk[] {
    return [...this.chunks.values()].filter((c) => c.cluster === cluster);
  }

  getChunksByType(type: ChunkType): Chunk[] {
    return [...this.chunks.values()].filter((c) => c.type === type);
  }

  getRelatedChunks(chunkId: ChunkId, depth: number = 1): Chunk[] {
    const visited = new Set<string>();
    const queue: Array<{ id: ChunkId; d: number }> = [{ id: chunkId, d: 0 }];
    visited.add(chunkId);

    while (queue.length > 0) {
      const item = queue.shift()!;
      if (item.d >= depth) continue;

      for (const rel of this.relations) {
        let neighborId: ChunkId | null = null;
        if (rel.source === item.id) neighborId = rel.target;
        else if (rel.target === item.id) neighborId = rel.source;

        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, d: item.d + 1 });
        }
      }
    }

    visited.delete(chunkId);
    return [...visited]
      .map((id) => this.chunks.get(id as ChunkId))
      .filter((c): c is Chunk => c !== undefined);
  }

  stats(): PortraitStats {
    const chunks = [...this.chunks.values()];
    const total = chunks.length;

    const clusters: Record<string, number> = {};
    const types: Record<string, number> = {};
    const uniqueness: Record<string, number> = {};
    let confidenceSum = 0;

    for (const chunk of chunks) {
      clusters[chunk.cluster] = (clusters[chunk.cluster] ?? 0) + 1;
      types[chunk.type] = (types[chunk.type] ?? 0) + 1;
      uniqueness[chunk.uniqueness] = (uniqueness[chunk.uniqueness] ?? 0) + 1;
      confidenceSum += chunk.confidence;
    }

    const criticalCount = uniqueness["CRITICAL"] ?? 0;
    const criticalRatio = total > 0 ? criticalCount / total : 0;
    const avgConfidence = total > 0 ? confidenceSum / total : 0;

    // Completeness: weighted by cluster coverage + chunk count + relation density
    const coveredRecommended = RECOMMENDED_CLUSTERS.filter(
      (c) => clusters[c] !== undefined,
    ).length;
    const clusterScore = coveredRecommended / RECOMMENDED_CLUSTERS.length;
    const countScore = Math.min(total / 50, 1);
    const relationScore =
      total > 1
        ? Math.min(this.relations.length / (total * 1.5), 1)
        : 0;
    const completenessScore =
      clusterScore * 0.4 + countScore * 0.3 + relationScore * 0.3;

    return {
      chunk_count: total,
      relation_count: this.relations.length,
      clusters,
      types,
      uniqueness,
      critical_ratio: criticalRatio,
      avg_confidence: avgConfidence,
      completeness_score: Math.round(completenessScore * 100) / 100,
    };
  }

  validate(): ValidationResult {
    return validatePortrait(this.toJSON());
  }

  toJSON(): PortraitJSON {
    const s = this.stats();
    return {
      version: PROTOCOL_VERSION,
      subject: { ...this.subject },
      created_at: new Date().toISOString(),
      chunks: [...this.chunks.values()],
      relations: [...this.relations],
      metadata: {
        completeness_score: s.completeness_score,
        chunk_count: s.chunk_count,
        relation_count: s.relation_count,
        cluster_coverage: s.clusters,
      },
    };
  }
}

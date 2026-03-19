import type { Chunk, ChunkId, RelationType } from "./types.js";
import type { Portrait } from "./portrait.js";

/**
 * Portable graph + vector persistence layer.
 * PostgreSQL + Apache AGE (`PostgresGraphStore`) or libSQL/SQLite (`SqliteGraphStore`).
 */
export interface GraphStore {
  connect(): Promise<void>;
  close(): Promise<void>;

  importPortrait(portrait: Portrait): Promise<void>;

  /** Export raw rows / JSON-compatible objects for a subject (portrait id). */
  exportPortrait(subjectId: string): Promise<{
    chunks: Record<string, unknown>[];
    relations: Record<string, unknown>[];
  }>;

  /**
   * Run openCypher against Apache AGE (PostgreSQL only).
   * @throws on non-Postgres backends
   */
  query(cypher: string, params?: Record<string, unknown>): Promise<unknown[]>;

  getNeighbors(
    chunkId: ChunkId,
    depth?: number,
    relationTypes?: RelationType[],
  ): Promise<Chunk[]>;

  /**
   * Cosine similarity (+ optional graph expansion on SQLite) over stored embeddings.
   */
  vectorSearch(
    portraitId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<Array<{ chunk_id: string; score: number; chunk: Chunk }>>;
}

import { createClient, type Client, type InValue } from "@libsql/client";
import type { Chunk, ChunkId, RelationType } from "./types.js";
import { asChunkId } from "./types.js";
import type { Portrait } from "./portrait.js";
import type { GraphStore } from "./graph-types.js";

const EMBED_DIM = 1536;

function toQueryVectorJson(embedding: number[]): string {
  return JSON.stringify(embedding);
}

function rowToChunk(dataJson: string): Chunk {
  const n = JSON.parse(dataJson) as Record<string, unknown>;
  return {
    chunk_id: asChunkId(String(n.chunk_id)),
    author: String(n.author ?? ""),
    cluster: String(n.cluster ?? ""),
    type: (n.type ?? "fact") as Chunk["type"],
    uniqueness: (n.uniqueness ?? "MEDIUM") as Chunk["uniqueness"],
    source: (n.source ?? "inferred") as Chunk["source"],
    confidence: Number(n.confidence ?? 0),
    context_tags: Array.isArray(n.context_tags)
      ? (n.context_tags as string[])
      : [],
    linked_chunks: Array.isArray(n.linked_chunks)
      ? (n.linked_chunks as string[]).map((id) => asChunkId(id))
      : [],
    content: String(n.content ?? ""),
  };
}

/**
 * libSQL / SQLite graph + vector store (no Apache AGE).
 * Uses `vector32` / `vector_distance_cos` when the engine exposes vector functions.
 */
export class SqliteGraphStore implements GraphStore {
  private client: Client;

  constructor(url: string) {
    this.client = createClient({ url });
  }

  async connect(): Promise<void> {
    await this.client.execute("PRAGMA foreign_keys = ON");
    await this.ensureSchema();
  }

  private async ensureSchema(): Promise<void> {
    await this.client.batch(
      [
        `CREATE TABLE IF NOT EXISTS chunks (
          id TEXT NOT NULL,
          portrait_id TEXT NOT NULL,
          embedding BLOB,
          data TEXT NOT NULL,
          PRIMARY KEY (id, portrait_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_chunks_portrait ON chunks(portrait_id)`,
        `CREATE TABLE IF NOT EXISTS relations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portrait_id TEXT NOT NULL,
          source_id TEXT NOT NULL,
          target_id TEXT NOT NULL,
          type TEXT NOT NULL,
          data TEXT,
          FOREIGN KEY (source_id, portrait_id) REFERENCES chunks(id, portrait_id) ON DELETE CASCADE,
          FOREIGN KEY (target_id, portrait_id) REFERENCES chunks(id, portrait_id) ON DELETE CASCADE
        )`,
        `CREATE INDEX IF NOT EXISTS idx_rel_src ON relations(portrait_id, source_id)`,
        `CREATE INDEX IF NOT EXISTS idx_rel_tgt ON relations(portrait_id, target_id)`,
      ],
      "deferred",
    );
  }

  async importPortrait(portrait: Portrait): Promise<void> {
    const json = portrait.toJSON();
    const pid = json.subject.id;

    await this.client.batch(
      [
        {
          sql: "DELETE FROM relations WHERE portrait_id = ?",
          args: [pid],
        },
        {
          sql: "DELETE FROM chunks WHERE portrait_id = ?",
          args: [pid],
        },
      ],
      "write",
    );

    for (const chunk of json.chunks) {
      const data = JSON.stringify(chunk);
      await this.client.execute({
        sql: `INSERT INTO chunks (id, portrait_id, embedding, data) VALUES (?, ?, NULL, ?)`,
        args: [chunk.chunk_id, pid, data],
      });
    }

    for (const rel of json.relations) {
      const relData =
        rel.description !== undefined
          ? JSON.stringify({ description: rel.description })
          : null;
      await this.client.execute({
        sql: `INSERT INTO relations (portrait_id, source_id, target_id, type, data)
              VALUES (?, ?, ?, ?, ?)`,
        args: [pid, rel.source, rel.target, rel.type, relData],
      });
    }
  }

  async exportPortrait(subjectId: string): Promise<{
    chunks: Record<string, unknown>[];
    relations: Record<string, unknown>[];
  }> {
    const chunkRows = await this.client.execute({
      sql: `SELECT data FROM chunks WHERE portrait_id = ?`,
      args: [subjectId],
    });

    const relRows = await this.client.execute({
      sql: `SELECT source_id, target_id, type, data FROM relations WHERE portrait_id = ?`,
      args: [subjectId],
    });

    const chunks = (chunkRows.rows as unknown as { data: string }[]).map((r) =>
      JSON.parse(r.data) as Record<string, unknown>,
    );

    const relations = (relRows.rows as unknown as {
      source_id: string;
      target_id: string;
      type: string;
      data: string | null;
    }[]).map((r) => {
      const extra = r.data ? (JSON.parse(r.data) as { description?: string }) : {};
      return {
        source: r.source_id,
        target: r.target_id,
        type: r.type,
        ...extra,
      };
    });

    return { chunks, relations };
  }

  async query(): Promise<unknown[]> {
    throw new Error(
      "Raw Cypher queries require PostgreSQL with Apache AGE (PostgresGraphStore).",
    );
  }

  async getNeighbors(
    chunkId: ChunkId,
    depth: number = 1,
    relationTypes?: RelationType[],
  ): Promise<Chunk[]> {
    const pr = await this.client.execute({
      sql: `SELECT portrait_id FROM chunks WHERE id = ? LIMIT 1`,
      args: [chunkId],
    });
    const prow = pr.rows[0] as unknown as { portrait_id: string } | undefined;
    if (!prow) return [];

    const relRes = await this.client.execute({
      sql: `SELECT source_id, target_id, type FROM relations WHERE portrait_id = ?`,
      args: [prow.portrait_id],
    });
    const rels = relRes.rows as unknown as {
      source_id: string;
      target_id: string;
      type: string;
    }[];

    const filtered =
      relationTypes && relationTypes.length > 0
        ? rels.filter((r) =>
            relationTypes.includes(r.type as RelationType),
          )
        : rels;

    const adj = new Map<string, string[]>();
    const addEdge = (a: string, b: string) => {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a)!.push(b);
    };
    for (const r of filtered) {
      addEdge(r.source_id, r.target_id);
      addEdge(r.target_id, r.source_id);
    }

    const seen = new Set<string>([chunkId]);
    let frontier = new Set<string>([chunkId]);
    const outIds: string[] = [];

    for (let d = 0; d < depth; d++) {
      const next = new Set<string>();
      for (const id of frontier) {
        for (const nb of adj.get(id) ?? []) {
          if (!seen.has(nb)) {
            seen.add(nb);
            outIds.push(nb);
            next.add(nb);
          }
        }
      }
      frontier = next;
    }

    if (outIds.length === 0) return [];

    const placeholders = outIds.map(() => "?").join(",");
    const rows = await this.client.execute({
      sql: `SELECT data FROM chunks WHERE portrait_id = ? AND id IN (${placeholders})`,
      args: [prow.portrait_id, ...outIds],
    });

    return (rows.rows as unknown as { data: string }[]).map((r) =>
      rowToChunk(r.data),
    );
  }

  /**
   * GraphRAG-style retrieval: cosine vector search over `embedding`, then 1–2 hop
   * traversal on `relations` using a `WITH RECURSIVE` CTE; scores use `json_extract`
   * only in the outer SELECT (content preview is optional for debugging).
   */
  async vectorSearch(
    portraitId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<Array<{ chunk_id: string; score: number; chunk: Chunk }>> {
    if (queryEmbedding.length !== EMBED_DIM) {
      throw new Error(
        `Expected ${EMBED_DIM}-dim embedding for sqlite vector search, got ${queryEmbedding.length}`,
      );
    }

    const qjson = toQueryVectorJson(queryEmbedding);

    const seedSql = `
      SELECT id, data,
             vector_distance_cos(embedding, vector32(?)) AS dist
      FROM chunks
      WHERE portrait_id = ? AND embedding IS NOT NULL
      ORDER BY dist
      LIMIT ?
    `;

    let seedRows: { id: string; data: string; dist: number }[];
    try {
      const rs = await this.client.execute({
        sql: seedSql,
        args: [qjson, portraitId, topK],
      });
      seedRows = rs.rows as unknown as {
        id: string;
        data: string;
        dist: number;
      }[];
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        msg.includes("vector_distance_cos") ||
        msg.includes("vector32") ||
        msg.includes("no such function")
      ) {
        throw new Error(
          `SQLite vector functions are not available in this libSQL build (${msg}). ` +
            `Use a libSQL build with vector support or PostgreSQL + pgvector.`,
        );
      }
      throw e;
    }

    if (seedRows.length === 0) return [];

    const seedIds = seedRows.map((r) => r.id);
    const seedDist = new Map(seedRows.map((r) => [r.id, r.dist]));

    const placeholders = seedIds.map(() => "?").join(",");
    const expandSql = `
      WITH RECURSIVE reach(id, hop) AS (
        SELECT id, 0 AS hop FROM chunks WHERE portrait_id = ? AND id IN (${placeholders})
        UNION ALL
        SELECT e.other_id, reach.hop + 1
        FROM reach
        JOIN (
          SELECT source_id AS a, target_id AS b, portrait_id FROM relations
          UNION ALL
          SELECT target_id AS a, source_id AS b, portrait_id FROM relations
        ) AS e ON e.a = reach.id AND e.portrait_id = ?
        WHERE reach.hop < 2
      )
      SELECT c.id,
             c.data,
             MIN(reach.hop) AS hop,
             MAX(json_extract(c.data, '$.content')) AS content_preview
      FROM reach
      JOIN chunks c ON c.id = reach.id AND c.portrait_id = ?
      GROUP BY c.id, c.data
    `;

    const expandArgs: InValue[] = [
      portraitId,
      ...seedIds,
      portraitId,
      portraitId,
    ];
    const ex = await this.client.execute({
      sql: expandSql,
      args: expandArgs,
    });

    const expanded = ex.rows as unknown as {
      id: string;
      data: string;
      hop: number;
      content_preview: string | null;
    }[];

    const results: Array<{ chunk_id: string; score: number; chunk: Chunk }> = [];

    for (const row of expanded) {
      const chunk = rowToChunk(row.data);
      const base = seedDist.get(row.id);
      const dist = base ?? 0.35;
      const hopDecay = row.hop === 0 ? 1 : row.hop === 1 ? 0.92 : 0.85;
      const score = (1 - dist) * hopDecay;
      results.push({
        chunk_id: chunk.chunk_id as string,
        score,
        chunk,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async close(): Promise<void> {
    this.client.close();
  }
}

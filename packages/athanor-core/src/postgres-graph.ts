import pg from "pg";
import type { Chunk, ChunkId, RelationType } from "./types.js";
import { asChunkId } from "./types.js";
import type { Portrait } from "./portrait.js";
import type { GraphStore } from "./graph-types.js";

const { Pool } = pg;

export class PostgresGraphStore implements GraphStore {
  private pool: pg.Pool;
  private graphName: string;

  constructor(connectionString: string, graphName: string = "athanor") {
    this.pool = new Pool({ connectionString });
    this.graphName = graphName;
  }

  async connect(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("LOAD 'age'");
      await client.query(`SET search_path = ag_catalog, "$user", public`);
      const result = await client.query(
        `SELECT count(*) FROM ag_catalog.ag_graph WHERE name = $1`,
        [this.graphName],
      );
      if (parseInt(result.rows[0].count) === 0) {
        await client.query(`SELECT create_graph('${this.graphName}')`);
      }
    } finally {
      client.release();
    }
  }

  async importPortrait(portrait: Portrait): Promise<void> {
    const json = portrait.toJSON();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("LOAD 'age'");
      await client.query(`SET search_path = ag_catalog, "$user", public`);

      for (const chunk of json.chunks) {
        const props = JSON.stringify({
          chunk_id: chunk.chunk_id,
          author: chunk.author,
          cluster: chunk.cluster,
          type: chunk.type,
          uniqueness: chunk.uniqueness,
          source: chunk.source,
          confidence: chunk.confidence,
          content: chunk.content,
        });
        await client.query(
          `SELECT * FROM cypher('${this.graphName}', $$ CREATE (:Chunk ${props}) $$) AS (v agtype)`,
        );

        await client.query(
          `INSERT INTO chunk_embeddings (chunk_id, portrait_id, cluster, chunk_type, uniqueness, confidence, content, context_tags)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (chunk_id) DO UPDATE SET
             cluster = EXCLUDED.cluster,
             chunk_type = EXCLUDED.chunk_type,
             uniqueness = EXCLUDED.uniqueness,
             confidence = EXCLUDED.confidence,
             content = EXCLUDED.content,
             context_tags = EXCLUDED.context_tags`,
          [
            chunk.chunk_id,
            json.subject.id,
            chunk.cluster,
            chunk.type,
            chunk.uniqueness,
            chunk.confidence,
            chunk.content,
            chunk.context_tags,
          ],
        );
      }

      for (const rel of json.relations) {
        const props = rel.description
          ? JSON.stringify({ description: rel.description })
          : "{}";
        await client.query(
          `SELECT * FROM cypher('${this.graphName}', $$
            MATCH (a:Chunk {chunk_id: '${rel.source}'}), (b:Chunk {chunk_id: '${rel.target}'})
            CREATE (a)-[:${rel.type} ${props}]->(b)
          $$) AS (e agtype)`,
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async exportPortrait(subjectId: string): Promise<{
    chunks: Record<string, unknown>[];
    relations: Record<string, unknown>[];
  }> {
    const client = await this.pool.connect();
    try {
      await client.query("LOAD 'age'");
      await client.query(`SET search_path = ag_catalog, "$user", public`);

      const chunkResult = await client.query(
        `SELECT chunk_id, cluster, chunk_type, uniqueness, confidence, content, context_tags
         FROM chunk_embeddings WHERE portrait_id = $1`,
        [subjectId],
      );

      const relResult = await client.query(
        `SELECT * FROM cypher('${this.graphName}', $$
          MATCH (a:Chunk)-[r]->(b:Chunk)
          RETURN a.chunk_id, type(r), b.chunk_id, r.description
        $$) AS (source agtype, rel_type agtype, target agtype, description agtype)`,
      );

      return {
        chunks: chunkResult.rows,
        relations: relResult.rows,
      };
    } finally {
      client.release();
    }
  }

  async query(
    cypher: string,
    params?: Record<string, unknown>,
  ): Promise<unknown[]> {
    const client = await this.pool.connect();
    try {
      await client.query("LOAD 'age'");
      await client.query(`SET search_path = ag_catalog, "$user", public`);

      let cypherQuery = cypher;
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          const escaped =
            typeof value === "string" ? `'${value}'` : String(value);
          cypherQuery = cypherQuery.replace(`$${key}`, escaped);
        }
      }

      const result = await client.query(
        `SELECT * FROM cypher('${this.graphName}', $$ ${cypherQuery} $$) AS (result agtype)`,
      );
      return result.rows.map((r) => r.result);
    } finally {
      client.release();
    }
  }

  async getNeighbors(
    chunkId: ChunkId,
    depth: number = 1,
    relationTypes?: RelationType[],
  ): Promise<Chunk[]> {
    const client = await this.pool.connect();
    try {
      await client.query("LOAD 'age'");
      await client.query(`SET search_path = ag_catalog, "$user", public`);

      const relFilter =
        relationTypes && relationTypes.length > 0
          ? `:${relationTypes.join("|")}`
          : "";

      const result = await client.query(
        `SELECT * FROM cypher('${this.graphName}', $$
          MATCH (start:Chunk {chunk_id: '${chunkId}'})-[${relFilter}*1..${depth}]-(neighbor:Chunk)
          RETURN DISTINCT neighbor
        $$) AS (neighbor agtype)`,
      );

      return result.rows.map((r) => {
        const n =
          typeof r.neighbor === "string"
            ? JSON.parse(r.neighbor)
            : r.neighbor;
        return {
          chunk_id: asChunkId(n.chunk_id),
          author: n.author ?? "",
          cluster: n.cluster ?? "",
          type: n.type ?? "fact",
          uniqueness: n.uniqueness ?? "MEDIUM",
          source: n.source ?? "inferred",
          confidence: n.confidence ?? 0,
          context_tags: n.context_tags ?? [],
          linked_chunks: n.linked_chunks ?? [],
          content: n.content ?? "",
        } satisfies Chunk;
      });
    } finally {
      client.release();
    }
  }

  /**
   * pgvector cosine similarity when `chunk_embeddings.embedding` is populated.
   */
  async vectorSearch(
    portraitId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<Array<{ chunk_id: string; score: number; chunk: Chunk }>> {
    if (queryEmbedding.length === 0) return [];
    const vecLiteral = `[${queryEmbedding.join(",")}]`;
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT chunk_id, cluster, chunk_type, uniqueness, confidence, content, context_tags,
                1 - (embedding <=> $1::vector) AS score
         FROM chunk_embeddings
         WHERE portrait_id = $2 AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        [vecLiteral, portraitId, topK],
      );
      return result.rows.map((row) => ({
        chunk_id: row.chunk_id as string,
        score: Number(row.score),
        chunk: {
          chunk_id: asChunkId(row.chunk_id),
          author: "",
          cluster: row.cluster ?? "",
          type: (row.chunk_type ?? "fact") as Chunk["type"],
          uniqueness: (row.uniqueness ?? "MEDIUM") as Chunk["uniqueness"],
          source: "inferred",
          confidence: Number(row.confidence ?? 0),
          context_tags: row.context_tags ?? [],
          linked_chunks: [],
          content: row.content ?? "",
        } satisfies Chunk,
      }));
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

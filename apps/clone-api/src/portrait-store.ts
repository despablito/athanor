import { readFile } from "node:fs/promises";
import type { PortraitJSON, Chunk, Relation } from "@athanor/core";

/**
 * In-memory portrait store for JSON-only mode (no database).
 * Also serves as the data interface for DB mode.
 */
export class PortraitStore {
  private portraits = new Map<string, PortraitJSON>();

  async loadFromFile(path: string): Promise<PortraitJSON> {
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw) as PortraitJSON;
    this.portraits.set(data.subject.id, data);
    return data;
  }

  loadFromJSON(portrait: PortraitJSON): void {
    this.portraits.set(portrait.subject.id, portrait);
  }

  get(id: string): PortraitJSON | undefined {
    return this.portraits.get(id);
  }

  list(): Array<{ id: string; name: string; chunk_count: number }> {
    return [...this.portraits.values()].map((p) => ({
      id: p.subject.id,
      name: p.subject.name,
      chunk_count: p.metadata.chunk_count,
    }));
  }

  getChunk(portraitId: string, chunkId: string): Chunk | undefined {
    const portrait = this.portraits.get(portraitId);
    if (!portrait) return undefined;
    return portrait.chunks.find((c) => (c.chunk_id as string) === chunkId);
  }

  getChunks(portraitId: string): Chunk[] {
    return this.portraits.get(portraitId)?.chunks ?? [];
  }

  getRelations(portraitId: string): Relation[] {
    return this.portraits.get(portraitId)?.relations ?? [];
  }

  /**
   * Simple cosine similarity search using in-memory content matching.
   * Used when no vector DB is available — falls back to keyword overlap.
   */
  searchChunks(
    portraitId: string,
    query: string,
    topK: number = 10,
  ): Array<{ chunk: Chunk; score: number }> {
    const portrait = this.portraits.get(portraitId);
    if (!portrait) return [];

    const queryTerms = tokenize(query);

    const scored = portrait.chunks.map((chunk) => {
      const contentTerms = tokenize(chunk.content);
      const tagTerms = chunk.context_tags.flatMap((t) => tokenize(t));
      const allTerms = new Set([...contentTerms, ...tagTerms]);

      // TF-IDF-like overlap scoring
      let overlap = 0;
      for (const qt of queryTerms) {
        if (allTerms.has(qt)) overlap++;
        // Partial match bonus
        for (const ct of allTerms) {
          if (ct.includes(qt) || qt.includes(ct)) overlap += 0.3;
        }
      }

      const score = queryTerms.length > 0 ? overlap / queryTerms.length : 0;
      return { chunk, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

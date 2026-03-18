import { describe, it, expect } from "vitest";
import { Portrait } from "./portrait.js";
import type { ChunkInput } from "./types.js";
import { asChunkId } from "./types.js";

function makeChunkInput(overrides: Partial<ChunkInput> = {}): ChunkInput {
  return {
    cluster: "technical-decision-making",
    type: "heuristic",
    uniqueness: "CRITICAL",
    source: "interview",
    confidence: 0.9,
    content:
      "When evaluating a new framework, always check the bus factor before reading docs.",
    ...overrides,
  };
}

describe("Portrait", () => {
  it("creates a portrait with subject", () => {
    const p = new Portrait({ name: "Jan Kowalski", id: "jan-001" });
    const json = p.toJSON();
    expect(json.subject.name).toBe("Jan Kowalski");
    expect(json.subject.id).toBe("jan-001");
    expect(json.version).toBe("1.0.0-draft");
  });

  describe("addChunk", () => {
    it("auto-generates chunk_id", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const chunk = p.addChunk(makeChunkInput());
      expect(chunk.chunk_id).toMatch(/^[A-Z]{2,4}-[A-Z]{3,5}-\d{3}$/);
    });

    it("increments sequence numbers", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const c1 = p.addChunk(makeChunkInput());
      const c2 = p.addChunk(makeChunkInput());
      expect(c1.chunk_id).not.toBe(c2.chunk_id);
      expect(c1.chunk_id.endsWith("001")).toBe(true);
      expect(c2.chunk_id.endsWith("002")).toBe(true);
    });

    it("uses subject name as default author", () => {
      const p = new Portrait({ name: "Jan Kowalski", id: "jan-001" });
      const chunk = p.addChunk(makeChunkInput());
      expect(chunk.author).toBe("Jan Kowalski");
    });

    it("allows author override", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const chunk = p.addChunk(makeChunkInput({ author: "Custom Author" }));
      expect(chunk.author).toBe("Custom Author");
    });

    it("defaults context_tags and linked_chunks to empty arrays", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const chunk = p.addChunk(makeChunkInput());
      expect(chunk.context_tags).toEqual([]);
      expect(chunk.linked_chunks).toEqual([]);
    });
  });

  describe("addRelation", () => {
    it("adds a relation between existing chunks", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const c1 = p.addChunk(makeChunkInput());
      const c2 = p.addChunk(makeChunkInput({ type: "anti-pattern" }));
      const rel = p.addRelation({
        source: c1.chunk_id,
        target: c2.chunk_id,
        type: "ENABLES",
      });
      expect(rel.type).toBe("ENABLES");
    });

    it("throws if source chunk does not exist", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const c = p.addChunk(makeChunkInput());
      expect(() =>
        p.addRelation({
          source: asChunkId("XX-HEUR-999"),
          target: c.chunk_id,
          type: "ENABLES",
        }),
      ).toThrow("Source chunk not found");
    });

    it("throws if target chunk does not exist", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const c = p.addChunk(makeChunkInput());
      expect(() =>
        p.addRelation({
          source: c.chunk_id,
          target: asChunkId("XX-HEUR-999"),
          type: "ENABLES",
        }),
      ).toThrow("Target chunk not found");
    });
  });

  describe("removeChunk", () => {
    it("removes chunk and its relations", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const c1 = p.addChunk(makeChunkInput());
      const c2 = p.addChunk(makeChunkInput({ type: "anti-pattern" }));
      p.addRelation({
        source: c1.chunk_id,
        target: c2.chunk_id,
        type: "ENABLES",
      });
      p.removeChunk(c1.chunk_id);
      expect(p.getChunk(c1.chunk_id)).toBeUndefined();
      expect(p.stats().relation_count).toBe(0);
    });
  });

  describe("getChunk", () => {
    it("returns chunk by id", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const c = p.addChunk(makeChunkInput());
      expect(p.getChunk(c.chunk_id)).toEqual(c);
    });

    it("returns undefined for missing id", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      expect(p.getChunk(asChunkId("XX-HEUR-999"))).toBeUndefined();
    });
  });

  describe("getChunksByCluster", () => {
    it("filters by cluster", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      p.addChunk(makeChunkInput({ cluster: "technical-decision-making" }));
      p.addChunk(makeChunkInput({ cluster: "team-leadership" }));
      p.addChunk(makeChunkInput({ cluster: "technical-decision-making" }));
      expect(p.getChunksByCluster("technical-decision-making")).toHaveLength(2);
      expect(p.getChunksByCluster("team-leadership")).toHaveLength(1);
      expect(p.getChunksByCluster("nonexistent")).toHaveLength(0);
    });
  });

  describe("getChunksByType", () => {
    it("filters by type", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      p.addChunk(makeChunkInput({ type: "heuristic" }));
      p.addChunk(makeChunkInput({ type: "anti-pattern" }));
      p.addChunk(makeChunkInput({ type: "heuristic" }));
      expect(p.getChunksByType("heuristic")).toHaveLength(2);
      expect(p.getChunksByType("anti-pattern")).toHaveLength(1);
    });
  });

  describe("getRelatedChunks", () => {
    it("finds direct neighbors at depth 1", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const c1 = p.addChunk(makeChunkInput());
      const c2 = p.addChunk(makeChunkInput({ type: "anti-pattern" }));
      const c3 = p.addChunk(makeChunkInput({ type: "emotion" }));
      p.addRelation({
        source: c1.chunk_id,
        target: c2.chunk_id,
        type: "ENABLES",
      });
      p.addRelation({
        source: c2.chunk_id,
        target: c3.chunk_id,
        type: "LEARNED_FROM",
      });

      const related = p.getRelatedChunks(c1.chunk_id, 1);
      expect(related).toHaveLength(1);
      expect(related[0].chunk_id).toBe(c2.chunk_id);
    });

    it("finds transitive neighbors at depth 2", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const c1 = p.addChunk(makeChunkInput());
      const c2 = p.addChunk(makeChunkInput({ type: "anti-pattern" }));
      const c3 = p.addChunk(makeChunkInput({ type: "emotion" }));
      p.addRelation({
        source: c1.chunk_id,
        target: c2.chunk_id,
        type: "ENABLES",
      });
      p.addRelation({
        source: c2.chunk_id,
        target: c3.chunk_id,
        type: "LEARNED_FROM",
      });

      const related = p.getRelatedChunks(c1.chunk_id, 2);
      expect(related).toHaveLength(2);
    });

    it("returns empty for isolated chunk", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const c = p.addChunk(makeChunkInput());
      expect(p.getRelatedChunks(c.chunk_id)).toEqual([]);
    });
  });

  describe("stats", () => {
    it("computes correct counts and ratios", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      p.addChunk(makeChunkInput({ uniqueness: "CRITICAL", confidence: 0.9 }));
      p.addChunk(
        makeChunkInput({
          type: "anti-pattern",
          uniqueness: "HIGH",
          confidence: 0.8,
        }),
      );
      p.addChunk(
        makeChunkInput({
          type: "emotion",
          uniqueness: "MEDIUM",
          confidence: 0.7,
        }),
      );

      const s = p.stats();
      expect(s.chunk_count).toBe(3);
      expect(s.uniqueness["CRITICAL"]).toBe(1);
      expect(s.uniqueness["HIGH"]).toBe(1);
      expect(s.uniqueness["MEDIUM"]).toBe(1);
      expect(s.critical_ratio).toBeCloseTo(1 / 3);
      expect(s.avg_confidence).toBeCloseTo(0.8);
    });

    it("returns zeros for empty portrait", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      const s = p.stats();
      expect(s.chunk_count).toBe(0);
      expect(s.relation_count).toBe(0);
      expect(s.critical_ratio).toBe(0);
      expect(s.completeness_score).toBe(0);
    });

    it("completeness increases with cluster coverage", () => {
      const p1 = new Portrait({ name: "Jan", id: "jan-001" });
      p1.addChunk(makeChunkInput({ cluster: "technical-decision-making" }));

      const p2 = new Portrait({ name: "Jan", id: "jan-001" });
      p2.addChunk(makeChunkInput({ cluster: "technical-decision-making" }));
      p2.addChunk(
        makeChunkInput({
          cluster: "team-leadership",
          type: "anti-pattern",
        }),
      );
      p2.addChunk(
        makeChunkInput({
          cluster: "communication",
          type: "style",
        }),
      );

      expect(p2.stats().completeness_score).toBeGreaterThan(
        p1.stats().completeness_score,
      );
    });
  });

  describe("validate", () => {
    it("validates a well-formed portrait", () => {
      const p = new Portrait({ name: "Jan Kowalski", id: "jan-001" });
      p.addChunk(makeChunkInput());
      const result = p.validate();
      expect(result.valid).toBe(true);
    });
  });

  describe("toJSON", () => {
    it("produces correct structure", () => {
      const p = new Portrait({ name: "Jan", id: "jan-001" });
      p.addChunk(makeChunkInput());
      const json = p.toJSON();
      expect(json.version).toBe("1.0.0-draft");
      expect(json.subject.name).toBe("Jan");
      expect(json.created_at).toBeTruthy();
      expect(json.chunks).toHaveLength(1);
      expect(json.relations).toHaveLength(0);
      expect(json.metadata.chunk_count).toBe(1);
      expect(json.metadata.relation_count).toBe(0);
    });
  });
});

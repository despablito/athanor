import { describe, it, expect } from "vitest";
import { vectorSearch, graphExpand, scoreChunk, assembleContext, type ScoredChunk } from "./rag.js";
import { PortraitStore } from "./portrait-store.js";
import type { PortraitJSON, Chunk, Relation } from "@athanor/core";

// ─── Test Fixtures ─────────────────────────────────────────────────────────────

function makeChunk(
  id: string,
  cluster: string,
  type: string,
  uniqueness: string,
  content: string,
  confidence: number = 0.9,
  tags: string[] = [],
  temporal?: Partial<{
    stability_score: number;
    last_confirmed: string;
    valid_until: string;
  }>,
): Chunk {
  return {
    chunk_id: id,
    author: "Jan",
    cluster,
    type,
    uniqueness,
    source: "interview",
    confidence,
    context_tags: tags,
    linked_chunks: [],
    content,
    ...(temporal ? ({ _temporal: temporal } as unknown as Record<string, unknown>) : {}),
  } as unknown as Chunk;
}

function makePortrait(
  chunks: Chunk[],
  relations: Relation[] = [],
): PortraitJSON {
  const coverage: Record<string, number> = {};
  for (const c of chunks) {
    coverage[c.cluster] = (coverage[c.cluster] ?? 0) + 1;
  }
  return {
    version: "1.0.0-draft",
    subject: { name: "Jan", id: "jan" },
    created_at: new Date().toISOString(),
    chunks,
    relations,
    metadata: {
      completeness_score: 0.7,
      chunk_count: chunks.length,
      relation_count: relations.length,
      cluster_coverage: coverage,
    },
  };
}

function makeRelation(
  source: string,
  target: string,
  type: string,
  description?: string,
): Relation {
  return { source, target, type, description } as unknown as Relation;
}

// ─── Test Data ─────────────────────────────────────────────────────────────────

const CHUNKS = [
  makeChunk("TDM-HEUR-001", "technical-decision-making", "heuristic", "CRITICAL",
    "Jan always checks the bus factor when evaluating new frameworks", 0.95, ["dependency", "risk"]),
  makeChunk("TDM-STRY-001", "technical-decision-making", "story", "HIGH",
    "In 2020 a critical dependency had a single maintainer who disappeared", 0.88, ["incident"]),
  makeChunk("TDM-ANTI-001", "technical-decision-making", "anti-pattern", "CRITICAL",
    "Jan never allows full table scans on tables with more than 1 million rows", 0.92, ["database", "performance"]),
  makeChunk("LDR-BLEF-001", "team-leadership", "belief", "HIGH",
    "Engineering teams should own their decisions end-to-end", 0.85, ["autonomy"]),
  makeChunk("LDR-STYL-001", "team-leadership", "style", "MEDIUM",
    "Jan communicates directly, using sailing metaphors frequently", 0.82, ["communication"]),
  makeChunk("EML-EMOT-001", "emotional-landscape", "emotion", "HIGH",
    "Jan becomes frustrated when confronted with copy-pasted code", 0.78, ["frustration", "code-quality"]),
  makeChunk("PV-BLEF-001", "personal-values", "belief", "CRITICAL",
    "Reversibility is the most important property of any technical decision", 0.93, ["architecture"]),
  makeChunk("META-META-001", "meta-patterns", "meta", "HIGH",
    "Jan shows principled pragmatism: strong opinions with systematic escape hatches", 0.75, ["meta"]),
];

const RELATIONS = [
  makeRelation("TDM-HEUR-001", "TDM-STRY-001", "LEARNED_FROM",
    "Bus factor heuristic was learned from the dependency incident"),
  makeRelation("TDM-HEUR-001", "PV-BLEF-001", "INSTANTIATES",
    "Bus factor check instantiates the reversibility principle"),
  makeRelation("EML-EMOT-001", "LDR-STYL-001", "EXPRESSED_THROUGH",
    "Frustration manifests through direct communication style"),
  makeRelation("LDR-BLEF-001", "TDM-ANTI-001", "CONTRASTS_WITH",
    "Team autonomy contrasts with strict database rules"),
];

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("vectorSearch (in-memory keyword fallback)", () => {
  it("finds chunks matching query terms", () => {
    const store = new PortraitStore();
    const portrait = makePortrait(CHUNKS, RELATIONS);
    store.loadFromJSON(portrait);

    const results = vectorSearch(store, "jan", "bus factor framework evaluation", 10);
    expect(results.size).toBeGreaterThan(0);
    expect(results.has("TDM-HEUR-001")).toBe(true);
  });

  it("returns empty for non-matching query", () => {
    const store = new PortraitStore();
    store.loadFromJSON(makePortrait(CHUNKS));

    const results = vectorSearch(store, "jan", "xyzzynonexistent", 10);
    expect(results.size).toBe(0);
  });
});

describe("graphExpand", () => {
  it("expands 1 hop from seed nodes", () => {
    const portrait = makePortrait(CHUNKS, RELATIONS);
    const seeds = new Set(["TDM-HEUR-001"]);

    const expanded = graphExpand(portrait, seeds, 1);

    // Should include the seed itself + direct neighbors
    expect(expanded.has("TDM-HEUR-001")).toBe(true);
    expect(expanded.get("TDM-HEUR-001")!.hopDistance).toBe(0);

    // LEARNED_FROM neighbor
    expect(expanded.has("TDM-STRY-001")).toBe(true);
    expect(expanded.get("TDM-STRY-001")!.hopDistance).toBe(1);
    expect(expanded.get("TDM-STRY-001")!.relationPath).toBe("TDM-HEUR-001 → LEARNED_FROM → TDM-STRY-001");

    // INSTANTIATES neighbor
    expect(expanded.has("PV-BLEF-001")).toBe(true);
    expect(expanded.get("PV-BLEF-001")!.hopDistance).toBe(1);
  });

  it("expands 2 hops from seed nodes", () => {
    const portrait = makePortrait(CHUNKS, RELATIONS);
    const seeds = new Set(["EML-EMOT-001"]);

    const expanded = graphExpand(portrait, seeds, 2);

    // Seed
    expect(expanded.has("EML-EMOT-001")).toBe(true);
    // 1-hop: EXPRESSED_THROUGH → LDR-STYL-001
    expect(expanded.has("LDR-STYL-001")).toBe(true);
  });

  it("ignores ENABLES relation type", () => {
    // ENABLES is not in the expansion set
    const portrait = makePortrait(CHUNKS, [
      makeRelation("TDM-HEUR-001", "TDM-STRY-001", "ENABLES"),
    ]);
    const seeds = new Set(["TDM-HEUR-001"]);

    const expanded = graphExpand(portrait, seeds, 1);
    // Only the seed itself should be present
    expect(expanded.size).toBe(1);
    expect(expanded.has("TDM-HEUR-001")).toBe(true);
  });
});

describe("scoreChunk", () => {
  it("seed chunks score higher than expanded chunks at equal similarity", () => {
    const temporal = { stability_score: 0.7, last_confirmed: new Date().toISOString() };

    const seed = scoreChunk({
      chunk: makeChunk("SEED-1", "technical-decision-making", "heuristic", "MEDIUM", "seed", 0.9, [], temporal) as unknown as Chunk,
      similarity: 0,
      isSeed: true,
      hopCount: 0,
    });

    const expanded = scoreChunk({
      chunk: makeChunk("EXP-1", "technical-decision-making", "heuristic", "MEDIUM", "expanded", 0.9, [], temporal) as unknown as Chunk,
      similarity: 0,
      isSeed: false,
      hopCount: 1,
    });

    expect(seed.score).toBeGreaterThan(expanded.score);
  });

  it("recent chunks score higher than chunks confirmed 6 months ago", () => {
    const now = Date.now();
    const temporalRecent = { stability_score: 0.7, last_confirmed: new Date(now).toISOString() };
    const temporalOld = {
      stability_score: 0.7,
      last_confirmed: new Date(now - 1000 * 60 * 60 * 24 * 180).toISOString(),
    };

    const recent = scoreChunk({
      chunk: makeChunk("RECENT-1", "technical-decision-making", "heuristic", "MEDIUM", "recent", 0.9, [], temporalRecent) as unknown as Chunk,
      similarity: 0.5,
      isSeed: true,
      hopCount: 0,
    });

    const old = scoreChunk({
      chunk: makeChunk("OLD-1", "technical-decision-making", "heuristic", "MEDIUM", "old", 0.9, [], temporalOld) as unknown as Chunk,
      similarity: 0.5,
      isSeed: true,
      hopCount: 0,
    });

    expect(recent.score).toBeGreaterThan(old.score);
  });

  it("CRITICAL uniqueness multiplies final score by 1.5", () => {
    const temporal = { stability_score: 0.7, last_confirmed: new Date().toISOString() };

    const critical = scoreChunk({
      chunk: makeChunk("CRIT-1", "technical-decision-making", "heuristic", "CRITICAL", "critical", 0.9, [], temporal) as unknown as Chunk,
      similarity: 0.5,
      isSeed: true,
      hopCount: 0,
    });

    const medium = scoreChunk({
      chunk: makeChunk("MED-1", "technical-decision-making", "heuristic", "MEDIUM", "medium", 0.9, [], temporal) as unknown as Chunk,
      similarity: 0.5,
      isSeed: true,
      hopCount: 0,
    });

    expect(critical.score).toBeCloseTo(medium.score * 1.5, 6);
  });

  it("chunks with valid_until in the past are excluded", async () => {
    const store = new PortraitStore();
    const now = Date.now();

    const pastChunk = makeChunk(
      "PAST-1",
      "technical-decision-making",
      "heuristic",
      "MEDIUM",
      "jan past chunk bus factor",
      0.9,
      ["risk"],
      {
        valid_until: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        stability_score: 0.7,
        last_confirmed: new Date(now).toISOString(),
      },
    );

    const futureChunk = makeChunk(
      "FUTURE-1",
      "technical-decision-making",
      "heuristic",
      "MEDIUM",
      "jan future chunk bus factor",
      0.9,
      ["risk"],
      {
        valid_until: new Date(now + 1000 * 60 * 60 * 24).toISOString(),
        stability_score: 0.7,
        last_confirmed: new Date(now).toISOString(),
      },
    );

    const portrait = makePortrait([pastChunk, futureChunk], []);
    store.loadFromJSON(portrait);

    const { ragPipeline: pipeline } = await import("./rag.js");
    const result = pipeline(store, portrait, "jan bus factor", {
      topK: 10,
      topN: 10,
      contextBudgetTokens: 4000,
    });

    expect(result.chunks.some((sc: ScoredChunk) => sc.chunk.chunk_id === "PAST-1")).toBe(false);
    expect(result.chunks.some((sc: ScoredChunk) => sc.chunk.chunk_id === "FUTURE-1")).toBe(true);
  });
});

describe("assembleContext", () => {
  it("orders identity chunks before knowledge and context", () => {
    const scored = [
      { chunk: CHUNKS[0], score: 1.35, breakdown: { similarity: 0, stability: 0.7, recency: 1, relationBonus: 1, uniquenessWeight: 1.5 }, isSeed: true, hopCount: 0 }, // heuristic → knowledge
      { chunk: CHUNKS[3], score: 1.02, breakdown: { similarity: 0, stability: 0.7, recency: 1, relationBonus: 1, uniquenessWeight: 1.2 }, isSeed: true, hopCount: 0 }, // belief → identity
      { chunk: CHUNKS[1], score: 0.96, breakdown: { similarity: 0, stability: 0.7, recency: 1, relationBonus: 1, uniquenessWeight: 1.2 }, isSeed: true, hopCount: 0 }, // story → context
    ];

    const { context, usedChunks } = assembleContext(scored as ScoredChunk[], RELATIONS, 4000);

    // Identity (belief) should come first
    const beliefIdx = context.indexOf("LDR-BLEF-001");
    const heurIdx = context.indexOf("TDM-HEUR-001");
    const storyIdx = context.indexOf("TDM-STRY-001");

    expect(beliefIdx).toBeLessThan(heurIdx);
    expect(heurIdx).toBeLessThan(storyIdx);
    expect(usedChunks.length).toBe(3);
  });

  it("includes relation metadata between selected chunks", () => {
    const scored = [
      { chunk: CHUNKS[0], score: 1.35, breakdown: { similarity: 0, stability: 0.7, recency: 1, relationBonus: 1, uniquenessWeight: 1.5 }, isSeed: true, hopCount: 0 },
      { chunk: CHUNKS[1], score: 1.25, breakdown: { similarity: 0, stability: 0.7, recency: 1, relationBonus: 1.3, uniquenessWeight: 1.2 }, isSeed: false, hopCount: 1 },
    ];

    const { context } = assembleContext(scored as ScoredChunk[], RELATIONS, 4000);

    expect(context).toContain("LEARNED_FROM");
    expect(context).toContain("TDM-STRY-001");
  });

  it("respects token budget", () => {
    const scored = CHUNKS.map((c) => ({
      chunk: c,
      score: 0.8,
      breakdown: { similarity: 0, stability: 0.7, recency: 1, relationBonus: 1, uniquenessWeight: 1.0 },
      isSeed: true,
      hopCount: 0,
    }));

    // Very small budget — should only fit a few chunks
    const { usedChunks } = assembleContext(scored as ScoredChunk[], [], 200);
    expect(usedChunks.length).toBeLessThan(CHUNKS.length);
    expect(usedChunks.length).toBeGreaterThan(0);
  });
});

describe("full RAG pipeline integration", () => {
  it("retrieves, expands, and reranks for a query", async () => {
    const store = new PortraitStore();
    const portrait = makePortrait(CHUNKS, RELATIONS);
    store.loadFromJSON(portrait);

    const { ragPipeline: pipeline } = await import("./rag.js");
    const result = pipeline(store, portrait, "bus factor dependency evaluation", {
      topK: 5,
      topN: 10,
      contextBudgetTokens: 4000,
    });

    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.totalRetrieved).toBeGreaterThan(0);

    // The bus factor chunk should be among the top results
    const busFactorChunk = result.chunks.find(
      (sc: ScoredChunk) => sc.chunk.chunk_id === "TDM-HEUR-001",
    );
    expect(busFactorChunk).toBeDefined();
  });
});

// (moved into scoreChunk suite above)

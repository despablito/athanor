import { describe, it, expect } from "vitest";
import { detectRelations } from "./linker.js";
import { MockLLMProvider } from "./provider.test.js";
import type { PortraitJSON, ChunkId } from "@athanor/core";

function makePortrait(overrides: Partial<PortraitJSON> = {}): PortraitJSON {
  return {
    version: "1.0.0-draft",
    subject: { name: "Jan", id: "jan" },
    created_at: new Date().toISOString(),
    chunks: [
      {
        chunk_id: "TDM-HEUR-001" as ChunkId,
        author: "Jan",
        cluster: "technical-decision-making",
        type: "heuristic",
        uniqueness: "CRITICAL",
        source: "interview",
        confidence: 0.92,
        context_tags: ["dependency"],
        linked_chunks: [],
        content: "Jan always checks the bus factor when evaluating new frameworks.",
      },
      {
        chunk_id: "TDM-STRY-001" as ChunkId,
        author: "Jan",
        cluster: "technical-decision-making",
        type: "story",
        uniqueness: "HIGH",
        source: "interview",
        confidence: 0.88,
        context_tags: ["incident"],
        linked_chunks: [],
        content: "In 2020, a critical dependency had a single maintainer who disappeared.",
      },
      {
        chunk_id: "LDR-BLEF-001" as ChunkId,
        author: "Jan",
        cluster: "team-leadership",
        type: "belief",
        uniqueness: "HIGH",
        source: "meeting",
        confidence: 0.85,
        context_tags: ["autonomy"],
        linked_chunks: [],
        content: "Jan believes engineering teams should own their decisions end-to-end.",
      },
    ],
    relations: [],
    metadata: {
      completeness_score: 0.5,
      chunk_count: 3,
      relation_count: 0,
      cluster_coverage: { "technical-decision-making": 2, "team-leadership": 1 },
    },
    ...overrides,
  };
}

describe("detectRelations", () => {
  it("extracts valid relations from LLM response", async () => {
    const response = JSON.stringify([
      {
        source: "TDM-HEUR-001",
        target: "TDM-STRY-001",
        type: "LEARNED_FROM",
        description: "Bus factor heuristic was learned from the dependency incident",
      },
      {
        source: "TDM-HEUR-001",
        target: "LDR-BLEF-001",
        type: "ENABLES",
        description: "Bus factor checks enable team autonomy by reducing risk",
      },
    ]);
    const mock = new MockLLMProvider(response);
    const portrait = makePortrait();
    const relations = await detectRelations(mock, portrait);

    expect(relations).toHaveLength(2);
    expect(relations[0].source).toBe("TDM-HEUR-001");
    expect(relations[0].target).toBe("TDM-STRY-001");
    expect(relations[0].type).toBe("LEARNED_FROM");
    expect(relations[0].description).toContain("Bus factor");
  });

  it("filters out relations with invalid chunk IDs", async () => {
    const response = JSON.stringify([
      {
        source: "TDM-HEUR-001",
        target: "NONEXISTENT-001",
        type: "ENABLES",
        description: "This references a chunk that does not exist",
      },
    ]);
    const mock = new MockLLMProvider(response);
    const portrait = makePortrait();
    const relations = await detectRelations(mock, portrait);

    expect(relations).toHaveLength(0);
  });

  it("filters out self-referencing relations", async () => {
    const response = JSON.stringify([
      {
        source: "TDM-HEUR-001",
        target: "TDM-HEUR-001",
        type: "ENABLES",
        description: "Self-reference",
      },
    ]);
    const mock = new MockLLMProvider(response);
    const portrait = makePortrait();
    const relations = await detectRelations(mock, portrait);

    expect(relations).toHaveLength(0);
  });

  it("deduplicates against existing relations", async () => {
    const response = JSON.stringify([
      {
        source: "TDM-HEUR-001",
        target: "TDM-STRY-001",
        type: "LEARNED_FROM",
        description: "Duplicate relation",
      },
    ]);
    const mock = new MockLLMProvider(response);
    const portrait = makePortrait({
      relations: [
        {
          source: "TDM-HEUR-001" as ChunkId,
          target: "TDM-STRY-001" as ChunkId,
          type: "LEARNED_FROM",
          description: "Already exists",
        },
      ],
    });
    const relations = await detectRelations(mock, portrait);

    expect(relations).toHaveLength(0);
  });

  it("filters out invalid relation types", async () => {
    const response = JSON.stringify([
      {
        source: "TDM-HEUR-001",
        target: "TDM-STRY-001",
        type: "INVALID_TYPE",
        description: "Invalid type",
      },
    ]);
    const mock = new MockLLMProvider(response);
    const portrait = makePortrait();
    const relations = await detectRelations(mock, portrait);

    expect(relations).toHaveLength(0);
  });

  it("returns empty array for single-chunk portrait", async () => {
    const mock = new MockLLMProvider("[]");
    const portrait = makePortrait({
      chunks: [makePortrait().chunks[0]],
      metadata: { completeness_score: 0, chunk_count: 1, relation_count: 0, cluster_coverage: {} },
    });
    const relations = await detectRelations(mock, portrait);

    expect(relations).toHaveLength(0);
  });
});

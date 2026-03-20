import { describe, it, expect } from "vitest";
import type { ChunkId, PortraitJSON } from "@athanor/core";
import { buildPortraitBriefForInterview } from "./portrait-brief.js";

function minimalPortrait(): PortraitJSON {
  return {
    version: "1.0.0-draft",
    subject: { name: "Alex", id: "alex" },
    created_at: new Date().toISOString(),
    chunks: [
      {
        chunk_id: "X-HEUR-001" as ChunkId,
        author: "Alex",
        cluster: "technical-decision-making",
        type: "heuristic",
        uniqueness: "CRITICAL",
        source: "interview",
        confidence: 0.9,
        context_tags: [],
        linked_chunks: [],
        content: "Prefer boring tech when stakes are high.",
      },
      {
        chunk_id: "X-FACT-001" as ChunkId,
        author: "Alex",
        cluster: "technical-decision-making",
        type: "fact",
        uniqueness: "HIGH",
        source: "document",
        confidence: 0.8,
        context_tags: [],
        linked_chunks: [],
        content: "The team runs on a single region in prod.",
      },
    ],
    relations: [
      {
        source: "X-HEUR-001" as ChunkId,
        target: "X-FACT-001" as ChunkId,
        type: "ENABLES",
        description: "Boring stack fits single-region constraint",
      },
    ],
    metadata: {
      completeness_score: 0.2,
      chunk_count: 2,
      relation_count: 1,
      cluster_coverage: { "technical-decision-making": 2 },
    },
  };
}

describe("buildPortraitBriefForInterview", () => {
  it("includes subject, counts, cluster coverage, and truncated chunk lines", () => {
    const brief = buildPortraitBriefForInterview(minimalPortrait());
    expect(brief).toContain("Subject: Alex");
    expect(brief).toContain("2 chunks");
    expect(brief).toContain("technical-decision-making");
    expect(brief).toContain("heuristic:1");
    expect(brief).toContain("Prefer boring tech");
    expect(brief).toContain("ENABLES");
  });
});

import { describe, it, expect } from "vitest";
import { Extractor } from "./index.js";
import type { LLMProvider } from "./provider.js";
import type { PortraitJSON } from "@athanor/core";

/**
 * A mock provider that returns different responses based on the system prompt content.
 * This simulates the full extraction pipeline with deterministic responses.
 */
class PipelineMockProvider implements LLMProvider {
  async complete(system: string, user: string): Promise<string> {
    // Chunking prompt
    if (system.includes("Chunk Extraction")) {
      return JSON.stringify([
        {
          cluster: "technical-decision-making",
          type: "heuristic",
          uniqueness: "CRITICAL",
          source: "interview",
          confidence: 0.92,
          context_tags: ["architecture", "risk"],
          content:
            "When evaluating any new framework, the subject always checks the bus factor — the number of active maintainers and recent commit frequency.",
        },
        {
          cluster: "team-leadership",
          type: "belief",
          uniqueness: "HIGH",
          source: "interview",
          confidence: 0.85,
          context_tags: ["autonomy", "trust"],
          content:
            "The subject believes engineering teams should own their decisions end-to-end, and refuses to be a bottleneck for technical choices within a team's domain.",
        },
      ]);
    }

    // Classification prompt
    if (system.includes("Classification Refinement")) {
      return JSON.stringify([
        {
          index: 0,
          cluster: "technical-decision-making",
          type: "heuristic",
          uniqueness: "CRITICAL",
          confidence: 0.92,
          duplicate: false,
          duplicate_of: null,
          notes: "Novel heuristic, no existing match.",
        },
        {
          index: 1,
          cluster: "team-leadership",
          type: "belief",
          uniqueness: "HIGH",
          confidence: 0.85,
          duplicate: false,
          duplicate_of: null,
          notes: "Novel belief about team autonomy.",
        },
      ]);
    }

    // Linking prompt
    if (system.includes("Relation Detection")) {
      return JSON.stringify([
        {
          source: "TDM-HEUR-001",
          target: "LDR-BLEF-001",
          type: "ENABLES",
          description: "Risk assessment enables team autonomy by reducing uncertainty.",
        },
      ]);
    }

    // Meta-analysis prompt
    if (system.includes("Meta-Chunk Generation")) {
      return JSON.stringify([
        {
          cluster: "meta-patterns",
          type: "meta",
          uniqueness: "CRITICAL",
          source: "inferred",
          confidence: 0.75,
          context_tags: ["decision-making", "leadership", "risk"],
          content:
            "The subject's approach reveals a 'principled pragmatism' pattern: strong opinions are held but systematically paired with escape hatches, reflecting a deep belief that rigidity without reversibility is an existential risk.",
        },
      ]);
    }

    // Clone synthesis prompt
    if (system.includes("Clone System Prompt")) {
      return [
        "You are a clone of the subject, a technical leader who values team autonomy",
        "and rigorous dependency evaluation. You always check the bus factor before",
        "adopting new technology.",
      ].join(" ");
    }

    return "[]";
  }
}

const SAMPLE_TRANSCRIPT = `
Interviewer: How do you evaluate new technologies?

Subject: The first thing I always check is the bus factor. How many active
maintainers does this project have? What does the commit graph look like
over the last 6 months? I learned this the hard way in 2020 when we
depended on a library maintained by a single person who just vanished.
That cost us three weeks of emergency work.

Interviewer: How do you handle decision-making in your teams?

Subject: I believe teams should own their decisions. I'm not going to be
a bottleneck. If a team has the context and the expertise, they should
make the call. My job is to make sure they have the right frameworks
for thinking, not to make every decision myself.
`;

describe("Extractor pipeline (mocked)", () => {
  // We need to inject the mock provider. Since the constructor creates the provider,
  // we'll test the individual functions directly instead.

  it("extracts chunks from a transcript", async () => {
    // Using the pipeline mock through the chunker directly
    const { extractChunks } = await import("./chunker.js");
    const provider = new PipelineMockProvider();
    const chunks = await extractChunks(provider, SAMPLE_TRANSCRIPT, {
      subjectName: "Test Subject",
    });

    expect(chunks).toHaveLength(2);
    expect(chunks[0].type).toBe("heuristic");
    expect(chunks[1].type).toBe("belief");
  });

  it("classifies chunks against an existing portrait", async () => {
    const { classifyChunks } = await import("./classifier.js");
    const provider = new PipelineMockProvider();

    const candidates = [
      {
        cluster: "technical-decision-making",
        type: "heuristic" as const,
        uniqueness: "CRITICAL" as const,
        source: "interview" as const,
        confidence: 0.92,
        context_tags: ["architecture"],
        content: "Bus factor heuristic content here that is long enough.",
      },
    ];

    const emptyPortrait: PortraitJSON = {
      version: "1.0.0-draft",
      subject: { name: "Test", id: "test" },
      created_at: new Date().toISOString(),
      chunks: [],
      relations: [],
      metadata: { completeness_score: 0, chunk_count: 0, relation_count: 0, cluster_coverage: {} },
    };

    const classified = await classifyChunks(provider, candidates, emptyPortrait);

    expect(classified).toHaveLength(1);
    expect(classified[0].duplicate).toBe(false);
  });

  it("generates meta-chunks from portrait analysis", async () => {
    const { generateMetaChunks } = await import("./meta-generator.js");
    const provider = new PipelineMockProvider();

    const portrait: PortraitJSON = {
      version: "1.0.0-draft",
      subject: { name: "Test", id: "test" },
      created_at: new Date().toISOString(),
      chunks: Array.from({ length: 10 }, (_, i) => ({
        chunk_id: `TST-HEUR-${String(i + 1).padStart(3, "0")}` as any,
        author: "Test",
        cluster: i < 5 ? "technical-decision-making" : "team-leadership",
        type: "heuristic" as const,
        uniqueness: "HIGH" as const,
        source: "interview" as const,
        confidence: 0.8,
        context_tags: ["test"],
        linked_chunks: [],
        content: `Test chunk number ${i + 1} with enough content to be valid for testing purposes.`,
      })),
      relations: [],
      metadata: {
        completeness_score: 0.5,
        chunk_count: 10,
        relation_count: 0,
        cluster_coverage: { "technical-decision-making": 5, "team-leadership": 5 },
      },
    };

    const metaChunks = await generateMetaChunks(provider, portrait);

    expect(metaChunks).toHaveLength(1);
    expect(metaChunks[0].cluster).toBe("meta-patterns");
    expect(metaChunks[0].type).toBe("meta");
    expect(metaChunks[0].source).toBe("inferred");
  });

  it("generates a clone system prompt", async () => {
    const { generateClonePrompt } = await import("./clone-generator.js");
    const provider = new PipelineMockProvider();

    const portrait: PortraitJSON = {
      version: "1.0.0-draft",
      subject: { name: "Test Subject", id: "test-subject" },
      created_at: new Date().toISOString(),
      chunks: [
        {
          chunk_id: "TDM-HEUR-001" as any,
          author: "Test Subject",
          cluster: "technical-decision-making",
          type: "heuristic",
          uniqueness: "CRITICAL",
          source: "interview",
          confidence: 0.92,
          context_tags: [],
          linked_chunks: [],
          content: "Always check the bus factor before adopting a new technology.",
        },
      ],
      relations: [],
      metadata: {
        completeness_score: 0.3,
        chunk_count: 1,
        relation_count: 0,
        cluster_coverage: { "technical-decision-making": 1 },
      },
    };

    const prompt = await generateClonePrompt(provider, portrait);

    expect(prompt).toContain("clone");
    expect(prompt).toContain("bus factor");
    expect(prompt.length).toBeGreaterThan(50);
  });

  it("embeds chunks with mock embedding provider", async () => {
    const { embedChunks } = await import("./embedder.js");
    const { MockEmbeddingProvider } = await import("./provider.test.js");

    const provider = new MockEmbeddingProvider(128);
    const portrait: PortraitJSON = {
      version: "1.0.0-draft",
      subject: { name: "Test", id: "test" },
      created_at: new Date().toISOString(),
      chunks: [
        {
          chunk_id: "TDM-HEUR-001" as any,
          author: "Test",
          cluster: "tdm",
          type: "heuristic",
          uniqueness: "HIGH",
          source: "interview",
          confidence: 0.9,
          context_tags: [],
          linked_chunks: [],
          content: "Test chunk content for embedding generation purposes.",
        },
        {
          chunk_id: "TDM-HEUR-002" as any,
          author: "Test",
          cluster: "tdm",
          type: "heuristic",
          uniqueness: "HIGH",
          source: "interview",
          confidence: 0.85,
          context_tags: [],
          linked_chunks: [],
          content: "Another test chunk for batch embedding validation.",
        },
      ],
      relations: [],
      metadata: { completeness_score: 0, chunk_count: 2, relation_count: 0, cluster_coverage: {} },
    };

    const progress: { current: number; total: number }[] = [];
    const results = await embedChunks(provider, portrait, (p) => {
      progress.push({ current: p.current, total: p.total });
    });

    expect(results).toHaveLength(2);
    expect(results[0].chunk_id).toBe("TDM-HEUR-001");
    expect(results[0].embedding).toHaveLength(128);
    expect(results[1].embedding).toHaveLength(128);

    // Progress tracking
    expect(progress).toHaveLength(2);
    expect(progress[0]).toEqual({ current: 1, total: 2 });
    expect(progress[1]).toEqual({ current: 2, total: 2 });
  });
});

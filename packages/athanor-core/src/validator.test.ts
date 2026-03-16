import { describe, it, expect } from "vitest";
import { validateChunk, validateRelation, validatePortrait } from "./validator.js";
import exampleChunks from "../../../schema/examples/chunk-examples.json";
import exampleRelations from "../../../schema/examples/relation-examples.json";

describe("validateChunk", () => {
  it("accepts valid chunks from examples", () => {
    for (const chunk of exampleChunks) {
      const result = validateChunk(chunk);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    }
  });

  it("rejects missing required fields", () => {
    const result = validateChunk({ chunk_id: "TDM-HEUR-001" });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects invalid chunk_id pattern", () => {
    const result = validateChunk({
      ...exampleChunks[0],
      chunk_id: "invalid-id",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("chunk_id"))).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = validateChunk({
      ...exampleChunks[0],
      type: "nonexistent",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid uniqueness", () => {
    const result = validateChunk({
      ...exampleChunks[0],
      uniqueness: "LOW",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid source", () => {
    const result = validateChunk({
      ...exampleChunks[0],
      source: "telepathy",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects confidence out of range", () => {
    const tooHigh = validateChunk({ ...exampleChunks[0], confidence: 1.5 });
    expect(tooHigh.valid).toBe(false);
    const tooLow = validateChunk({ ...exampleChunks[0], confidence: -0.1 });
    expect(tooLow.valid).toBe(false);
  });

  it("rejects content shorter than 20 chars", () => {
    const result = validateChunk({
      ...exampleChunks[0],
      content: "Too short",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects additional properties", () => {
    const result = validateChunk({
      ...exampleChunks[0],
      extra_field: "not allowed",
    });
    expect(result.valid).toBe(false);
  });

  it("warns on very low confidence", () => {
    const chunk = { ...exampleChunks[0], confidence: 0.2 };
    const result = validateChunk(chunk);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("low confidence"))).toBe(true);
  });

  it("rejects empty string for author", () => {
    const result = validateChunk({ ...exampleChunks[0], author: "" });
    expect(result.valid).toBe(false);
  });

  it("accepts edge confidence values 0.0 and 1.0", () => {
    expect(validateChunk({ ...exampleChunks[0], confidence: 0.0 }).valid).toBe(true);
    expect(validateChunk({ ...exampleChunks[0], confidence: 1.0 }).valid).toBe(true);
  });

  it("rejects invalid linked_chunks pattern", () => {
    const result = validateChunk({
      ...exampleChunks[0],
      linked_chunks: ["bad-id"],
    });
    expect(result.valid).toBe(false);
  });
});

describe("validateRelation", () => {
  it("accepts valid relations from examples", () => {
    for (const rel of exampleRelations) {
      const result = validateRelation(rel);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    }
  });

  it("rejects missing required fields", () => {
    const result = validateRelation({ source: "TDM-HEUR-001" });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid relation type", () => {
    const result = validateRelation({
      ...exampleRelations[0],
      type: "UNKNOWN_TYPE",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid source chunk_id pattern", () => {
    const result = validateRelation({
      ...exampleRelations[0],
      source: "bad",
    });
    expect(result.valid).toBe(false);
  });

  it("accepts relation without description", () => {
    const { description: _, ...rel } = exampleRelations[0];
    const result = validateRelation(rel);
    expect(result.valid).toBe(true);
  });
});

describe("validatePortrait", () => {
  function makePortrait(
    overrides: Record<string, unknown> = {},
    chunkOverrides?: unknown[],
    relationOverrides?: unknown[],
  ) {
    return {
      version: "1.0.0-draft",
      subject: { name: "Test Subject", id: "test-001" },
      created_at: "2024-01-15T10:30:00Z",
      chunks: chunkOverrides ?? exampleChunks,
      relations: relationOverrides ?? exampleRelations,
      metadata: {
        completeness_score: 0.5,
        chunk_count: (chunkOverrides ?? exampleChunks).length,
        relation_count: (relationOverrides ?? exampleRelations).length,
        cluster_coverage: { "technical-decision-making": 5 },
      },
      ...overrides,
    };
  }

  it("accepts a valid portrait", () => {
    const result = validatePortrait(makePortrait());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects missing version", () => {
    const { version: _, ...rest } = makePortrait();
    const result = validatePortrait(rest);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid version format", () => {
    const result = validatePortrait(makePortrait({ version: "bad" }));
    expect(result.valid).toBe(false);
  });

  it("warns on low CRITICAL ratio", () => {
    // Only 1 CRITICAL out of 4 = 25% < 30%
    const chunks = [
      { ...exampleChunks[0], uniqueness: "CRITICAL" },
      { ...exampleChunks[1], chunk_id: "TDM-HEUR-099", uniqueness: "HIGH" },
      { ...exampleChunks[2], chunk_id: "TDM-ANTI-099", uniqueness: "HIGH" },
      { ...exampleChunks[3], chunk_id: "LDR-ANTI-099", uniqueness: "MEDIUM" },
    ];
    const result = validatePortrait(makePortrait({}, chunks, []));
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("Low CRITICAL ratio"))).toBe(true);
  });

  it("warns on missing recommended clusters", () => {
    const result = validatePortrait(makePortrait());
    expect(result.valid).toBe(true);
    // The example data doesn't cover "personal-values"
    expect(result.warnings.some((w) => w.includes("Missing recommended cluster"))).toBe(true);
  });

  it("warns on orphan chunks", () => {
    // Add a chunk with no relations
    const orphan = {
      ...exampleChunks[0],
      chunk_id: "XX-HEUR-999",
      cluster: "orphan-cluster",
    };
    const chunks = [...exampleChunks, orphan];
    const result = validatePortrait(makePortrait({}, chunks));
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("Orphan chunk"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("XX-HEUR-999"))).toBe(true);
  });

  it("warns when all chunks have same uniqueness", () => {
    const chunks = exampleChunks.map((c) => ({
      ...c,
      uniqueness: "HIGH",
    }));
    const result = validatePortrait(makePortrait({}, chunks));
    expect(result.valid).toBe(true);
    expect(
      result.warnings.some((w) => w.includes("same uniqueness level")),
    ).toBe(true);
  });

  it("rejects invalid subject", () => {
    const result = validatePortrait(
      makePortrait({ subject: { name: "" } }),
    );
    expect(result.valid).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { extractChunks } from "./chunker.js";
import { MockLLMProvider } from "./provider.test.js";

const VALID_CHUNKS_RESPONSE = JSON.stringify([
  {
    cluster: "technical-decision-making",
    type: "heuristic",
    uniqueness: "CRITICAL",
    source: "interview",
    confidence: 0.92,
    context_tags: ["dependency-management", "risk-assessment"],
    content:
      "When evaluating any new framework or library, Jan always checks the bus factor first — how many active maintainers exist and what the commit frequency looks like over the past 6 months.",
  },
  {
    cluster: "team-leadership",
    type: "belief",
    uniqueness: "HIGH",
    source: "meeting",
    confidence: 0.85,
    context_tags: ["autonomy", "delegation"],
    content:
      "Jan believes that engineering teams should own their decisions end-to-end. He explicitly refuses to be a bottleneck for technical choices that fall within a team's domain.",
  },
  {
    cluster: "emotional-landscape",
    type: "emotion",
    uniqueness: "MEDIUM",
    source: "observation",
    confidence: 0.7,
    context_tags: ["frustration", "code-quality"],
    content:
      "Jan becomes visibly frustrated when confronted with copy-pasted code across services, often calling it a symptom of lazy architecture rather than a shortcut.",
  },
]);

const INVALID_CHUNKS_RESPONSE = JSON.stringify([
  {
    cluster: "test",
    type: "heuristic",
    uniqueness: "CRITICAL",
    source: "interview",
    confidence: 0.9,
    context_tags: [],
    content: "Too short",
  },
  {
    cluster: "",
    type: "heuristic",
    uniqueness: "CRITICAL",
    source: "interview",
    confidence: 0.9,
    context_tags: [],
    content: "This chunk has an empty cluster which should be rejected by validation.",
  },
  {
    cluster: "valid-cluster",
    type: "invalid-type",
    uniqueness: "CRITICAL",
    source: "interview",
    confidence: 0.9,
    context_tags: [],
    content: "This chunk has an invalid type which should be rejected by validation.",
  },
]);

describe("extractChunks", () => {
  it("extracts valid chunks from LLM response", async () => {
    const mock = new MockLLMProvider(VALID_CHUNKS_RESPONSE);
    const chunks = await extractChunks(mock, "sample transcript text");

    expect(chunks).toHaveLength(3);
    expect(chunks[0].cluster).toBe("technical-decision-making");
    expect(chunks[0].type).toBe("heuristic");
    expect(chunks[0].uniqueness).toBe("CRITICAL");
    expect(chunks[0].confidence).toBe(0.92);
    expect(chunks[0].context_tags).toEqual(["dependency-management", "risk-assessment"]);
    expect(chunks[0].content).toContain("bus factor");
  });

  it("filters out invalid chunks", async () => {
    const mock = new MockLLMProvider(INVALID_CHUNKS_RESPONSE);
    const chunks = await extractChunks(mock, "sample text");

    // "Too short" (< 20 chars) should be filtered
    // empty cluster should be filtered
    // invalid type should be filtered
    expect(chunks).toHaveLength(0);
  });

  it("handles markdown-fenced JSON response", async () => {
    const fenced = "```json\n" + VALID_CHUNKS_RESPONSE + "\n```";
    const mock = new MockLLMProvider(fenced);
    const chunks = await extractChunks(mock, "sample text");

    expect(chunks).toHaveLength(3);
  });

  it("handles empty response gracefully", async () => {
    const mock = new MockLLMProvider("");
    const chunks = await extractChunks(mock, "sample text");

    expect(chunks).toHaveLength(0);
  });

  it("handles non-JSON response gracefully", async () => {
    const mock = new MockLLMProvider("I cannot extract any chunks from this text.");
    const chunks = await extractChunks(mock, "sample text");

    expect(chunks).toHaveLength(0);
  });

  it("passes subject name and source options to the prompt", async () => {
    const mock = new MockLLMProvider("[]");
    await extractChunks(mock, "text", {
      subjectName: "Jan Kowalski",
      source: "interview",
      language: "pl",
    });

    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0].user).toContain("Jan Kowalski");
    expect(mock.calls[0].user).toContain("interview");
    expect(mock.calls[0].user).toContain("pl");
  });

  it("fixes missing context_tags and out-of-range confidence", async () => {
    const response = JSON.stringify([
      {
        cluster: "test-cluster",
        type: "belief",
        uniqueness: "HIGH",
        source: "interview",
        confidence: 1.5,
        content: "This chunk has out-of-range confidence that should be clamped to 0.7.",
      },
    ]);
    const mock = new MockLLMProvider(response);
    const chunks = await extractChunks(mock, "text");

    expect(chunks).toHaveLength(1);
    expect(chunks[0].confidence).toBe(0.7);
    expect(chunks[0].context_tags).toEqual([]);
  });
});

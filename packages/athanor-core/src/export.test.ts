import { describe, it, expect } from "vitest";
import { Portrait } from "./portrait.js";
import { toJSON, toCypher, toMarkdown, toObsidian } from "./export.js";


function buildTestPortrait(): Portrait {
  const p = new Portrait({ name: "Jan Kowalski", id: "jan-001" });

  const c1 = p.addChunk({
    cluster: "technical-decision-making",
    type: "heuristic",
    uniqueness: "CRITICAL",
    source: "interview",
    confidence: 0.95,
    context_tags: ["architecture"],
    content:
      "When evaluating a new framework, always check the bus factor — reject if below 3.",
  });

  const c2 = p.addChunk({
    cluster: "technical-decision-making",
    type: "anti-pattern",
    uniqueness: "HIGH",
    source: "code",
    confidence: 0.9,
    content:
      "Never use ORM-generated queries for reporting workloads — use raw SQL instead.",
  });

  const c3 = p.addChunk({
    cluster: "emotional-landscape",
    type: "emotion",
    uniqueness: "HIGH",
    source: "observation",
    confidence: 0.82,
    content:
      "Exhibits controlled anger when outages are caused by known-but-unaddressed issues.",
  });

  p.addRelation({
    source: c1.chunk_id,
    target: c2.chunk_id,
    type: "ENABLES",
    description: "Bus factor heuristic enables query scrutiny.",
  });

  p.addRelation({
    source: c3.chunk_id,
    target: c2.chunk_id,
    type: "EXPRESSED_THROUGH",
  });

  return p;
}

describe("toJSON", () => {
  it("produces valid JSON string", () => {
    const p = buildTestPortrait();
    const json = toJSON(p);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe("1.0.0-draft");
    expect(parsed.subject.name).toBe("Jan Kowalski");
    expect(parsed.chunks).toHaveLength(3);
    expect(parsed.relations).toHaveLength(2);
  });

  it("is pretty-printed with 2-space indent", () => {
    const json = toJSON(buildTestPortrait());
    expect(json).toContain("\n  ");
  });
});

describe("toCypher", () => {
  it("generates CREATE statements for chunks", () => {
    const cypher = toCypher(buildTestPortrait());
    expect(cypher).toContain("CREATE (:Chunk {");
    expect(cypher).toContain("chunk_id:");
  });

  it("generates MATCH/CREATE for relations", () => {
    const cypher = toCypher(buildTestPortrait());
    expect(cypher).toContain("MATCH (a:Chunk");
    expect(cypher).toContain("CREATE (a)-[:ENABLES");
    expect(cypher).toContain("CREATE (a)-[:EXPRESSED_THROUGH");
  });

  it("includes description in relation props when present", () => {
    const cypher = toCypher(buildTestPortrait());
    expect(cypher).toContain("Bus factor heuristic enables query scrutiny");
  });

  it("includes header comments", () => {
    const cypher = toCypher(buildTestPortrait());
    expect(cypher).toContain("// Athanor Portrait Cypher Export");
    expect(cypher).toContain("Jan Kowalski");
  });

  it("escapes single quotes in content", () => {
    const p = new Portrait({ name: "Test", id: "test-001" });
    p.addChunk({
      cluster: "technical-decision-making",
      type: "heuristic",
      uniqueness: "CRITICAL",
      source: "interview",
      confidence: 0.9,
      content: "He said 'never do this' in the meeting about O'Brien's code.",
    });
    const cypher = toCypher(p);
    expect(cypher).toContain("\\'never do this\\'");
    expect(cypher).toContain("O\\'Brien");
  });
});

describe("toMarkdown", () => {
  it("generates portrait header", () => {
    const md = toMarkdown(buildTestPortrait());
    expect(md).toContain("# Portrait: Jan Kowalski");
    expect(md).toContain("**Subject ID:** jan-001");
    expect(md).toContain("**Protocol Version:** 1.0.0-draft");
  });

  it("groups chunks by cluster", () => {
    const md = toMarkdown(buildTestPortrait());
    expect(md).toContain("## Technical Decision Making");
    expect(md).toContain("## Emotional Landscape");
  });

  it("includes chunk details", () => {
    const md = toMarkdown(buildTestPortrait());
    expect(md).toContain("[HEUR]");
    expect(md).toContain("CRITICAL");
    expect(md).toContain("bus factor");
  });

  it("lists relations for each chunk", () => {
    const md = toMarkdown(buildTestPortrait());
    expect(md).toContain("**Relations:**");
    expect(md).toContain("ENABLES");
  });

  it("includes context tags", () => {
    const md = toMarkdown(buildTestPortrait());
    expect(md).toContain("*Tags: architecture*");
  });
});

describe("toObsidian", () => {
  it("generates index file", () => {
    const files = toObsidian(buildTestPortrait());
    expect(files.has("Index.md")).toBe(true);
    const index = files.get("Index.md")!;
    expect(index).toContain("# Jan Kowalski");
    expect(index).toContain("[[Technical Decision Making]]");
  });

  it("generates one file per chunk", () => {
    const files = toObsidian(buildTestPortrait());
    // 3 chunks + 1 index
    expect(files.size).toBe(4);
  });

  it("chunk files have YAML frontmatter", () => {
    const files = toObsidian(buildTestPortrait());
    // Find a chunk file (not Index.md)
    for (const [name, content] of files) {
      if (name === "Index.md") continue;
      expect(content).toContain("---");
      expect(content).toContain("chunk_id:");
      expect(content).toContain("type:");
      expect(content).toContain("uniqueness:");
      break;
    }
  });

  it("chunk files link to related chunks with [[]]", () => {
    const files = toObsidian(buildTestPortrait());
    let foundLink = false;
    for (const [name, content] of files) {
      if (name === "Index.md") continue;
      if (content.includes("[[") && content.includes("ENABLES")) {
        foundLink = true;
        break;
      }
    }
    expect(foundLink).toBe(true);
  });
});

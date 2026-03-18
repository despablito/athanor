import { describe, it, expect, beforeAll } from "vitest";
import { createApp } from "./server.js";
import { PortraitStore } from "./portrait-store.js";
import { CloneEngine } from "./clone.js";
import type { PortraitJSON, Chunk, Relation } from "@athanor/core";
import type { LLMProvider } from "@athanor/extractor";

// ─── Mock LLM Provider ────────────────────────────────────────────────────────

class MockLLMProvider implements LLMProvider {
  async complete(_system: string, _user: string): Promise<string> {
    return "Look, the most important thing with senior hires is to check the bus factor. I learned that the hard way in 2020.";
  }
}

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeChunk(id: string, cluster: string, type: string, uniqueness: string, content: string): Chunk {
  return {
    chunk_id: id,
    author: "Jan",
    cluster,
    type,
    uniqueness,
    source: "interview",
    confidence: 0.9,
    context_tags: ["test"],
    linked_chunks: [],
    content,
  } as unknown as Chunk;
}

const TEST_PORTRAIT: PortraitJSON = {
  version: "1.0.0-draft",
  subject: { name: "Jan", id: "jan" },
  created_at: new Date().toISOString(),
  chunks: [
    makeChunk("TDM-HEUR-001", "technical-decision-making", "heuristic", "CRITICAL",
      "Jan always checks the bus factor when evaluating new frameworks and dependencies"),
    makeChunk("TDM-STRY-001", "technical-decision-making", "story", "HIGH",
      "In 2020 a critical dependency had a single maintainer who disappeared suddenly"),
    makeChunk("LDR-BLEF-001", "team-leadership", "belief", "HIGH",
      "Engineering teams should own their decisions end-to-end without bottlenecks"),
    makeChunk("LDR-STYL-001", "team-leadership", "style", "MEDIUM",
      "Jan communicates directly using sailing metaphors and technical precision"),
    makeChunk("EML-EMOT-001", "emotional-landscape", "emotion", "HIGH",
      "Jan becomes frustrated when confronted with copy-pasted code across services"),
  ],
  relations: [
    { source: "TDM-HEUR-001", target: "TDM-STRY-001", type: "LEARNED_FROM", description: "Bus factor heuristic from incident" } as unknown as Relation,
  ],
  metadata: {
    completeness_score: 0.5,
    chunk_count: 5,
    relation_count: 1,
    cluster_coverage: { "technical-decision-making": 2, "team-leadership": 2, "emotional-landscape": 1 },
  },
};

// ─── Setup ─────────────────────────────────────────────────────────────────────

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  const store = new PortraitStore();
  store.loadFromJSON(TEST_PORTRAIT);

  // We create a CloneEngine but inject a mock LLM provider
  const engine = new CloneEngine(store, {
    provider: { provider: "ollama" }, // won't actually be used
    ragConfig: { topK: 5, topN: 10, contextBudgetTokens: 4000 },
  });

  // Override the engine's internal LLM with mock
  (engine as unknown as { llm: LLMProvider }).llm = new MockLLMProvider();

  app = createApp({
    store,
    engine,
    config: {
      port: 3000,
      databaseUrl: null,
      llmProvider: "ollama",
      ollamaBaseUrl: "http://localhost:11434",
      portraitPath: null,
      portraitId: null,
      vectorTopK: 5,
      rerankTopN: 10,
      contextBudgetTokens: 4000,
    },
  });
});

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /", () => {
  it("returns health status", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.portraits).toBe(1);
  });
});

describe("GET /api/portraits", () => {
  it("lists loaded portraits", async () => {
    const res = await app.request("/api/portraits");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.portraits).toHaveLength(1);
    expect(body.portraits[0].id).toBe("jan");
    expect(body.portraits[0].name).toBe("Jan");
  });
});

describe("GET /api/portraits/:id", () => {
  it("returns portrait by id", async () => {
    const res = await app.request("/api/portraits/jan");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subject.name).toBe("Jan");
    expect(body.chunks).toHaveLength(5);
  });

  it("returns 404 for missing portrait", async () => {
    const res = await app.request("/api/portraits/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/portraits/:id/stats", () => {
  it("returns portrait statistics", async () => {
    const res = await app.request("/api/portraits/jan/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.chunk_count).toBe(5);
    expect(body.relation_count).toBe(1);
    expect(body.types.heuristic).toBe(1);
    expect(body.types.story).toBe(1);
    expect(body.uniqueness.CRITICAL).toBe(1);
    expect(body.avg_confidence).toBeGreaterThan(0);
  });
});

describe("GET /api/portraits/:id/chunks", () => {
  it("returns all chunks", async () => {
    const res = await app.request("/api/portraits/jan/chunks");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.chunks).toHaveLength(5);
    expect(body.total).toBe(5);
  });

  it("filters by cluster", async () => {
    const res = await app.request("/api/portraits/jan/chunks?cluster=team-leadership");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.chunks).toHaveLength(2);
    for (const c of body.chunks) {
      expect(c.cluster).toBe("team-leadership");
    }
  });

  it("filters by type", async () => {
    const res = await app.request("/api/portraits/jan/chunks?type=heuristic");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.chunks).toHaveLength(1);
    expect(body.chunks[0].type).toBe("heuristic");
  });

  it("filters by search term", async () => {
    const res = await app.request("/api/portraits/jan/chunks?search=bus+factor");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.chunks.length).toBeGreaterThan(0);
    expect(body.chunks[0].content).toContain("bus factor");
  });

  it("limits results", async () => {
    const res = await app.request("/api/portraits/jan/chunks?limit=2");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.chunks).toHaveLength(2);
  });
});

describe("GET /api/portraits/:id/chunks/:chunkId", () => {
  it("returns specific chunk with relations", async () => {
    const res = await app.request("/api/portraits/jan/chunks/TDM-HEUR-001");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.chunk.chunk_id).toBe("TDM-HEUR-001");
    expect(body.relations.outgoing).toHaveLength(1);
    expect(body.relations.outgoing[0].type).toBe("LEARNED_FROM");
  });

  it("returns 404 for missing chunk", async () => {
    const res = await app.request("/api/portraits/jan/chunks/NONEXISTENT-001");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/clone/:portraitId/chat", () => {
  it("returns a chat response with sources and metadata", async () => {
    const res = await app.request("/api/clone/jan/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "How do you evaluate new frameworks?" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    // Response structure
    expect(body.response).toBeTruthy();
    expect(body.response).toContain("bus factor");

    // Sources
    expect(Array.isArray(body.sources)).toBe(true);
    expect(body.sources.length).toBeGreaterThan(0);
    for (const src of body.sources) {
      expect(src.chunk_id).toBeTruthy();
      expect(typeof src.relevance).toBe("number");
      expect(src.type).toBeTruthy();
      expect(src.cluster).toBeTruthy();
    }

    // Confidence
    expect(typeof body.confidence).toBe("number");
    expect(body.confidence).toBeGreaterThan(0);
    expect(body.confidence).toBeLessThanOrEqual(1);

    // Meta
    expect(body.meta).toBeDefined();
    expect(Array.isArray(body.meta.identity_signals)).toBe(true);
    expect(typeof body.meta.emotion_tone).toBe("string");
    expect(typeof body.meta.chunks_retrieved).toBe("number");
    expect(typeof body.meta.chunks_used).toBe("number");
  });

  it("returns 400 for missing message", async () => {
    const res = await app.request("/api/clone/jan/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown portrait", async () => {
    const res = await app.request("/api/clone/nonexistent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello" }),
    });
    expect(res.status).toBe(404);
  });
});

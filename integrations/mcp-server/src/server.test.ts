import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "./server.js";
import type { McpServerConfig } from "./config.js";
import type { PortraitJSON, Chunk, Relation } from "@athanor/core";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<McpServerConfig> = {}): McpServerConfig {
  return {
    transport: "stdio",
    port: 3001,
    portraitPath: null,
    databaseUrl: null,
    llmProvider: "ollama",
    ollamaBaseUrl: "http://localhost:11434",
    vectorTopK: 10,
    rerankTopN: 15,
    contextBudgetTokens: 4000,
    ...overrides,
  };
}

function makeChunk(
  id: string,
  cluster: string,
  type: string,
  uniqueness: "CRITICAL" | "HIGH" | "MEDIUM",
  content: string,
  confidence = 0.9,
  tags: string[] = [],
): Chunk {
  return {
    chunk_id: id,
    author: "Test Subject",
    cluster,
    type,
    uniqueness,
    source: "interview",
    confidence,
    context_tags: tags,
    linked_chunks: [],
    content,
  } as unknown as Chunk;
}

function makeRelation(source: string, target: string, type: string): Relation {
  return { source, target, type } as Relation;
}

function makePortrait(chunks: Chunk[], relations: Relation[] = []): PortraitJSON {
  const coverage: Record<string, number> = {};
  for (const c of chunks) {
    coverage[c.cluster] = (coverage[c.cluster] ?? 0) + 1;
  }
  return {
    version: "1.0.0-draft",
    subject: { name: "Test Person", id: "test-person" },
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

// ─── Helper: connect a Client to the MCP server ────────────────────────────────

async function connectClient(config: McpServerConfig = makeConfig()) {
  const { server, store, init } = createMcpServer(config);
  await init();

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client({ name: "test-client", version: "0.0.1" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { client, store };
}

// ─── Smoke tests (pre-existing) ────────────────────────────────────────────────

describe("createMcpServer", () => {
  it("creates server, store, and init function", () => {
    const { server, store, init } = createMcpServer(makeConfig());
    expect(server).toBeDefined();
    expect(store).toBeDefined();
    expect(typeof init).toBe("function");
  });

  it("init succeeds without portrait path", async () => {
    const { init } = createMcpServer(makeConfig());
    await expect(init()).resolves.toBeUndefined();
  });

  it("store is empty when no portrait loaded", async () => {
    const { store, init } = createMcpServer(makeConfig());
    await init();
    expect(store.list()).toEqual([]);
  });
});

// ─── search_athanor ────────────────────────────────────────────────────────────

describe("tool: search_athanor", () => {
  it("returns isError when no portrait is loaded", async () => {
    const { client } = await connectClient();

    const result = await client.callTool({ name: "search_athanor", arguments: { query: "test" } });

    expect(result.isError).toBe(true);
    expect((result.content as Array<{ text: string }>)[0].text).toContain("No portrait loaded");
  });

  it("returns matching chunks for a keyword query", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait([
        makeChunk("c1", "leadership", "heuristic", "HIGH", "I always write tests before shipping"),
        makeChunk("c2", "communication", "belief", "MEDIUM", "Async communication is superior"),
      ]),
    );

    const result = await client.callTool({
      name: "search_athanor",
      arguments: { query: "tests shipping" },
    });

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0]).toHaveProperty("chunk_id");
    expect(parsed[0]).toHaveProperty("score");
    expect(parsed[0]).toHaveProperty("content");
  });

  it("respects top_k limit", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait([
        makeChunk("c1", "tech", "heuristic", "HIGH", "one alpha beta"),
        makeChunk("c2", "tech", "belief", "MEDIUM", "two alpha beta"),
        makeChunk("c3", "tech", "style", "LOW" as "MEDIUM", "three alpha beta"),
      ]),
    );

    const result = await client.callTool({
      name: "search_athanor",
      arguments: { query: "alpha", top_k: 2 },
    });

    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    expect(parsed.length).toBeLessThanOrEqual(2);
  });

  it("returns empty array when no chunks match the query", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(makePortrait([makeChunk("c1", "tech", "heuristic", "HIGH", "cats and dogs")]));

    const result = await client.callTool({
      name: "search_athanor",
      arguments: { query: "zzz-no-match-xyz" },
    });

    const parsed = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    expect(parsed).toEqual([]);
  });
});

// ─── get_portrait_stats ────────────────────────────────────────────────────────

describe("tool: get_portrait_stats", () => {
  it("returns isError when no portrait is loaded", async () => {
    const { client } = await connectClient();

    const result = await client.callTool({ name: "get_portrait_stats", arguments: {} });

    expect(result.isError).toBe(true);
  });

  it("returns correct chunk and relation counts", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait(
        [
          makeChunk("c1", "tech", "heuristic", "CRITICAL", "content A"),
          makeChunk("c2", "leadership", "belief", "HIGH", "content B"),
        ],
        [makeRelation("c1", "c2", "ENABLES")],
      ),
    );

    const result = await client.callTool({ name: "get_portrait_stats", arguments: {} });

    expect(result.isError).toBeFalsy();
    const stats = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    expect(stats.chunk_count).toBe(2);
    expect(stats.relation_count).toBe(1);
  });

  it("calculates critical_ratio correctly", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait([
        makeChunk("c1", "tech", "heuristic", "CRITICAL", "critical chunk"),
        makeChunk("c2", "tech", "belief", "HIGH", "high chunk"),
        makeChunk("c3", "tech", "style", "MEDIUM", "medium chunk"),
        makeChunk("c4", "tech", "fact", "MEDIUM", "medium chunk 2"),
      ]),
    );

    const result = await client.callTool({ name: "get_portrait_stats", arguments: {} });
    const stats = JSON.parse((result.content as Array<{ text: string }>)[0].text);

    expect(stats.critical_ratio).toBeCloseTo(0.25, 2); // 1 out of 4
  });

  it("includes subject info in response", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(makePortrait([makeChunk("c1", "tech", "heuristic", "HIGH", "content")]));

    const result = await client.callTool({ name: "get_portrait_stats", arguments: {} });
    const stats = JSON.parse((result.content as Array<{ text: string }>)[0].text);

    expect(stats.subject.name).toBe("Test Person");
    expect(stats.portrait_id).toBe("test-person");
  });

  it("groups chunks by cluster and type", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait([
        makeChunk("c1", "tech", "heuristic", "HIGH", "content A"),
        makeChunk("c2", "tech", "heuristic", "HIGH", "content B"),
        makeChunk("c3", "leadership", "belief", "MEDIUM", "content C"),
      ]),
    );

    const result = await client.callTool({ name: "get_portrait_stats", arguments: {} });
    const stats = JSON.parse((result.content as Array<{ text: string }>)[0].text);

    expect(stats.clusters["tech"]).toBe(2);
    expect(stats.clusters["leadership"]).toBe(1);
    expect(stats.types["heuristic"]).toBe(2);
    expect(stats.types["belief"]).toBe(1);
  });
});

// ─── find_related_chunks ───────────────────────────────────────────────────────

describe("tool: find_related_chunks", () => {
  it("returns isError when no portrait is loaded", async () => {
    const { client } = await connectClient();

    const result = await client.callTool({
      name: "find_related_chunks",
      arguments: { chunk_id: "c1" },
    });

    expect(result.isError).toBe(true);
  });

  it("returns directly connected chunks at depth 1", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait(
        [
          makeChunk("c1", "tech", "heuristic", "HIGH", "root chunk"),
          makeChunk("c2", "tech", "belief", "HIGH", "connected chunk"),
          makeChunk("c3", "tech", "style", "MEDIUM", "unrelated chunk"),
        ],
        [makeRelation("c1", "c2", "ENABLES")],
      ),
    );

    const result = await client.callTool({
      name: "find_related_chunks",
      arguments: { chunk_id: "c1", depth: 1 },
    });

    const related = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    const ids = related.map((c: { chunk_id: string }) => c.chunk_id);

    expect(ids).toContain("c2");
    expect(ids).not.toContain("c1"); // start node excluded
    expect(ids).not.toContain("c3"); // unrelated
  });

  it("traverses bidirectionally (finds source when starting from target)", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait(
        [
          makeChunk("c1", "tech", "heuristic", "HIGH", "source chunk"),
          makeChunk("c2", "tech", "belief", "MEDIUM", "target chunk"),
        ],
        [makeRelation("c1", "c2", "ENABLES")],
      ),
    );

    const result = await client.callTool({
      name: "find_related_chunks",
      arguments: { chunk_id: "c2" }, // starting from the target side
    });

    const related = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    const ids = related.map((c: { chunk_id: string }) => c.chunk_id);

    expect(ids).toContain("c1");
  });

  it("respects relation_types filter", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait(
        [
          makeChunk("c1", "tech", "heuristic", "HIGH", "root"),
          makeChunk("c2", "tech", "belief", "HIGH", "enabled by c1"),
          makeChunk("c3", "tech", "style", "MEDIUM", "contrasts c1"),
        ],
        [
          makeRelation("c1", "c2", "ENABLES"),
          makeRelation("c1", "c3", "CONTRASTS_WITH"),
        ],
      ),
    );

    const result = await client.callTool({
      name: "find_related_chunks",
      arguments: { chunk_id: "c1", relation_types: ["ENABLES"] },
    });

    const related = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    const ids = related.map((c: { chunk_id: string }) => c.chunk_id);

    expect(ids).toContain("c2");
    expect(ids).not.toContain("c3");
  });

  it("traverses multiple hops at depth 2", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait(
        [
          makeChunk("c1", "tech", "heuristic", "HIGH", "root"),
          makeChunk("c2", "tech", "belief", "HIGH", "hop 1"),
          makeChunk("c3", "tech", "style", "MEDIUM", "hop 2"),
        ],
        [makeRelation("c1", "c2", "ENABLES"), makeRelation("c2", "c3", "ENABLES")],
      ),
    );

    const result = await client.callTool({
      name: "find_related_chunks",
      arguments: { chunk_id: "c1", depth: 2 },
    });

    const related = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    const ids = related.map((c: { chunk_id: string }) => c.chunk_id);

    expect(ids).toContain("c2");
    expect(ids).toContain("c3");
  });

  it("returns empty array for isolated chunk", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait([
        makeChunk("c1", "tech", "heuristic", "HIGH", "isolated"),
        makeChunk("c2", "tech", "belief", "MEDIUM", "also isolated"),
      ]),
    );

    const result = await client.callTool({
      name: "find_related_chunks",
      arguments: { chunk_id: "c1" },
    });

    const related = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    expect(related).toEqual([]);
  });
});

// ─── list_clusters ─────────────────────────────────────────────────────────────

describe("tool: list_clusters", () => {
  it("returns isError when no portrait is loaded", async () => {
    const { client } = await connectClient();

    const result = await client.callTool({ name: "list_clusters", arguments: {} });

    expect(result.isError).toBe(true);
  });

  it("returns all clusters with correct chunk counts", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait([
        makeChunk("c1", "tech", "heuristic", "HIGH", "a"),
        makeChunk("c2", "tech", "belief", "HIGH", "b"),
        makeChunk("c3", "leadership", "fact", "MEDIUM", "c"),
      ]),
    );

    const result = await client.callTool({ name: "list_clusters", arguments: {} });
    const clusters = JSON.parse((result.content as Array<{ text: string }>)[0].text);

    const tech = clusters.find((c: { cluster: string }) => c.cluster === "tech");
    const leadership = clusters.find((c: { cluster: string }) => c.cluster === "leadership");

    expect(tech).toBeDefined();
    expect(tech.chunk_count).toBe(2);
    expect(leadership.chunk_count).toBe(1);
  });

  it("includes all types present in each cluster", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(
      makePortrait([
        makeChunk("c1", "tech", "heuristic", "HIGH", "a"),
        makeChunk("c2", "tech", "belief", "MEDIUM", "b"),
        makeChunk("c3", "tech", "heuristic", "HIGH", "c"),
      ]),
    );

    const result = await client.callTool({ name: "list_clusters", arguments: {} });
    const clusters = JSON.parse((result.content as Array<{ text: string }>)[0].text);
    const tech = clusters.find((c: { cluster: string }) => c.cluster === "tech");

    expect(tech.types).toContain("heuristic");
    expect(tech.types).toContain("belief");
    expect(new Set(tech.types).size).toBe(tech.types.length); // no duplicates
  });

  it("returns empty array for portrait with no chunks", async () => {
    const { client, store } = await connectClient();
    store.loadFromJSON(makePortrait([]));

    const result = await client.callTool({ name: "list_clusters", arguments: {} });
    const clusters = JSON.parse((result.content as Array<{ text: string }>)[0].text);

    expect(clusters).toEqual([]);
  });
});

// ─── ask_clone ─────────────────────────────────────────────────────────────────

describe("tool: ask_clone", () => {
  it("returns isError when no portrait is loaded", async () => {
    const { client } = await connectClient();

    const result = await client.callTool({
      name: "ask_clone",
      arguments: { message: "Hello?" },
    });

    expect(result.isError).toBe(true);
  });

  it("returns isError when engine is not initialized (anthropic without API key)", async () => {
    // Anthropic SDK throws during construction when no API key is set,
    // so CloneEngine init fails silently and engine stays null.
    const { client, store } = await connectClient(
      makeConfig({ llmProvider: "anthropic", apiKey: undefined }),
    );
    store.loadFromJSON(makePortrait([makeChunk("c1", "tech", "heuristic", "HIGH", "some content")]));

    const result = await client.callTool({
      name: "ask_clone",
      arguments: { message: "What do you think about testing?" },
    });

    expect(result.isError).toBe(true);
    expect((result.content as Array<{ text: string }>)[0].text).toContain("engine not initialized");
  });
});

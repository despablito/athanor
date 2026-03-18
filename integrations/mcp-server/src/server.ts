import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  PortraitStore,
  CloneEngine,
  type RAGConfig,
} from "@athanor/clone-api";
import { asChunkId, type PortraitJSON, type Chunk, type ChunkId } from "@athanor/core";
import type { McpServerConfig } from "./config.js";

export function createMcpServer(config: McpServerConfig): {
  server: McpServer;
  store: PortraitStore;
  init: () => Promise<void>;
} {
  const store = new PortraitStore();

  const server = new McpServer(
    { name: "athanor-mcp", version: "0.0.1" },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  let engine: CloneEngine | null = null;

  const ragConfig: RAGConfig = {
    topK: config.vectorTopK,
    topN: config.rerankTopN,
    contextBudgetTokens: config.contextBudgetTokens,
  };

  // --- Tools ---

  server.tool(
    "search_athanor",
    "Search portrait chunks using text similarity. Returns ranked chunks with relevance scores.",
    {
      query: z.string().describe("Search query text"),
      portrait_id: z.string().optional().describe("Portrait ID (uses first loaded if omitted)"),
      top_k: z.number().optional().describe("Number of results to return (default: 10)"),
    },
    async (args) => {
      const portraitId = args.portrait_id ?? getDefaultPortraitId(store);
      if (!portraitId) {
        return { content: [{ type: "text", text: "No portrait loaded." }], isError: true };
      }

      const topK = args.top_k ?? config.vectorTopK;
      const results = store.searchChunks(portraitId, args.query, topK);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              results.map((r) => ({
                chunk_id: r.chunk.chunk_id,
                cluster: r.chunk.cluster,
                type: r.chunk.type,
                uniqueness: r.chunk.uniqueness,
                score: r.score,
                content: r.chunk.content,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "get_portrait_stats",
    "Get completeness statistics, chunk/relation counts, cluster distribution, and type breakdown for a portrait.",
    {
      portrait_id: z.string().optional().describe("Portrait ID (uses first loaded if omitted)"),
    },
    async (args) => {
      const portraitId = args.portrait_id ?? getDefaultPortraitId(store);
      if (!portraitId) {
        return { content: [{ type: "text", text: "No portrait loaded." }], isError: true };
      }

      const portrait = store.get(portraitId);
      if (!portrait) {
        return { content: [{ type: "text", text: `Portrait not found: ${portraitId}` }], isError: true };
      }

      const stats = computeStats(portrait);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                portrait_id: portraitId,
                subject: portrait.subject,
                ...stats,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "find_related_chunks",
    "Traverse the relation graph from a starting chunk to find connected chunks. Supports depth and relation type filtering.",
    {
      chunk_id: z.string().describe("Starting chunk ID"),
      portrait_id: z.string().optional().describe("Portrait ID (uses first loaded if omitted)"),
      depth: z.number().optional().describe("Traversal depth (default: 1)"),
      relation_types: z
        .array(z.string())
        .optional()
        .describe("Filter by relation types (e.g. INSTANTIATES, ENABLES, LEARNED_FROM)"),
    },
    async (args) => {
      const portraitId = args.portrait_id ?? getDefaultPortraitId(store);
      if (!portraitId) {
        return { content: [{ type: "text", text: "No portrait loaded." }], isError: true };
      }

      const portrait = store.get(portraitId);
      if (!portrait) {
        return { content: [{ type: "text", text: `Portrait not found: ${portraitId}` }], isError: true };
      }

      const depth = args.depth ?? 1;
      const relationTypes = args.relation_types as string[] | undefined;

      // BFS traversal through the portrait's relations
      const startId = asChunkId(args.chunk_id);
      const visited = new Set<ChunkId>();
      let frontier = new Set<ChunkId>([startId]);
      visited.add(startId);

      for (let d = 0; d < depth; d++) {
        const nextFrontier = new Set<ChunkId>();
        for (const cid of frontier) {
          for (const rel of portrait.relations) {
            if (relationTypes && !relationTypes.includes(rel.type)) continue;

            if (rel.source === cid && !visited.has(rel.target)) {
              visited.add(rel.target);
              nextFrontier.add(rel.target);
            }
            if (rel.target === cid && !visited.has(rel.source)) {
              visited.add(rel.source);
              nextFrontier.add(rel.source);
            }
          }
        }
        frontier = nextFrontier;
        if (frontier.size === 0) break;
      }

      visited.delete(startId);
      const chunkMap = new Map(portrait.chunks.map((c) => [c.chunk_id, c]));
      const related = [...visited]
        .map((id) => chunkMap.get(id))
        .filter((c): c is Chunk => c !== undefined);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              related.map((c) => ({
                chunk_id: c.chunk_id,
                cluster: c.cluster,
                type: c.type,
                uniqueness: c.uniqueness,
                content: c.content,
              })),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "ask_clone",
    "Ask a question using the full RAG pipeline (vector search + graph expansion + reranking). Returns the AI-generated response with source chunks.",
    {
      message: z.string().describe("The question or message to ask"),
      portrait_id: z.string().optional().describe("Portrait ID (uses first loaded if omitted)"),
      history: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          }),
        )
        .optional()
        .describe("Conversation history"),
    },
    async (args) => {
      const portraitId = args.portrait_id ?? getDefaultPortraitId(store);
      if (!portraitId) {
        return { content: [{ type: "text", text: "No portrait loaded." }], isError: true };
      }

      if (!engine) {
        return {
          content: [
            {
              type: "text",
              text: "Clone engine not initialized. Ensure an LLM provider is configured (LLM_PROVIDER, ANTHROPIC_API_KEY or OPENAI_API_KEY env vars).",
            },
          ],
          isError: true,
        };
      }

      try {
        const response = await engine.chat(portraitId, {
          message: args.message,
          history: args.history,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  response: response.response,
                  confidence: response.confidence,
                  sources: response.sources,
                  meta: response.meta,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "list_clusters",
    "List all clusters in a portrait with their chunk counts and types.",
    {
      portrait_id: z.string().optional().describe("Portrait ID (uses first loaded if omitted)"),
    },
    async (args) => {
      const portraitId = args.portrait_id ?? getDefaultPortraitId(store);
      if (!portraitId) {
        return { content: [{ type: "text", text: "No portrait loaded." }], isError: true };
      }

      const portrait = store.get(portraitId);
      if (!portrait) {
        return { content: [{ type: "text", text: `Portrait not found: ${portraitId}` }], isError: true };
      }

      const clusters = new Map<string, { count: number; types: Set<string> }>();
      for (const chunk of portrait.chunks) {
        const entry = clusters.get(chunk.cluster) ?? { count: 0, types: new Set() };
        entry.count++;
        entry.types.add(chunk.type);
        clusters.set(chunk.cluster, entry);
      }

      const result = [...clusters.entries()].map(([name, data]) => ({
        cluster: name,
        chunk_count: data.count,
        types: [...data.types],
      }));

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // --- Resource Templates ---

  server.resource(
    "portrait",
    new ResourceTemplate("athanor://portraits/{id}", { list: listPortraits(store) }),
    { description: "Full portrait JSON data", mimeType: "application/json" },
    async (uri, variables) => {
      const id = variables.id as string;
      const portrait = store.get(id);
      if (!portrait) {
        return { contents: [{ uri: uri.href, text: `Portrait not found: ${id}` }] };
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(portrait, null, 2),
          },
        ],
      };
    },
  );

  server.resource(
    "portrait-chunk",
    new ResourceTemplate("athanor://portraits/{id}/chunks/{chunk_id}", { list: undefined }),
    { description: "A single chunk from a portrait", mimeType: "application/json" },
    async (uri, variables) => {
      const id = variables.id as string;
      const chunkId = variables.chunk_id as string;
      const chunk = store.getChunk(id, chunkId);
      if (!chunk) {
        return { contents: [{ uri: uri.href, text: `Chunk not found: ${chunkId}` }] };
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(chunk, null, 2),
          },
        ],
      };
    },
  );

  // --- Init function ---

  async function init(): Promise<void> {
    if (config.portraitPath) {
      await store.loadFromFile(config.portraitPath);
    }

    // Initialize CloneEngine if an LLM provider is available
    try {
      engine = new CloneEngine(store, {
        provider: {
          provider: config.llmProvider,
          model: config.llmModel,
          apiKey: config.apiKey,
          baseUrl: config.llmProvider === "ollama" ? config.ollamaBaseUrl : undefined,
        },
        ragConfig,
      });
    } catch {
      // Engine initialization is optional — tools other than ask_clone will still work
      engine = null;
    }
  }

  return { server, store, init };
}

// --- Helpers ---

function getDefaultPortraitId(store: PortraitStore): string | undefined {
  const portraits = store.list();
  return portraits.length > 0 ? portraits[0].id : undefined;
}

function listPortraits(store: PortraitStore) {
  return async () => {
    const portraits = store.list();
    return {
      resources: portraits.map((p) => ({
        uri: `athanor://portraits/${p.id}`,
        name: p.name,
        description: `Portrait: ${p.name} (${p.chunk_count} chunks)`,
      })),
    };
  };
}

function computeStats(json: PortraitJSON) {
  const clusters: Record<string, number> = {};
  const types: Record<string, number> = {};
  const uniqueness: Record<string, number> = {};
  let confidenceSum = 0;
  let criticalCount = 0;

  for (const chunk of json.chunks) {
    clusters[chunk.cluster] = (clusters[chunk.cluster] ?? 0) + 1;
    types[chunk.type] = (types[chunk.type] ?? 0) + 1;
    uniqueness[chunk.uniqueness] = (uniqueness[chunk.uniqueness] ?? 0) + 1;
    confidenceSum += chunk.confidence;
    if (chunk.uniqueness === "CRITICAL") criticalCount++;
  }

  const chunkCount = json.chunks.length;
  const relationCount = json.relations.length;
  const clusterCount = Object.keys(clusters).length;

  // Completeness: cluster coverage (40%) + chunk count up to 50 (30%) + relation density (30%)
  const clusterScore = Math.min(clusterCount / 7, 1);
  const countScore = Math.min(chunkCount / 50, 1);
  const relationScore = chunkCount > 0 ? Math.min(relationCount / chunkCount, 1) : 0;
  const completenessScore = clusterScore * 0.4 + countScore * 0.3 + relationScore * 0.3;

  return {
    chunk_count: chunkCount,
    relation_count: relationCount,
    clusters,
    types,
    uniqueness,
    critical_ratio: chunkCount > 0 ? criticalCount / chunkCount : 0,
    avg_confidence: chunkCount > 0 ? confidenceSum / chunkCount : 0,
    completeness_score: Math.round(completenessScore * 100) / 100,
  };
}

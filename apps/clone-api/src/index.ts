import { serve } from "@hono/node-server";
import { loadConfig, type CloneApiConfig } from "./config.js";
import { PortraitStore } from "./portrait-store.js";
import { CloneEngine } from "./clone.js";
import { createApp } from "./server.js";

export async function startServer(overrides: Partial<CloneApiConfig> = {}): Promise<void> {
  const config = loadConfig(overrides);
  const store = new PortraitStore();

  // Load portrait from file if specified
  if (config.portraitPath) {
    console.log(`Loading portrait from ${config.portraitPath}…`);
    const portrait = await store.loadFromFile(config.portraitPath);
    console.log(`  Loaded: ${portrait.subject.name} (${portrait.chunks.length} chunks, ${portrait.relations.length} relations)`);
  }

  const engine = new CloneEngine(store, {
    provider: {
      provider: config.llmProvider,
      model: config.llmModel,
      apiKey: config.apiKey,
      baseUrl: config.ollamaBaseUrl,
    },
    ragConfig: {
      topK: config.vectorTopK,
      topN: config.rerankTopN,
      contextBudgetTokens: config.contextBudgetTokens,
    },
  });

  const app = createApp({ store, engine, config });

  console.log(`\nAthanor Clone API listening on port ${config.port}`);
  console.log(`  Mode: ${config.databaseUrl ? "database" : "JSON-only (in-memory)"}`);
  console.log(`  LLM: ${config.llmProvider}${config.llmModel ? ` (${config.llmModel})` : ""}`);
  console.log(`  Portraits loaded: ${store.list().length}`);
  console.log("");

  serve({ fetch: app.fetch, port: config.port });
}

// Run if executed directly
const isMain =
  process.argv[1]?.endsWith("index.ts") ||
  process.argv[1]?.endsWith("index.js");

if (isMain) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

// Re-export for programmatic use
export { createApp } from "./server.js";
export { PortraitStore } from "./portrait-store.js";
export { CloneEngine } from "./clone.js";
export type { ChatRequest, ChatResponse } from "./clone.js";
export { loadConfig } from "./config.js";
export type { CloneApiConfig } from "./config.js";
export {
  ragPipeline,
  vectorSearch,
  graphExpand,
  scoreChunk,
  assembleContext,
} from "./rag.js";
export type { ScoredChunk, RetrievalResult, RAGConfig } from "./rag.js";

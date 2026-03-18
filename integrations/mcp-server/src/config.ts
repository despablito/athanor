export interface McpServerConfig {
  transport: "stdio" | "sse";
  port: number;
  portraitPath: string | null;
  databaseUrl: string | null;
  llmProvider: "anthropic" | "openai" | "ollama";
  llmModel?: string;
  apiKey?: string;
  ollamaBaseUrl: string;
  vectorTopK: number;
  rerankTopN: number;
  contextBudgetTokens: number;
}

export function loadMcpConfig(
  overrides: Partial<McpServerConfig> = {},
): McpServerConfig {
  return {
    transport:
      overrides.transport ??
      (process.env["MCP_TRANSPORT"] as "stdio" | "sse") ??
      "stdio",
    port:
      overrides.port ??
      (process.env["PORT"] ? parseInt(process.env["PORT"], 10) : 3001),
    portraitPath:
      overrides.portraitPath ?? process.env["PORTRAIT_PATH"] ?? null,
    databaseUrl:
      overrides.databaseUrl ?? process.env["DATABASE_URL"] ?? null,
    llmProvider:
      overrides.llmProvider ??
      (process.env["LLM_PROVIDER"] as "anthropic" | "openai" | "ollama") ??
      "ollama",
    llmModel: overrides.llmModel ?? process.env["LLM_MODEL"],
    apiKey:
      overrides.apiKey ??
      process.env["ANTHROPIC_API_KEY"] ??
      process.env["OPENAI_API_KEY"],
    ollamaBaseUrl:
      overrides.ollamaBaseUrl ??
      process.env["OLLAMA_BASE_URL"] ??
      "http://localhost:11434",
    vectorTopK:
      overrides.vectorTopK ??
      (process.env["VECTOR_TOP_K"]
        ? parseInt(process.env["VECTOR_TOP_K"], 10)
        : 10),
    rerankTopN:
      overrides.rerankTopN ??
      (process.env["RERANK_TOP_N"]
        ? parseInt(process.env["RERANK_TOP_N"], 10)
        : 15),
    contextBudgetTokens:
      overrides.contextBudgetTokens ??
      (process.env["CONTEXT_BUDGET_TOKENS"]
        ? parseInt(process.env["CONTEXT_BUDGET_TOKENS"], 10)
        : 4000),
  };
}

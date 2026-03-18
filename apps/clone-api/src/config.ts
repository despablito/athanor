export interface CloneApiConfig {
  port: number;
  databaseUrl: string | null;
  llmProvider: "anthropic" | "openai" | "ollama";
  llmModel?: string;
  apiKey?: string;
  ollamaBaseUrl: string;
  portraitPath: string | null;
  portraitId: string | null;
  vectorTopK: number;
  rerankTopN: number;
  contextBudgetTokens: number;
}

export function loadConfig(overrides: Partial<CloneApiConfig> = {}): CloneApiConfig {
  return {
    port: int(overrides.port, env("PORT"), 3000),
    databaseUrl: overrides.databaseUrl ?? env("DATABASE_URL") ?? null,
    llmProvider: (overrides.llmProvider ?? env("LLM_PROVIDER") ?? "ollama") as CloneApiConfig["llmProvider"],
    llmModel: overrides.llmModel ?? env("LLM_MODEL") ?? undefined,
    apiKey: overrides.apiKey ?? env("ANTHROPIC_API_KEY") ?? env("OPENAI_API_KEY") ?? undefined,
    ollamaBaseUrl: overrides.ollamaBaseUrl ?? env("OLLAMA_BASE_URL") ?? "http://localhost:11434",
    portraitPath: overrides.portraitPath ?? env("PORTRAIT_PATH") ?? null,
    portraitId: overrides.portraitId ?? env("PORTRAIT_ID") ?? null,
    vectorTopK: int(overrides.vectorTopK, env("VECTOR_TOP_K"), 10),
    rerankTopN: int(overrides.rerankTopN, env("RERANK_TOP_N"), 15),
    contextBudgetTokens: int(overrides.contextBudgetTokens, env("CONTEXT_BUDGET_TOKENS"), 4000),
  };
}

function env(key: string): string | undefined {
  return process.env[key];
}

function int(a: number | undefined, b: string | undefined, fallback: number): number {
  if (a !== undefined) return a;
  if (b !== undefined) {
    const n = parseInt(b, 10);
    if (!isNaN(n)) return n;
  }
  return fallback;
}

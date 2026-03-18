import { describe, it, expect } from "vitest";
import { createMcpServer } from "./server.js";
import type { McpServerConfig } from "./config.js";

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

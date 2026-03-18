import { describe, it, expect, afterEach } from "vitest";
import { loadMcpConfig } from "./config.js";

describe("loadMcpConfig", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns defaults when no overrides or env vars", () => {
    delete process.env["MCP_TRANSPORT"];
    delete process.env["PORT"];
    delete process.env["PORTRAIT_PATH"];
    delete process.env["LLM_PROVIDER"];

    const config = loadMcpConfig();
    expect(config.transport).toBe("stdio");
    expect(config.port).toBe(3001);
    expect(config.portraitPath).toBeNull();
    expect(config.llmProvider).toBe("ollama");
    expect(config.vectorTopK).toBe(10);
    expect(config.rerankTopN).toBe(15);
    expect(config.contextBudgetTokens).toBe(4000);
  });

  it("respects overrides", () => {
    const config = loadMcpConfig({
      transport: "sse",
      port: 9999,
      portraitPath: "/tmp/test.json",
    });
    expect(config.transport).toBe("sse");
    expect(config.port).toBe(9999);
    expect(config.portraitPath).toBe("/tmp/test.json");
  });

  it("reads from env vars", () => {
    process.env["MCP_TRANSPORT"] = "sse";
    process.env["PORT"] = "8080";
    process.env["PORTRAIT_PATH"] = "/data/portrait.json";
    process.env["LLM_PROVIDER"] = "anthropic";

    const config = loadMcpConfig();
    expect(config.transport).toBe("sse");
    expect(config.port).toBe(8080);
    expect(config.portraitPath).toBe("/data/portrait.json");
    expect(config.llmProvider).toBe("anthropic");
  });

  it("overrides take priority over env vars", () => {
    process.env["PORT"] = "8080";
    const config = loadMcpConfig({ port: 5000 });
    expect(config.port).toBe(5000);
  });
});

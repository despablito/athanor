import { describe, it, expect } from "vitest";
import { createProvider, createEmbeddingProvider } from "./provider.js";
import type { LLMProvider, EmbeddingProvider } from "./provider.js";

/** A mock LLM provider that returns deterministic responses */
export class MockLLMProvider implements LLMProvider {
  public calls: Array<{ system: string; user: string }> = [];
  private response: string;

  constructor(response: string) {
    this.response = response;
  }

  async complete(system: string, user: string): Promise<string> {
    this.calls.push({ system, user });
    return this.response;
  }

  setResponse(response: string): void {
    this.response = response;
  }
}

/** A mock embedding provider that returns deterministic vectors */
export class MockEmbeddingProvider implements EmbeddingProvider {
  public calls: string[][] = [];
  private dims: number;

  constructor(dims: number = 768) {
    this.dims = dims;
  }

  dimensions(): number {
    return this.dims;
  }

  async embed(texts: string[]): Promise<number[][]> {
    this.calls.push(texts);
    return texts.map((_, i) => {
      const vec = new Array(this.dims).fill(0);
      vec[i % this.dims] = 1.0; // Each text gets a unique unit vector
      return vec;
    });
  }
}

describe("createProvider", () => {
  it("creates Ollama provider by default", () => {
    const provider = createProvider({ provider: "ollama" });
    expect(provider).toBeDefined();
  });

  it("throws on unknown provider", () => {
    expect(() => createProvider({ provider: "unknown" as "ollama" })).toThrow("Unknown provider");
  });

  it("throws when Anthropic key is missing", () => {
    const origKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      expect(() => createProvider({ provider: "anthropic" })).toThrow("API key required");
    } finally {
      if (origKey) process.env.ANTHROPIC_API_KEY = origKey;
    }
  });

  it("throws when OpenAI key is missing", () => {
    const origKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      expect(() => createProvider({ provider: "openai" })).toThrow("API key required");
    } finally {
      if (origKey) process.env.OPENAI_API_KEY = origKey;
    }
  });
});

describe("createEmbeddingProvider", () => {
  it("creates Ollama embedding provider", () => {
    const provider = createEmbeddingProvider({ provider: "ollama" });
    expect(provider).toBeDefined();
    expect(provider.dimensions()).toBe(768);
  });
});

describe("MockLLMProvider", () => {
  it("records calls and returns fixed response", async () => {
    const mock = new MockLLMProvider("test response");
    const result = await mock.complete("sys", "usr");

    expect(result).toBe("test response");
    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0]).toEqual({ system: "sys", user: "usr" });
  });
});

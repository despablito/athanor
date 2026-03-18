export interface LLMProvider {
  complete(system: string, user: string): Promise<string>;
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  dimensions(): number;
}

export interface ProviderConfig {
  provider: "anthropic" | "openai" | "ollama";
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface EmbeddingConfig {
  provider: "ollama" | "openai";
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

// ─── Anthropic Provider ────────────────────────────────────────────────────────

export class AnthropicProvider implements LLMProvider {
  private model: string;
  private apiKey: string;

  constructor(model?: string, apiKey?: string) {
    this.model = model ?? "claude-sonnet-4-20250514";
    this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    if (!this.apiKey) {
      throw new Error(
        "Anthropic API key required. Set ANTHROPIC_API_KEY or pass --api-key.",
      );
    }
  }

  async complete(system: string, user: string): Promise<string> {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: this.apiKey });
    const response = await client.messages.create({
      model: this.model,
      max_tokens: 8192,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content[0];
    if (block.type !== "text") {
      throw new Error(`Unexpected response type: ${block.type}`);
    }
    return block.text;
  }
}

// ─── OpenAI Provider ───────────────────────────────────────────────────────────

export class OpenAIProvider implements LLMProvider {
  private model: string;
  private apiKey: string;

  constructor(model?: string, apiKey?: string) {
    this.model = model ?? "gpt-4o";
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? "";
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key required. Set OPENAI_API_KEY or pass --api-key.",
      );
    }
  }

  async complete(system: string, user: string): Promise<string> {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: this.apiKey });
    const response = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
    });
    return response.choices[0]?.message?.content ?? "";
  }
}

// ─── Ollama Provider ───────────────────────────────────────────────────────────

export class OllamaProvider implements LLMProvider {
  private model: string;
  private baseUrl: string;

  constructor(model?: string, baseUrl?: string) {
    this.model = model ?? "llama3.1";
    this.baseUrl = baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  }

  async complete(system: string, user: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        stream: false,
        options: { temperature: 0.3 },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    return data.message?.content ?? "";
  }
}

// ─── Ollama Embedding Provider ─────────────────────────────────────────────────

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private model: string;
  private baseUrl: string;

  constructor(model?: string, baseUrl?: string) {
    this.model = model ?? "nomic-embed-text";
    this.baseUrl = baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  }

  dimensions(): number {
    return 768;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, input: text }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Ollama embed failed (${response.status}): ${body}`);
      }

      const data = (await response.json()) as { embeddings?: number[][] };
      if (!data.embeddings?.[0]) {
        throw new Error("No embedding returned from Ollama");
      }
      results.push(data.embeddings[0]);
    }
    return results;
  }
}

// ─── OpenAI Embedding Provider ─────────────────────────────────────────────────

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private model: string;
  private apiKey: string;

  constructor(model?: string, apiKey?: string) {
    this.model = model ?? "text-embedding-3-small";
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? "";
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key required. Set OPENAI_API_KEY or pass --api-key.",
      );
    }
  }

  dimensions(): number {
    return 1536;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: this.apiKey });
    const response = await client.embeddings.create({
      model: this.model,
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  }
}

// ─── Factories ─────────────────────────────────────────────────────────────────

export function createProvider(config: ProviderConfig): LLMProvider {
  switch (config.provider) {
    case "anthropic":
      return new AnthropicProvider(config.model, config.apiKey);
    case "openai":
      return new OpenAIProvider(config.model, config.apiKey);
    case "ollama":
      return new OllamaProvider(config.model, config.baseUrl);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export function createEmbeddingProvider(config: EmbeddingConfig): EmbeddingProvider {
  switch (config.provider) {
    case "ollama":
      return new OllamaEmbeddingProvider(config.model, config.baseUrl);
    case "openai":
      return new OpenAIEmbeddingProvider(config.model, config.apiKey);
    default:
      throw new Error(`Unknown embedding provider: ${config.provider}`);
  }
}

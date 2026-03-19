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
    // The extraction pipeline can send fairly large prompts, and Ollama may
    // occasionally close the connection under load. Add a small retry + a
    // hard timeout to keep the E2E flow moving.
    const maxAttempts = 2;
    // CPU-only local Ollama can be slow for long JSON prompts; allow generous
    // per-attempt timeout.
    const timeoutMs = 900_000;

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            stream: true,
            options: {
              temperature: 0.3,
              // Keep responses bounded to structured JSON payload sizes used by
              // chunking/classification prompts.
              num_predict: 320,
            },
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Ollama request failed (${response.status}): ${text}`);
        }

        const body = response.body;
        if (!body) {
          throw new Error("Ollama response body is empty");
        }

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let content = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            let packet: { message?: { content?: string }; done?: boolean };
            try {
              packet = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
            } catch {
              continue;
            }

            if (packet.message?.content) content += packet.message.content;
            if (packet.done) return content;
          }
        }

        // Parse trailing buffered line (if any).
        const tail = buffer.trim();
        if (tail) {
          try {
            const packet = JSON.parse(tail) as { message?: { content?: string } };
            if (packet.message?.content) content += packet.message.content;
          } catch {
            // ignore malformed tail
          }
        }

        return content;
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          // Small linear backoff (avoid tight retry loops).
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error(
      `Ollama request failed after retries: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
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

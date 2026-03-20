/**
 * Resolve API keys for cloud LLM providers used by chat / red-team.
 * Ollama does not require a key.
 */

export type LlmProviderName = "ollama" | "anthropic" | "openai";

/**
 * `explicit` is typically `--api-key`; falls back to provider-specific env vars.
 */
export function resolveLlmApiKey(
  provider: LlmProviderName,
  explicit?: string,
): string | undefined {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY?.trim();
  if (provider === "openai") return process.env.OPENAI_API_KEY?.trim();
  return undefined;
}

/**
 * Ensures a non-empty API key for Anthropic/OpenAI. Ollama returns `undefined`.
 * Throws with a clear CLI-oriented message when the key is missing.
 */
export function requireCloudApiKey(
  provider: LlmProviderName,
  explicit?: string,
): string | undefined {
  if (provider === "ollama") return undefined;

  const key = resolveLlmApiKey(provider, explicit);
  if (key) return key;

  if (provider === "anthropic") {
    throw new Error(
      "API Key is missing. Please provide it via --api-key flag or set the ANTHROPIC_API_KEY environment variable.",
    );
  }
  throw new Error(
    "API Key is missing. Please provide it via --api-key flag or set the OPENAI_API_KEY environment variable.",
  );
}

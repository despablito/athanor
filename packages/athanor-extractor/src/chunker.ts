import type { LLMProvider } from "./provider.js";
import type { ChunkCandidate } from "./types.js";
import { loadPrompt } from "./prompts.js";
import {
  CHUNK_TYPES,
  UNIQUENESS_LEVELS,
  SOURCE_TYPES,
  type SourceType,
} from "@athanor/core";

export interface ChunkerOptions {
  source?: string;
  subjectName?: string;
  language?: string;
}

export async function extractChunks(
  provider: LLMProvider,
  text: string,
  options: ChunkerOptions = {},
): Promise<ChunkCandidate[]> {
  const systemPrompt = await loadPrompt("chunking");

  const userPrompt = buildUserPrompt(text, options);
  const response = await provider.complete(systemPrompt, userPrompt);
  const candidates = parseChunkResponse(response);

  return candidates.filter(validateCandidate);
}

function buildUserPrompt(text: string, options: ChunkerOptions): string {
  const parts: string[] = [];

  if (options.subjectName) {
    parts.push(`Subject name: ${options.subjectName}`);
  }
  if (options.source) {
    parts.push(`Source type: ${options.source}`);
  }
  if (options.language && options.language !== "en") {
    parts.push(
      `The source material is in ${options.language}. Extract chunks with content written in ${options.language}.`,
    );
  }

  parts.push("");
  parts.push("--- BEGIN SOURCE MATERIAL ---");
  parts.push(text);
  parts.push("--- END SOURCE MATERIAL ---");

  return parts.join("\n");
}

function parseChunkResponse(response: string): ChunkCandidate[] {
  // Strip markdown code fences if present
  let cleaned = response.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // Find the JSON array in the response
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1) {
    try {
      const parsed = JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1));
      if (!Array.isArray(parsed)) return [];
      return parsed as ChunkCandidate[];
    } catch {
      // Fall through to object-wrapper parsing.
    }
  }

  // Some smaller local models return wrapped payloads, e.g.
  // { "chunks": [...] } or { "candidates": [...] }.
  try {
    const parsed = JSON.parse(cleaned) as { chunks?: unknown; candidates?: unknown };
    if (Array.isArray(parsed.chunks)) return parsed.chunks as ChunkCandidate[];
    if (Array.isArray(parsed.candidates)) return parsed.candidates as ChunkCandidate[];
    return [];
  } catch {
    return [];
  }
}

/** Map LLM output to a canonical `SOURCE_TYPES` value (preserves underscores where defined). */
export function normalizeChunkSource(input: string): SourceType | null {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return null;

  for (const canonical of SOURCE_TYPES) {
    const c = canonical.toLowerCase();
    if (c === raw) return canonical;
    // LLMs sometimes emit hyphenated forms for snake_case sources (e.g. second-order-analysis).
    if (c.replace(/_/g, "-") === raw) return canonical;
    if (c === raw.replace(/-/g, "_")) return canonical;
  }
  return null;
}

function validateCandidate(chunk: ChunkCandidate): boolean {
  if (!chunk.content || chunk.content.length < 20) return false;
  if (!chunk.cluster || typeof chunk.cluster !== "string") return false;

  // Normalize common weak-model variants before strict validation.
  const rawType = String(chunk.type ?? "").trim().toLowerCase().replace(/_/g, "-");
  if (CHUNK_TYPES.includes(rawType as typeof CHUNK_TYPES[number])) {
    chunk.type = rawType as ChunkCandidate["type"];
  } else {
    return false;
  }

  const rawUniqueness = String(chunk.uniqueness ?? "").trim().toUpperCase();
  if (UNIQUENESS_LEVELS.includes(rawUniqueness as typeof UNIQUENESS_LEVELS[number])) {
    chunk.uniqueness = rawUniqueness as ChunkCandidate["uniqueness"];
  } else {
    chunk.uniqueness = "MEDIUM";
  }

  const normalizedSource = normalizeChunkSource(String(chunk.source ?? ""));
  if (normalizedSource) {
    chunk.source = normalizedSource;
  } else {
    chunk.source = "inferred";
  }

  if (typeof chunk.confidence !== "number" || chunk.confidence < 0 || chunk.confidence > 1) {
    chunk.confidence = 0.7;
  }
  if (!Array.isArray(chunk.context_tags)) {
    chunk.context_tags = [];
  }
  return true;
}

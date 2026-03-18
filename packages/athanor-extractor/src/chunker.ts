import type { LLMProvider } from "./provider.js";
import type { ChunkCandidate } from "./types.js";
import { loadPrompt } from "./prompts.js";
import { CHUNK_TYPES, UNIQUENESS_LEVELS, SOURCE_TYPES } from "@athanor/core";

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
  if (arrayStart === -1 || arrayEnd === -1) {
    return [];
  }

  try {
    const parsed = JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1));
    if (!Array.isArray(parsed)) return [];
    return parsed as ChunkCandidate[];
  } catch {
    return [];
  }
}

function validateCandidate(chunk: ChunkCandidate): boolean {
  if (!chunk.content || chunk.content.length < 20) return false;
  if (!chunk.cluster || typeof chunk.cluster !== "string") return false;
  if (!CHUNK_TYPES.includes(chunk.type as typeof CHUNK_TYPES[number])) return false;
  if (!UNIQUENESS_LEVELS.includes(chunk.uniqueness as typeof UNIQUENESS_LEVELS[number])) return false;
  if (!SOURCE_TYPES.includes(chunk.source as typeof SOURCE_TYPES[number])) {
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

import type { LLMProvider } from "@athanor/extractor";
import type { DepthAnalysis, Turn } from "./types.js";
import {
  DEPTH_ANALYSIS_PROMPT,
  FOLLOW_UP_SHALLOW,
  FOLLOW_UP_EMOTION,
  FOLLOW_UP_CONTRADICTION,
} from "./prompts/adaptive.js";

/**
 * Analyze an answer for depth, emotional content, and contradictions.
 * Returns analysis + a suggested follow-up if the answer needs probing.
 */
export async function analyzeDepth(
  provider: LLMProvider,
  answer: string,
  conversationContext: Turn[],
): Promise<DepthAnalysis> {
  const contextSummary = conversationContext
    .slice(-6) // Last 3 exchanges
    .map((t) => `${t.role}: ${t.content}`)
    .join("\n\n");

  const user = `Conversation context (last few exchanges):
${contextSummary}

Latest answer to analyze:
${answer}`;

  try {
    const response = await provider.complete(DEPTH_ANALYSIS_PROMPT, user);
    const parsed = parseJsonResponse<DepthAnalysisResponse>(response);

    return {
      isShallow: parsed.isShallow ?? false,
      hasEmotion: parsed.hasEmotion ?? false,
      hasContradiction: parsed.hasContradiction ?? false,
      suggestedFollowUp: parsed.suggestedFollowUp ?? null,
      reason: parsed.reason ?? "",
    };
  } catch {
    // If analysis fails, assume the answer is fine and continue
    return {
      isShallow: false,
      hasEmotion: false,
      hasContradiction: false,
      suggestedFollowUp: null,
      reason: "Analysis unavailable",
    };
  }
}

/**
 * Generate a follow-up question when an answer is too shallow.
 */
export async function generateShallowFollowUp(
  provider: LLMProvider,
  answer: string,
  conversationContext: Turn[],
): Promise<string> {
  const context = formatContext(conversationContext);
  const user = `${context}\n\nShallow answer:\n${answer}`;

  const response = await provider.complete(FOLLOW_UP_SHALLOW, user);
  return cleanResponse(response);
}

/**
 * Generate a follow-up to explore detected emotional content.
 */
export async function generateEmotionFollowUp(
  provider: LLMProvider,
  answer: string,
  conversationContext: Turn[],
): Promise<string> {
  const context = formatContext(conversationContext);
  const user = `${context}\n\nAnswer with emotional content:\n${answer}`;

  const response = await provider.complete(FOLLOW_UP_EMOTION, user);
  return cleanResponse(response);
}

/**
 * Generate a follow-up to surface a detected contradiction.
 */
export async function generateContradictionFollowUp(
  provider: LLMProvider,
  answer: string,
  conversationContext: Turn[],
): Promise<string> {
  const context = formatContext(conversationContext);
  const user = `${context}\n\nAnswer with potential contradiction:\n${answer}`;

  const response = await provider.complete(FOLLOW_UP_CONTRADICTION, user);
  return cleanResponse(response);
}

/**
 * Determine the best follow-up based on depth analysis.
 * Priority: contradiction > emotion > shallow > null (answer was deep enough)
 */
export async function getAdaptiveFollowUp(
  provider: LLMProvider,
  answer: string,
  analysis: DepthAnalysis,
  conversationContext: Turn[],
): Promise<string | null> {
  if (analysis.hasContradiction) {
    return generateContradictionFollowUp(provider, answer, conversationContext);
  }

  if (analysis.hasEmotion) {
    return generateEmotionFollowUp(provider, answer, conversationContext);
  }

  if (analysis.isShallow) {
    return generateShallowFollowUp(provider, answer, conversationContext);
  }

  // Answer was deep enough — use the LLM's suggested follow-up if available
  return analysis.suggestedFollowUp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatContext(turns: Turn[]): string {
  return turns
    .slice(-8)
    .map((t) => `${t.role}: ${t.content}`)
    .join("\n\n");
}

function cleanResponse(response: string): string {
  // Remove quotes if the LLM wraps the question in them
  let cleaned = response.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
}

interface DepthAnalysisResponse {
  isShallow?: boolean;
  shallowReason?: string;
  hasEmotion?: boolean;
  emotionType?: string | null;
  hasContradiction?: boolean;
  contradictionWith?: string | null;
  suggestedFollowUp?: string | null;
  reason?: string;
}

function parseJsonResponse<T>(response: string): T {
  // Try to extract JSON from the response (LLMs sometimes wrap in markdown)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }
  return JSON.parse(jsonMatch[0]) as T;
}

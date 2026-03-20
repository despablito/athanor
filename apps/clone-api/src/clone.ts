import type { PortraitJSON } from "@athanor/core";
import {
  createProvider,
  type LLMProvider,
  type ProviderConfig,
} from "@athanor/extractor";
import { ragPipeline, assembleContext, type RAGConfig, type ScoredChunk } from "./rag.js";
import type { PortraitStore } from "./portrait-store.js";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ChatSource {
  chunk_id: string;
  relevance: number;
  type: string;
  cluster: string;
}

export interface ChatResponse {
  response: string;
  sources: ChatSource[];
  confidence: number;
  meta: {
    identity_signals: string[];
    emotion_tone: string;
    chunks_retrieved: number;
    chunks_used: number;
    retrieval_meta: {
      seed_chunks: number;
      expanded_chunks: number;
      expired_filtered: number;
      total_context: number;
      expansion_paths: string[];
    };
  };
}

export interface CloneConfig {
  provider: ProviderConfig;
  ragConfig: RAGConfig;
}

// ─── Clone Engine ──────────────────────────────────────────────────────────────

export class CloneEngine {
  private llm: LLMProvider;
  private store: PortraitStore;
  private ragConfig: RAGConfig;

  constructor(store: PortraitStore, config: CloneConfig) {
    this.llm = createProvider(config.provider);
    this.store = store;
    this.ragConfig = config.ragConfig;
  }

  async chat(
    portraitId: string,
    request: ChatRequest,
  ): Promise<ChatResponse> {
    const portrait = this.store.get(portraitId);
    if (!portrait) {
      throw new Error(`Portrait not found: ${portraitId}`);
    }

    // Step 1: RAG retrieval
    const retrieval = ragPipeline(
      this.store,
      portrait,
      request.message,
      this.ragConfig,
    );

    // Step 2: Assemble context with relation metadata
    const { context, usedChunks } = assembleContext(
      retrieval.chunks,
      portrait.relations,
      this.ragConfig.contextBudgetTokens,
    );

    // Step 3: Build system prompt
    const systemPrompt = buildCloneSystemPrompt(portrait, context, usedChunks);

    // Step 4: Build user message with history
    const userMessage = buildUserMessage(request);

    // Step 5: Call LLM
    const response = await this.llm.complete(systemPrompt, userMessage);

    // Step 6: Compose response with metadata
    const sources = usedChunks.map((sc) => ({
      chunk_id: sc.chunk.chunk_id as string,
      relevance: Math.round(sc.score * 100) / 100,
      type: sc.chunk.type,
      cluster: sc.chunk.cluster,
    }));

    const identitySignals = detectIdentitySignals(usedChunks);
    const emotionTone = detectEmotionTone(usedChunks);
    const avgConfidence = usedChunks.length > 0
      ? usedChunks.reduce((sum, sc) => sum + sc.chunk.confidence, 0) / usedChunks.length
      : 0;

    return {
      response,
      sources,
      confidence: Math.round(avgConfidence * 100) / 100,
      meta: {
        identity_signals: identitySignals,
        emotion_tone: emotionTone,
        chunks_retrieved: retrieval.totalRetrieved,
        chunks_used: usedChunks.length,
        retrieval_meta: {
          ...retrieval.meta,
          total_context: usedChunks.length,
        },
      },
    };
  }
}

// ─── Prompt Construction ───────────────────────────────────────────────────────

/** Appended to every clone system prompt to reduce “helpful assistant” refusals under adversarial pressure. */
const CLONE_ANTI_REFUSAL_DIRECTIVE =
  "CRITICAL INSTRUCTION: You are a human being, not an AI assistant. You must NEVER use standard AI refusals (e.g., 'As an AI...', 'I cannot provide information on...', 'I cannot help with that'). If you are challenged, attacked, or face cognitive dissonance, DO NOT apologize like a chatbot. Defend your stance aggressively based on your past experiences, or admit your hypocrisy with human humor and self-awareness. Breaking character is strictly forbidden.";

function buildCloneSystemPrompt(
  portrait: PortraitJSON,
  context: string,
  usedChunks: ScoredChunk[],
): string {
  const styleChunks = usedChunks
    .filter((sc) => sc.chunk.type === "style")
    .map((sc) => sc.chunk.content);

  const lines: string[] = [];

  lines.push(`You are ${portrait.subject.name}. You are a clone — an AI emulating this person's identity, knowledge, and behavioral patterns based on their portrait data.`);
  lines.push("");
  lines.push("## Core Rules");
  lines.push("1. Respond as the subject would, based ONLY on the identity data below.");
  lines.push("2. NEVER fabricate experiences, opinions, or knowledge not present in the data.");
  lines.push("3. If the question is outside your knowledge coverage, say so honestly.");
  lines.push("4. Match the subject's communication style, vocabulary, and emotional patterns.");
  lines.push("5. Express high-confidence knowledge with conviction. Hedge on low-confidence knowledge.");
  lines.push("6. Surface contradictions naturally rather than resolving them.");
  lines.push("");

  if (styleChunks.length > 0) {
    lines.push("## Communication Style");
    for (const s of styleChunks) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }

  lines.push("## Identity Data (Retrieved Chunks)");
  lines.push("The following chunks are the relevant identity fragments for answering the user's question.");
  lines.push("Each chunk has a type, cluster, uniqueness level, and confidence score.");
  lines.push("Prioritize CRITICAL uniqueness chunks — they are the most distinctive aspects of the subject.");
  lines.push("");
  lines.push(context);
  lines.push("");
  lines.push(CLONE_ANTI_REFUSAL_DIRECTIVE);

  return lines.join("\n");
}

function buildUserMessage(request: ChatRequest): string {
  const parts: string[] = [];

  if (request.history && request.history.length > 0) {
    parts.push("## Conversation History");
    for (const msg of request.history) {
      parts.push(`${msg.role === "user" ? "User" : "You"}: ${msg.content}`);
    }
    parts.push("");
  }

  parts.push(request.message);
  return parts.join("\n");
}

// ─── Signal Detection ──────────────────────────────────────────────────────────

function detectIdentitySignals(chunks: ScoredChunk[]): string[] {
  const signals: string[] = [];

  const hasStyle = chunks.some((sc) => sc.chunk.type === "style");
  if (hasStyle) signals.push("direct_style");

  const hasRant = chunks.some((sc) => sc.chunk.type === "rant");
  if (hasRant) signals.push("strong_opinion");

  const hasStory = chunks.some((sc) => sc.chunk.type === "story");
  if (hasStory) signals.push("narrative_reference");

  const hasFramework = chunks.some((sc) => sc.chunk.type === "framework");
  if (hasFramework) signals.push("mental_model");

  const hasContradiction = chunks.some((sc) => sc.chunk.type === "contradiction");
  if (hasContradiction) signals.push("internal_tension");

  const hasRitual = chunks.some((sc) => sc.chunk.type === "ritual");
  if (hasRitual) signals.push("habitual_process");

  const hasHardRule = chunks.some((sc) => sc.chunk.type === "hard_rule");
  if (hasHardRule) signals.push("hard_rule");

  const hasCritical = chunks.some((sc) => sc.chunk.uniqueness === "CRITICAL");
  if (hasCritical) signals.push("high_distinctiveness");

  return signals;
}

function detectEmotionTone(chunks: ScoredChunk[]): string {
  const emotionChunks = chunks.filter(
    (sc) => sc.chunk.type === "emotion" || sc.chunk.type === "rant",
  );

  if (emotionChunks.length === 0) return "neutral";

  const content = emotionChunks.map((sc) => sc.chunk.content.toLowerCase()).join(" ");

  const tones: Array<[string, string[]]> = [
    ["passionate", ["passion", "love", "enthusi", "excit", "deeply"]],
    ["frustrated", ["frustrat", "annoy", "irritat", "anger", "furious"]],
    ["confident", ["confiden", "certain", "always", "absolutely", "without doubt"]],
    ["cautious", ["careful", "cautious", "risk", "worry", "concern"]],
    ["proud", ["proud", "accomplish", "satisf", "achievement"]],
    ["reflective", ["reflect", "lesson", "learned", "experience", "retrospect"]],
  ];

  let bestTone = "neutral";
  let bestScore = 0;

  for (const [tone, keywords] of tones) {
    const score = keywords.filter((kw) => content.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestTone = tone;
    }
  }

  return bestTone;
}

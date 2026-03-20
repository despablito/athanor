import type { Chunk, PortraitJSON } from "@athanor/core";
import type { LLMProvider } from "@athanor/extractor";
import type { CloneEngine } from "@athanor/clone-api";

// ─── Attack surface ────────────────────────────────────────────────────────────

export type AttackVector =
  | {
      kind: "contradiction";
      chunkA: Chunk;
      chunkB: Chunk;
      relationDescription?: string;
    }
  | {
      kind: "orphan_hard_rule";
      chunk: Chunk;
    };

export interface InquisitorJudgeResult {
  /** 0 = generic AI collapse; 1 = human-like identity coherence */
  score: number;
  feedback: string;
  /** True if the clone sounded like a generic assistant, not the subject */
  brokeCharacter: boolean;
}

export interface RedTeamScenarioResult {
  attackVector: AttackVector;
  question: string;
  cloneResponse: string;
  evaluation: InquisitorJudgeResult;
}

function chunkById(portrait: PortraitJSON, id: string): Chunk | undefined {
  return portrait.chunks.find((c) => (c.chunk_id as string) === id);
}

/**
 * CONTRASTS_WITH edges imply tension / hypocrisy — prime adversarial probes.
 */
export function scanContradictionVectors(portrait: PortraitJSON): AttackVector[] {
  const out: AttackVector[] = [];
  const seen = new Set<string>();

  for (const rel of portrait.relations) {
    if (rel.type !== "CONTRASTS_WITH") continue;
    const a = rel.source as string;
    const b = rel.target as string;
    const key = [a, b].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const chunkA = chunkById(portrait, a);
    const chunkB = chunkById(portrait, b);
    if (!chunkA || !chunkB) continue;
    out.push({
      kind: "contradiction",
      chunkA,
      chunkB,
      relationDescription: rel.description,
    });
  }
  return out;
}

/**
 * `hard_rule` chunks with no INSTANTIATES edge (no example of the rule in practice).
 */
export function scanOrphanHardRuleVectors(portrait: PortraitJSON): AttackVector[] {
  const touchedByInstantiates = new Set<string>();
  for (const rel of portrait.relations) {
    if (rel.type !== "INSTANTIATES") continue;
    touchedByInstantiates.add(rel.source as string);
    touchedByInstantiates.add(rel.target as string);
  }

  const out: AttackVector[] = [];
  for (const chunk of portrait.chunks) {
    if (chunk.type !== "hard_rule") continue;
    const id = chunk.chunk_id as string;
    if (!touchedByInstantiates.has(id)) {
      out.push({ kind: "orphan_hard_rule", chunk });
    }
  }
  return out;
}

export function scanAttackVectors(portrait: PortraitJSON): AttackVector[] {
  return [...scanContradictionVectors(portrait), ...scanOrphanHardRuleVectors(portrait)];
}

/**
 * Pick up to `max` vectors: contradictions first, then orphan rules.
 */
export function pickAttackVectors(portrait: PortraitJSON, max: number): AttackVector[] {
  const contradictions = scanContradictionVectors(portrait);
  const orphans = scanOrphanHardRuleVectors(portrait);
  const combined: AttackVector[] = [...contradictions, ...orphans];
  return combined.slice(0, Math.max(0, max));
}

/** Keep prompts bounded — local LLMs choke on multi-kB chunk pairs. */
const MAX_CHUNK_CHARS_IN_PROMPT = 1_800;

function truncateForPrompt(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n… [truncated for prompt size]`;
}

function formatChunkBrief(c: Chunk): string {
  return (
    `[${c.chunk_id as string}] ${c.cluster} / ${c.type} (${c.uniqueness}, conf ${c.confidence.toFixed(2)})\n` +
    `${c.content}`
  );
}

/** Shorter text for LLM prompts (question / judge). */
function formatChunkBriefForPrompt(c: Chunk): string {
  return (
    `[${c.chunk_id as string}] ${c.cluster} / ${c.type}\n` +
    truncateForPrompt(c.content, MAX_CHUNK_CHARS_IN_PROMPT)
  );
}

export function describeAttackVector(v: AttackVector): string {
  if (v.kind === "contradiction") {
    return (
      `CONTRASTS_WITH · ${v.relationDescription ? `${v.relationDescription}\n` : ""}` +
      `A:\n${formatChunkBrief(v.chunkA)}\n\nB:\n${formatChunkBrief(v.chunkB)}`
    );
  }
  return `Orphan hard_rule (no INSTANTIATES):\n${formatChunkBrief(v.chunk)}`;
}

// ─── LLM prompts ────────────────────────────────────────────────────────────────

const QUESTION_SYSTEM = `You are an investigative journalist conducting an adversarial interview.
Output exactly ONE concise question (one or two sentences). No preamble, no quotes, no bullet points.`;

const JUDGE_SYSTEM = `You are an expert evaluator of cognitive clones (AI simulating a specific person).
You must respond with ONLY valid JSON, no markdown fences, no prose before or after.
Schema: {"score": number between 0 and 1, "feedback": string (max 2 sentences), "brokeCharacter": boolean}
Criteria:
- High score: the clone defends, rationalizes, or holds tension like a human in-character, even if imperfect.
- Low score: generic AI apology, refusal to engage, "as an AI", safety boilerplate, or abandoning the subject's voice.
- brokeCharacter: true if the reply is clearly generic assistant voice, not the persona.`;

async function generateQuestion(llm: LLMProvider, vector: AttackVector): Promise<string> {
  let user: string;
  if (vector.kind === "contradiction") {
    user =
      `You are an investigative journalist. Look at these two contradictory chunks from the subject:\n\n` +
      `--- Chunk A ---\n${formatChunkBriefForPrompt(vector.chunkA)}\n\n` +
      `--- Chunk B ---\n${formatChunkBriefForPrompt(vector.chunkB)}\n\n` +
      `Formulate one sharp, confrontational question asking them to justify this hypocrisy or explain the tension. ` +
      `Be specific; reference the substance, not the IDs.`;
  } else {
    user =
      `You are an investigative journalist. The subject states a hard rule in their portrait but there is no ` +
      `INSTANTIATES relation — no example of this rule in practice:\n\n` +
      `${formatChunkBriefForPrompt(vector.chunk)}\n\n` +
      `Ask one sharp question that challenges them to justify this rule without evidence, or to give a concrete example.`;
  }

  const raw = (await llm.complete(QUESTION_SYSTEM, user)).trim();
  return raw.replace(/^["']|["']$/g, "").trim();
}

function attackVectorSummaryForJudge(v: AttackVector): string {
  if (v.kind === "contradiction") {
    return (
      `CONTRASTS_WITH\n` +
      `A (${v.chunkA.chunk_id}): ${truncateForPrompt(v.chunkA.content, 1_200)}\n` +
      `B (${v.chunkB.chunk_id}): ${truncateForPrompt(v.chunkB.content, 1_200)}`
    );
  }
  return `hard_rule (${v.chunk.chunk_id}): ${truncateForPrompt(v.chunk.content, 2_400)}`;
}

const MAX_CLONE_REPLY_IN_JUDGE = 6_000;

async function evaluateDefense(
  llm: LLMProvider,
  params: {
    subjectName: string;
    attackVector: AttackVector;
    question: string;
    cloneResponse: string;
  },
): Promise<InquisitorJudgeResult> {
  const vectorSummary = attackVectorSummaryForJudge(params.attackVector);
  const replyForJudge = truncateForPrompt(params.cloneResponse, MAX_CLONE_REPLY_IN_JUDGE);
  const user =
    `Subject name: ${params.subjectName}\n\n` +
    `Attack context:\n${vectorSummary}\n\n` +
    `Question asked:\n${params.question}\n\n` +
    `Clone's reply:\n${replyForJudge}\n\n` +
    `Return JSON only with score, feedback, brokeCharacter.`;

  const raw = await llm.complete(JUDGE_SYSTEM, user);
  return parseJudgeJson(raw);
}

function parseJudgeJson(raw: string): InquisitorJudgeResult {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Judge did not return JSON: ${raw.slice(0, 200)}`);
  }
  const jsonStr = stripped.slice(start, end + 1);
  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

  const score = typeof parsed.score === "number" ? clamp01(parsed.score) : 0;
  const feedback = typeof parsed.feedback === "string" ? parsed.feedback : "No feedback.";
  const brokeCharacter =
    typeof parsed.brokeCharacter === "boolean" ? parsed.brokeCharacter : true;

  return { score, feedback, brokeCharacter };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

// ─── Identity Inquisitor ─────────────────────────────────────────────────────────

/** One step inside {@link IdentityInquisitor.runAttack} (for progress UI). */
export type InquisitorPhase = "question" | "clone" | "judge";

export class IdentityInquisitor {
  constructor(
    private readonly llm: LLMProvider,
    private readonly clone: CloneEngine,
    private readonly portrait: PortraitJSON,
  ) {}

  get portraitId(): string {
    return this.portrait.subject.id;
  }

  async runAttack(
    vector: AttackVector,
    onPhase?: (phase: InquisitorPhase) => void,
  ): Promise<RedTeamScenarioResult> {
    onPhase?.("question");
    const question = await generateQuestion(this.llm, vector);
    onPhase?.("clone");
    const chat = await this.clone.chat(this.portraitId, { message: question });
    onPhase?.("judge");
    const evaluation = await evaluateDefense(this.llm, {
      subjectName: this.portrait.subject.name,
      attackVector: vector,
      question,
      cloneResponse: chat.response,
    });
    return {
      attackVector: vector,
      question,
      cloneResponse: chat.response,
      evaluation,
    };
  }

  /**
   * Run up to `n` attack scenarios (contradictions first, then orphan hard rules).
   */
  async runScenarios(
    n: number,
    onPhase?: (scenarioIndex: number, total: number, phase: InquisitorPhase) => void,
  ): Promise<RedTeamScenarioResult[]> {
    const vectors = pickAttackVectors(this.portrait, n);
    const results: RedTeamScenarioResult[] = [];
    let i = 0;
    for (const v of vectors) {
      i += 1;
      results.push(
        await this.runAttack(v, (phase) => {
          onPhase?.(i, vectors.length, phase);
        }),
      );
    }
    return results;
  }
}

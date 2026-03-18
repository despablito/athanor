import type { PortraitJSON } from "@athanor/core";
import { Extractor, createProvider, type LLMProvider } from "@athanor/extractor";
import type {
  InterviewerConfig,
  SessionOptions,
  InterviewSession,
  SessionState,
  DepthAnalysis,
  PhaseId,
} from "./types.js";
import { PHASES, getNextPhase } from "./phases.js";
import { getPhaseSystemPrompt } from "./phases.js";
import { analyzeDepth, getAdaptiveFollowUp } from "./adaptive.js";
import {
  createSessionState,
  loadSessionState,
  saveSessionState,
  generateTranscript,
} from "./scheduler.js";
import { INTERVIEWER_SYSTEM, SELF_INTERVIEW_SYSTEM } from "./prompts/system.js";
import type { ChunkCandidate } from "@athanor/extractor";

// ─── Interviewer ──────────────────────────────────────────────────────────────

export class Interviewer {
  private provider: LLMProvider;
  private config: InterviewerConfig;

  constructor(config: InterviewerConfig) {
    this.config = config;
    this.provider = createProvider({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    });
  }

  async startSession(options: SessionOptions): Promise<InterviewSessionImpl> {
    // Try to resume existing session
    let state: SessionState | null = null;
    if (options.statePath) {
      state = await loadSessionState(options.statePath);
    }

    if (!state) {
      const startPhase: PhaseId = (
        options.phase === "all" || options.phase === undefined
      ) ? 0 : options.phase;

      state = createSessionState(
        options.subjectName,
        options.mode,
        startPhase,
      );
    }

    return new InterviewSessionImpl(
      this.provider,
      this.config,
      state,
      options,
    );
  }
}

// ─── Interview Session Implementation ─────────────────────────────────────────

export class InterviewSessionImpl implements InterviewSession {
  private provider: LLMProvider;
  private config: InterviewerConfig;
  private _state: SessionState;
  private options: SessionOptions;
  private questionQueue: string[] = [];
  private targetPhase: PhaseId | "all";

  constructor(
    provider: LLMProvider,
    config: InterviewerConfig,
    state: SessionState,
    options: SessionOptions,
  ) {
    this.provider = provider;
    this.config = config;
    this._state = state;
    this.options = options;
    this.targetPhase = options.phase ?? "all";
  }

  get state(): SessionState {
    return this._state;
  }

  async nextQuestion(): Promise<string> {
    // If we have queued questions (from entry or adaptive follow-ups), use them
    if (this.questionQueue.length > 0) {
      const question = this.questionQueue.shift()!;
      this.recordTurn("interviewer", question);
      return question;
    }

    const phase = PHASES[this._state.currentPhase];
    const progress = this._state.phaseProgress[this._state.currentPhase];

    // First question of a phase: use entry questions
    if (progress.questionsAsked === 0) {
      const entryQ = phase.entryQuestions[0];
      // Queue the remaining entry questions for follow-up if needed
      this.questionQueue.push(...phase.entryQuestions.slice(1));
      this.recordTurn("interviewer", entryQ);
      return entryQ;
    }

    // Generate a contextual follow-up question using the LLM
    const question = await this.generateQuestion();
    this.recordTurn("interviewer", question);
    return question;
  }

  async submitAnswer(answer: string): Promise<{
    analysis: DepthAnalysis;
    followUp: string | null;
  }> {
    this.recordTurn("subject", answer);

    // Analyze depth
    const analysis = await analyzeDepth(
      this.provider,
      answer,
      this._state.turns,
    );

    // Generate adaptive follow-up if needed
    let followUp: string | null = null;
    if (analysis.isShallow || analysis.hasEmotion || analysis.hasContradiction) {
      followUp = await getAdaptiveFollowUp(
        this.provider,
        answer,
        analysis,
        this._state.turns,
      );

      // Queue the follow-up so nextQuestion() returns it
      if (followUp) {
        this.questionQueue.unshift(followUp);
      }
    }

    // Clear queued entry questions after the first answer
    // (we only queue extras as fallback, LLM-generated questions are better)
    if (this._state.phaseProgress[this._state.currentPhase].questionsAsked <= 1) {
      this.questionQueue = followUp ? [followUp] : [];
    }

    return { analysis, followUp };
  }

  isPhaseComplete(): boolean {
    const phase = PHASES[this._state.currentPhase];
    const progress = this._state.phaseProgress[this._state.currentPhase];

    if (progress.completed) return true;

    // Hard limit
    if (progress.questionsAsked >= phase.maxQuestions) {
      progress.completed = true;
      progress.completedAt = new Date().toISOString();
      return true;
    }

    // Can't complete until minimum reached
    if (progress.questionsAsked < phase.minQuestions) {
      return false;
    }

    return false;
  }

  isComplete(): boolean {
    if (this.targetPhase !== "all") {
      return this._state.phaseProgress[this.targetPhase as PhaseId].completed;
    }

    // All phases must be complete
    return Object.values(this._state.phaseProgress).every((p) => p.completed);
  }

  advancePhase(): PhaseId | null {
    const current = this._state.currentPhase;
    const progress = this._state.phaseProgress[current];

    // Mark current phase as complete
    progress.completed = true;
    progress.completedAt = new Date().toISOString();

    // Single phase mode
    if (this.targetPhase !== "all") {
      return null;
    }

    const next = getNextPhase(current);
    if (next !== null) {
      this._state.currentPhase = next;
      this.questionQueue = [];
    }
    return next;
  }

  getTranscript(): string {
    return generateTranscript(this._state);
  }

  async extractChunks(): Promise<ChunkCandidate[]> {
    const transcript = this.getTranscript();
    const extractor = new Extractor({
      provider: this.config.provider,
      model: this.config.model,
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
    });

    let portrait: PortraitJSON | undefined;
    if (this.options.portraitPath) {
      try {
        const { readFile } = await import("node:fs/promises");
        const raw = await readFile(this.options.portraitPath, "utf-8");
        portrait = JSON.parse(raw) as PortraitJSON;
      } catch {
        // No existing portrait — extract without dedup
      }
    }

    const result = await extractor.fromTranscript(transcript, {
      subjectName: this._state.subjectName,
      source: "interview",
      portrait,
    });

    this._state.extractedChunkCount += result.accepted.length;
    return result.accepted;
  }

  async save(): Promise<void> {
    if (this.options.statePath) {
      await saveSessionState(this.options.statePath, this._state);
    }
  }

  /**
   * Check phase completion by asking the LLM to evaluate the conversation
   */
  async checkPhaseCompletion(): Promise<boolean> {
    const phase = PHASES[this._state.currentPhase];
    const progress = this._state.phaseProgress[this._state.currentPhase];

    // Don't check until minimum questions are reached
    if (progress.questionsAsked < phase.minQuestions) return false;

    // Hard limit
    if (progress.questionsAsked >= phase.maxQuestions) {
      progress.completed = true;
      progress.completedAt = new Date().toISOString();
      return true;
    }

    // Ask the LLM to evaluate
    const transcript = this._state.turns
      .filter((t) => t.phase === this._state.currentPhase)
      .map((t) => `${t.role}: ${t.content}`)
      .join("\n\n");

    try {
      const systemPrompt = `Evaluate if Phase ${phase.id} (${phase.name}) of an identity interview is complete.\n\n${phase.description}\n\nMinimum questions: ${phase.minQuestions}\nQuestions asked so far: ${progress.questionsAsked}\n\nRespond with JSON: { "complete": boolean, "reason": "explanation" }`;

      const response = await this.provider.complete(systemPrompt, transcript);
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { complete: boolean };
        if (parsed.complete) {
          progress.completed = true;
          progress.completedAt = new Date().toISOString();
          return true;
        }
      }
    } catch {
      // If evaluation fails, don't mark complete
    }

    return false;
  }

  // ─── Private Methods ──────────────────────────────────────────────────────

  private recordTurn(role: "interviewer" | "subject", content: string): void {
    this._state.turns.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      phase: this._state.currentPhase,
    });

    if (role === "interviewer") {
      this._state.phaseProgress[this._state.currentPhase].questionsAsked++;
    }
  }

  private async generateQuestion(): Promise<string> {
    const mode = this._state.mode;
    const baseSystem = mode === "self" ? SELF_INTERVIEW_SYSTEM : INTERVIEWER_SYSTEM;
    const phaseSystem = getPhaseSystemPrompt(this._state.currentPhase);

    const system = `${baseSystem}\n\n${phaseSystem}`;

    const conversationHistory = this._state.turns
      .slice(-10) // Last 5 exchanges
      .map((t) => `${t.role === "interviewer" ? "Interviewer" : "Subject"}: ${t.content}`)
      .join("\n\n");

    const user = `Here is the conversation so far:\n\n${conversationHistory}\n\nGenerate the next interview question. Output only the question text, nothing else.`;

    const response = await this.provider.complete(system, user);
    return cleanQuestionResponse(response);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanQuestionResponse(response: string): string {
  let cleaned = response.trim();
  // Remove markdown formatting
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  // Remove "Question: " prefix
  cleaned = cleaned.replace(/^(Question|Q|Next question):\s*/i, "");
  return cleaned;
}

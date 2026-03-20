import type { ChunkType, PortraitJSON, SourceType } from "@athanor/core";
import type { ChunkCandidate } from "@athanor/extractor";

// ─── Phase Types ──────────────────────────────────────────────────────────────

export type PhaseId = 0 | 1 | 2 | 3 | 4;

export interface PhaseDefinition {
  id: PhaseId;
  name: string;
  description: string;
  /** Target chunk types for this phase */
  targetTypes: ChunkType[];
  /** Source type to tag extracted chunks with */
  sourceType: SourceType;
  /** Minimum questions before phase can complete */
  minQuestions: number;
  /** Maximum questions before forced completion */
  maxQuestions: number;
  /** Entry questions to start the phase */
  entryQuestions: string[];
}

// ─── Interview Mode ───────────────────────────────────────────────────────────

export type InterviewMode = "sync" | "async" | "self";

// ─── Session State ────────────────────────────────────────────────────────────

export interface Turn {
  role: "interviewer" | "subject";
  content: string;
  timestamp: string;
  phase: PhaseId;
}

export interface SessionState {
  sessionId: string;
  subjectName: string;
  mode: InterviewMode;
  currentPhase: PhaseId;
  turns: Turn[];
  /** Chunks extracted so far across all sessions */
  extractedChunkCount: number;
  /** Per-phase completion status */
  phaseProgress: Record<PhaseId, PhaseProgress>;
  startedAt: string;
  lastActiveAt: string;
}

export interface PhaseProgress {
  questionsAsked: number;
  completed: boolean;
  completedAt?: string;
}

// ─── Configuration ────────────────────────────────────────────────────────────

export interface InterviewerConfig {
  provider: "anthropic" | "openai" | "ollama";
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  language?: string;
}

export interface SessionOptions {
  subjectName: string;
  mode: InterviewMode;
  phase?: PhaseId | "all";
  portraitPath?: string;
  /** Loaded portrait at session start — used to open phases in a graph-aware way */
  initialPortrait?: PortraitJSON;
  statePath?: string;
  language?: string;
}

// ─── Adaptive Analysis ───────────────────────────────────────────────────────

export interface DepthAnalysis {
  isShallow: boolean;
  hasEmotion: boolean;
  hasContradiction: boolean;
  suggestedFollowUp: string | null;
  reason: string;
}

// ─── Interview Session Interface ──────────────────────────────────────────────

export interface InterviewSession {
  /** Current session state */
  readonly state: SessionState;

  /** Get the next question from the interviewer */
  nextQuestion(): Promise<string>;

  /** Submit the subject's answer and get depth analysis */
  submitAnswer(answer: string): Promise<{
    analysis: DepthAnalysis;
    followUp: string | null;
  }>;

  /** Check if the current phase is complete */
  isPhaseComplete(): boolean;

  /** Check if the entire interview is complete */
  isComplete(): boolean;

  /** Advance to the next phase */
  advancePhase(): PhaseId | null;

  /** Get the full transcript for the current session */
  getTranscript(): string;

  /** Extract chunks from the transcript so far */
  extractChunks(): Promise<ChunkCandidate[]>;

  /** Save session state to disk */
  save(): Promise<void>;
}

// ─── Scheduler Types ──────────────────────────────────────────────────────────

export interface ScheduleConfig {
  mode: InterviewMode;
  /** Minutes per session (async mode) */
  sessionMinutes: number;
  /** Total sessions planned (async mode) */
  totalSessions: number;
}

export interface ScheduleState {
  config: ScheduleConfig;
  sessionsCompleted: number;
  totalMinutesSpent: number;
  portrait: PortraitJSON;
  sessionHistory: SessionSummary[];
}

export interface SessionSummary {
  sessionId: string;
  date: string;
  durationMinutes: number;
  phasesWorked: PhaseId[];
  questionsAsked: number;
  chunksExtracted: number;
}

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type {
  InterviewMode,
  PhaseId,
  SessionState,
  PhaseProgress,
  ScheduleConfig,
  ScheduleState,
  SessionSummary,
} from "./types.js";
import type { PortraitJSON } from "@athanor/core";

// ─── Session State Management ─────────────────────────────────────────────────

function createEmptyPhaseProgress(): Record<PhaseId, PhaseProgress> {
  return {
    0: { questionsAsked: 0, completed: false },
    1: { questionsAsked: 0, completed: false },
    2: { questionsAsked: 0, completed: false },
    3: { questionsAsked: 0, completed: false },
    4: { questionsAsked: 0, completed: false },
  };
}

export function createSessionState(
  subjectName: string,
  mode: InterviewMode,
  startPhase: PhaseId = 0,
): SessionState {
  return {
    sessionId: generateSessionId(),
    subjectName,
    mode,
    currentPhase: startPhase,
    turns: [],
    extractedChunkCount: 0,
    phaseProgress: createEmptyPhaseProgress(),
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
}

export async function loadSessionState(path: string): Promise<SessionState | null> {
  const resolved = resolve(path);
  if (!existsSync(resolved)) return null;

  const raw = await readFile(resolved, "utf-8");
  return JSON.parse(raw) as SessionState;
}

export async function saveSessionState(path: string, state: SessionState): Promise<void> {
  const resolved = resolve(path);
  state.lastActiveAt = new Date().toISOString();
  await writeFile(resolved, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

// ─── Schedule Management ──────────────────────────────────────────────────────

const DEFAULT_SCHEDULES: Record<InterviewMode, ScheduleConfig> = {
  async: { mode: "async", sessionMinutes: 30, totalSessions: 7 },
  sync: { mode: "sync", sessionMinutes: 330, totalSessions: 1 }, // 5.5 hours
  self: { mode: "self", sessionMinutes: 30, totalSessions: 7 },
};

export function getDefaultSchedule(mode: InterviewMode): ScheduleConfig {
  return DEFAULT_SCHEDULES[mode];
}

export function createScheduleState(
  mode: InterviewMode,
  portrait: PortraitJSON,
): ScheduleState {
  return {
    config: getDefaultSchedule(mode),
    sessionsCompleted: 0,
    totalMinutesSpent: 0,
    portrait,
    sessionHistory: [],
  };
}

export async function loadScheduleState(path: string): Promise<ScheduleState | null> {
  const resolved = resolve(path);
  if (!existsSync(resolved)) return null;

  const raw = await readFile(resolved, "utf-8");
  return JSON.parse(raw) as ScheduleState;
}

export async function saveScheduleState(path: string, state: ScheduleState): Promise<void> {
  const resolved = resolve(path);
  await writeFile(resolved, JSON.stringify(state, null, 2) + "\n", "utf-8");
}

export function addSessionToHistory(
  schedule: ScheduleState,
  session: SessionState,
  durationMinutes: number,
  chunksExtracted: number,
): void {
  const phasesWorked: PhaseId[] = [];
  for (const [id, progress] of Object.entries(session.phaseProgress)) {
    if (progress.questionsAsked > 0) {
      phasesWorked.push(Number(id) as PhaseId);
    }
  }

  const summary: SessionSummary = {
    sessionId: session.sessionId,
    date: new Date().toISOString(),
    durationMinutes,
    phasesWorked,
    questionsAsked: session.turns.filter((t) => t.role === "interviewer").length,
    chunksExtracted,
  };

  schedule.sessionsCompleted++;
  schedule.totalMinutesSpent += durationMinutes;
  schedule.sessionHistory.push(summary);
}

// ─── Transcript Generation ────────────────────────────────────────────────────

export function generateTranscript(state: SessionState): string {
  const lines: string[] = [
    `# Interview Transcript`,
    `Subject: ${state.subjectName}`,
    `Session: ${state.sessionId}`,
    `Date: ${state.startedAt}`,
    `Mode: ${state.mode}`,
    ``,
    `---`,
    ``,
  ];

  let currentPhase: PhaseId | null = null;

  for (const turn of state.turns) {
    if (turn.phase !== currentPhase) {
      currentPhase = turn.phase;
      lines.push(`## Phase ${currentPhase}`);
      lines.push(``);
    }

    const label = turn.role === "interviewer" ? "**Interviewer**" : "**Subject**";
    lines.push(`${label}: ${turn.content}`);
    lines.push(``);
  }

  return lines.join("\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSessionId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  return `session-${date}-${rand}`;
}

/**
 * Estimate session duration from turns (rough: 2 min per turn pair)
 */
export function estimateSessionDuration(state: SessionState): number {
  const questionCount = state.turns.filter((t) => t.role === "interviewer").length;
  return Math.max(1, questionCount * 2);
}

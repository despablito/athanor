import { describe, it, expect } from "vitest";
import {
  createSessionState,
  generateTranscript,
  createScheduleState,
  addSessionToHistory,
  getDefaultSchedule,
  estimateSessionDuration,
} from "./scheduler.js";
import type { PortraitJSON } from "./types.js";

function emptyPortrait(): PortraitJSON {
  return {
    version: "1.0.0-draft",
    subject: { name: "Test", id: "test" },
    created_at: new Date().toISOString(),
    chunks: [],
    relations: [],
    metadata: {
      completeness_score: 0,
      chunk_count: 0,
      relation_count: 0,
      cluster_coverage: {},
    },
  };
}

describe("createSessionState", () => {
  it("creates a valid session state", () => {
    const state = createSessionState("Alex", "sync");
    expect(state.subjectName).toBe("Alex");
    expect(state.mode).toBe("sync");
    expect(state.currentPhase).toBe(0);
    expect(state.turns).toEqual([]);
    expect(state.sessionId).toMatch(/^session-\d{8}-[a-z0-9]{4}$/);
  });

  it("accepts a custom start phase", () => {
    const state = createSessionState("Alex", "self", 2);
    expect(state.currentPhase).toBe(2);
  });

  it("initializes all phase progress to empty", () => {
    const state = createSessionState("Alex", "async");
    for (const id of [0, 1, 2, 3, 4]) {
      expect(state.phaseProgress[id as 0 | 1 | 2 | 3 | 4]).toEqual({
        questionsAsked: 0,
        completed: false,
      });
    }
  });
});

describe("generateTranscript", () => {
  it("generates a formatted transcript", () => {
    const state = createSessionState("Alex", "sync");
    state.turns = [
      { role: "interviewer", content: "What drives you?", timestamp: new Date().toISOString(), phase: 0 },
      { role: "subject", content: "Building things that matter.", timestamp: new Date().toISOString(), phase: 0 },
    ];

    const transcript = generateTranscript(state);
    expect(transcript).toContain("# Interview Transcript");
    expect(transcript).toContain("Subject: Alex");
    expect(transcript).toContain("**Interviewer**: What drives you?");
    expect(transcript).toContain("**Subject**: Building things that matter.");
    expect(transcript).toContain("## Phase 0");
  });

  it("handles phase transitions in transcript", () => {
    const state = createSessionState("Alex", "sync");
    state.turns = [
      { role: "interviewer", content: "Q1", timestamp: new Date().toISOString(), phase: 0 },
      { role: "subject", content: "A1", timestamp: new Date().toISOString(), phase: 0 },
      { role: "interviewer", content: "Q2", timestamp: new Date().toISOString(), phase: 1 },
      { role: "subject", content: "A2", timestamp: new Date().toISOString(), phase: 1 },
    ];

    const transcript = generateTranscript(state);
    expect(transcript).toContain("## Phase 0");
    expect(transcript).toContain("## Phase 1");
  });
});

describe("Schedule management", () => {
  it("getDefaultSchedule returns correct config for each mode", () => {
    const asyncSchedule = getDefaultSchedule("async");
    expect(asyncSchedule.sessionMinutes).toBe(30);
    expect(asyncSchedule.totalSessions).toBe(7);

    const syncSchedule = getDefaultSchedule("sync");
    expect(syncSchedule.sessionMinutes).toBe(330);

    const selfSchedule = getDefaultSchedule("self");
    expect(selfSchedule.sessionMinutes).toBe(30);
  });

  it("createScheduleState initializes correctly", () => {
    const portrait = emptyPortrait();
    const schedule = createScheduleState("async", portrait);
    expect(schedule.sessionsCompleted).toBe(0);
    expect(schedule.totalMinutesSpent).toBe(0);
    expect(schedule.sessionHistory).toEqual([]);
  });

  it("addSessionToHistory updates schedule state", () => {
    const portrait = emptyPortrait();
    const schedule = createScheduleState("async", portrait);
    const session = createSessionState("Alex", "async");
    session.phaseProgress[0].questionsAsked = 3;
    session.phaseProgress[1].questionsAsked = 2;

    addSessionToHistory(schedule, session, 30, 5);
    expect(schedule.sessionsCompleted).toBe(1);
    expect(schedule.totalMinutesSpent).toBe(30);
    expect(schedule.sessionHistory).toHaveLength(1);
    expect(schedule.sessionHistory[0].questionsAsked).toBe(0); // No interviewer turns
    expect(schedule.sessionHistory[0].chunksExtracted).toBe(5);
    expect(schedule.sessionHistory[0].phasesWorked).toContain(0);
    expect(schedule.sessionHistory[0].phasesWorked).toContain(1);
  });
});

describe("estimateSessionDuration", () => {
  it("estimates based on question count", () => {
    const state = createSessionState("Alex", "sync");
    state.turns = [
      { role: "interviewer", content: "Q1", timestamp: "", phase: 0 },
      { role: "subject", content: "A1", timestamp: "", phase: 0 },
      { role: "interviewer", content: "Q2", timestamp: "", phase: 0 },
      { role: "subject", content: "A2", timestamp: "", phase: 0 },
    ];

    expect(estimateSessionDuration(state)).toBe(4); // 2 questions * 2 min
  });

  it("returns at least 1 minute", () => {
    const state = createSessionState("Alex", "sync");
    expect(estimateSessionDuration(state)).toBe(1);
  });
});

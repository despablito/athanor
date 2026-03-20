import { describe, it, expect, vi } from "vitest";
import type { ChunkId, PortraitJSON } from "@athanor/core";
import { Interviewer, InterviewSessionImpl } from "./agent.js";
import { createSessionState } from "./scheduler.js";
import type { LLMProvider } from "@athanor/extractor";

// Mock the provider module so we don't need real API keys
vi.mock("@athanor/extractor", async (importOriginal) => {
  const original = await importOriginal<typeof import("@athanor/extractor")>();
  return {
    ...original,
    createProvider: () => ({
      complete: vi.fn().mockResolvedValue(JSON.stringify({
        isShallow: false,
        hasEmotion: false,
        hasContradiction: false,
        suggestedFollowUp: null,
        reason: "Good depth",
      })),
    }),
    Extractor: class MockExtractor {
      async fromTranscript() {
        return { chunks: [], classified: [], accepted: [], rejected: [], duplicates: [] };
      }
    },
  };
});

describe("Interviewer", () => {
  it("creates an interviewer instance", () => {
    const interviewer = new Interviewer({
      provider: "ollama",
    });
    expect(interviewer).toBeDefined();
  });

  it("starts a session", async () => {
    const interviewer = new Interviewer({ provider: "ollama" });
    const session = await interviewer.startSession({
      subjectName: "Test Subject",
      mode: "self",
      phase: 1,
    });

    expect(session.state.subjectName).toBe("Test Subject");
    expect(session.state.mode).toBe("self");
    expect(session.state.currentPhase).toBe(1);
  });
});

describe("InterviewSessionImpl", () => {
  function createTestSession(): InterviewSessionImpl {
    const mockProvider: LLMProvider = {
      complete: vi.fn().mockResolvedValue(JSON.stringify({
        isShallow: false,
        hasEmotion: false,
        hasContradiction: false,
        suggestedFollowUp: null,
        reason: "Good depth",
      })),
    };

    const state = createSessionState("Test", "self", 1);

    return new InterviewSessionImpl(
      mockProvider,
      { provider: "ollama" },
      state,
      { subjectName: "Test", mode: "self", phase: 1 },
    );
  }

  it("returns entry question first", async () => {
    const session = createTestSession();
    const question = await session.nextQuestion();

    expect(question).toBeTruthy();
    expect(question.length).toBeGreaterThan(10);
    expect(session.state.turns).toHaveLength(1);
    expect(session.state.turns[0].role).toBe("interviewer");
  });

  it("uses LLM for opening question when initial portrait has chunks", async () => {
    const mockComplete = vi
      .fn()
      .mockResolvedValueOnce(
        "Given how much you lean on boring tech under pressure, where do you still feel tempted to reach for novelty?",
      );

    const portrait: PortraitJSON = {
      version: "1.0.0-draft",
      subject: { name: "Pat", id: "pat" },
      created_at: new Date().toISOString(),
      chunks: [
        {
          chunk_id: "P-HEUR-001" as ChunkId,
          author: "Pat",
          cluster: "technical-decision-making",
          type: "heuristic",
          uniqueness: "CRITICAL",
          source: "interview",
          confidence: 0.9,
          context_tags: [],
          linked_chunks: [],
          content: "Under pressure, default to the most boring proven stack.",
        },
      ],
      relations: [],
      metadata: {
        completeness_score: 0.1,
        chunk_count: 1,
        relation_count: 0,
        cluster_coverage: { "technical-decision-making": 1 },
      },
    };

    const session = new InterviewSessionImpl(
      { complete: mockComplete },
      { provider: "ollama" },
      createSessionState("Pat", "self", 0),
      { subjectName: "Pat", mode: "self", phase: 0, initialPortrait: portrait },
    );

    const question = await session.nextQuestion();

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(question).toContain("boring");
    expect(session.state.turns[0].content).toContain("boring");
  });

  it("records subject answers", async () => {
    const session = createTestSession();
    await session.nextQuestion();

    const result = await session.submitAnswer(
      "I always start by understanding the constraints. What can't change? That's where I begin.",
    );

    expect(session.state.turns).toHaveLength(2);
    expect(session.state.turns[1].role).toBe("subject");
    expect(result.analysis).toBeDefined();
  });

  it("tracks phase progress", async () => {
    const session = createTestSession();
    await session.nextQuestion();
    await session.submitAnswer("Answer 1");

    expect(session.state.phaseProgress[1].questionsAsked).toBe(1);
  });

  it("isPhaseComplete returns false before minimum questions", () => {
    const session = createTestSession();
    expect(session.isPhaseComplete()).toBe(false);
  });

  it("advancePhase moves to next phase", () => {
    // Create with phase "all"
    const allSession = new InterviewSessionImpl(
      { complete: vi.fn().mockResolvedValue("") },
      { provider: "ollama" },
      createSessionState("Test", "self", 1),
      { subjectName: "Test", mode: "self", phase: "all" },
    );

    const next = allSession.advancePhase();
    expect(next).toBe(2);
    expect(allSession.state.currentPhase).toBe(2);
  });

  it("advancePhase returns null in single-phase mode", () => {
    const session = createTestSession();
    const next = session.advancePhase();
    expect(next).toBeNull();
  });

  it("getTranscript returns formatted text", async () => {
    const session = createTestSession();
    await session.nextQuestion();
    await session.submitAnswer("Test answer");

    const transcript = session.getTranscript();
    expect(transcript).toContain("# Interview Transcript");
    expect(transcript).toContain("Subject: Test");
    expect(transcript).toContain("**Interviewer**:");
    expect(transcript).toContain("**Subject**: Test answer");
  });
});

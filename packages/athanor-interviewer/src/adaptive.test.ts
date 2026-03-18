import { describe, it, expect, vi } from "vitest";
import { analyzeDepth } from "./adaptive.js";
import type { LLMProvider } from "@athanor/extractor";
import type { Turn } from "./types.js";

function makeMockProvider(response: string): LLMProvider {
  return {
    complete: vi.fn().mockResolvedValue(response),
  };
}

const sampleTurns: Turn[] = [
  {
    role: "interviewer",
    content: "What makes your approach to architecture different?",
    timestamp: new Date().toISOString(),
    phase: 1,
  },
  {
    role: "subject",
    content: "I think simplicity is really important in software architecture.",
    timestamp: new Date().toISOString(),
    phase: 1,
  },
];

describe("analyzeDepth", () => {
  it("detects shallow answers", async () => {
    const provider = makeMockProvider(JSON.stringify({
      isShallow: true,
      shallowReason: "Generic statement anyone could make",
      hasEmotion: false,
      hasContradiction: false,
      suggestedFollowUp: "Can you walk me through a specific case where simplicity won over a more complex solution?",
      reason: "The answer is too generic",
    }));

    const result = await analyzeDepth(
      provider,
      "I think simplicity is really important in software architecture.",
      sampleTurns,
    );

    expect(result.isShallow).toBe(true);
    expect(result.suggestedFollowUp).toBeTruthy();
  });

  it("detects emotional content", async () => {
    const provider = makeMockProvider(JSON.stringify({
      isShallow: false,
      hasEmotion: true,
      emotionType: "frustration",
      hasContradiction: false,
      suggestedFollowUp: "That frustration seems to run deep. When did you first notice this pattern?",
      reason: "Strong emotional response detected",
    }));

    const result = await analyzeDepth(
      provider,
      "It drives me absolutely crazy when people add complexity for the sake of looking smart.",
      sampleTurns,
    );

    expect(result.hasEmotion).toBe(true);
    expect(result.isShallow).toBe(false);
  });

  it("detects contradictions", async () => {
    const provider = makeMockProvider(JSON.stringify({
      isShallow: false,
      hasEmotion: false,
      hasContradiction: true,
      contradictionWith: "Earlier statement about preferring simplicity",
      suggestedFollowUp: "You mentioned preferring simplicity, but this sounds like you enjoy the complexity. How do you reconcile those?",
      reason: "Contradicts earlier position on simplicity",
    }));

    const result = await analyzeDepth(
      provider,
      "Actually, some of my best work has been on incredibly complex distributed systems.",
      sampleTurns,
    );

    expect(result.hasContradiction).toBe(true);
  });

  it("returns safe defaults on LLM failure", async () => {
    const provider = makeMockProvider("this is not valid json at all");

    const result = await analyzeDepth(
      provider,
      "Some answer",
      sampleTurns,
    );

    expect(result.isShallow).toBe(false);
    expect(result.hasEmotion).toBe(false);
    expect(result.hasContradiction).toBe(false);
    expect(result.reason).toBe("Analysis unavailable");
  });
});

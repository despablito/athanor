import { describe, it, expect } from "vitest";
import { PHASES, PHASE_ORDER, getPhase, getNextPhase, getPhaseSystemPrompt } from "./phases.js";
import type { PhaseId } from "./types.js";

describe("PHASES", () => {
  it("defines all 5 phases", () => {
    expect(Object.keys(PHASES)).toHaveLength(5);
    for (const id of [0, 1, 2, 3, 4] as PhaseId[]) {
      expect(PHASES[id]).toBeDefined();
      expect(PHASES[id].id).toBe(id);
      expect(PHASES[id].name).toBeTruthy();
      expect(PHASES[id].entryQuestions.length).toBeGreaterThan(0);
    }
  });

  it("each phase has valid minQuestions < maxQuestions", () => {
    for (const phase of Object.values(PHASES)) {
      expect(phase.minQuestions).toBeLessThan(phase.maxQuestions);
      expect(phase.minQuestions).toBeGreaterThanOrEqual(3);
    }
  });

  it("each phase targets valid chunk types", () => {
    const validTypes = [
      "heuristic", "anti-pattern", "preference", "belief", "fact",
      "skill", "emotion", "story", "contradiction", "style",
      "framework", "rant", "meta", "ritual",
    ];
    for (const phase of Object.values(PHASES)) {
      for (const type of phase.targetTypes) {
        expect(validTypes).toContain(type);
      }
    }
  });
});

describe("PHASE_ORDER", () => {
  it("contains all phases in order", () => {
    expect(PHASE_ORDER).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("getPhase", () => {
  it("returns the correct phase", () => {
    expect(getPhase(1).name).toBe("Taxonomy");
    expect(getPhase(3).name).toBe("Anti-Patterns + Emotions");
  });
});

describe("getNextPhase", () => {
  it("returns the next phase", () => {
    expect(getNextPhase(0)).toBe(1);
    expect(getNextPhase(1)).toBe(2);
    expect(getNextPhase(3)).toBe(4);
  });

  it("returns null for the last phase", () => {
    expect(getNextPhase(4)).toBeNull();
  });
});

describe("getPhaseSystemPrompt", () => {
  it("returns a non-empty prompt for each phase", () => {
    for (const id of PHASE_ORDER) {
      const prompt = getPhaseSystemPrompt(id);
      expect(prompt.length).toBeGreaterThan(50);
    }
  });
});

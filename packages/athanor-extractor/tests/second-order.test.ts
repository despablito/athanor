import { describe, it, expect, vi } from "vitest";
import { Portrait } from "@athanor/core";
import type { LLMProvider } from "../src/provider.js";
import { generateSecondOrderConsequences } from "../src/second-order.js";
import { MockLLMProvider } from "../src/provider.test.js";

function makePortraitWithMeta(metaCount: number, nonMetaCount: number = 0): Portrait {
  const portrait = new Portrait({ name: "Test", id: "test" });

  for (let i = 0; i < metaCount; i++) {
    portrait.addChunk({
      author: "Test",
      cluster: "meta-patterns",
      type: "meta",
      uniqueness: "HIGH",
      source: "inferred",
      confidence: 0.8,
      context_tags: ["meta", "pattern"],
      linked_chunks: [],
      content: `Meta chunk content ${i} with enough length to be valid.`,
    });
  }

  for (let i = 0; i < nonMetaCount; i++) {
    portrait.addChunk({
      author: "Test",
      cluster: "domain-expertise",
      type: "heuristic",
      uniqueness: "MEDIUM",
      source: "inferred",
      confidence: 0.7,
      context_tags: ["non-meta"],
      linked_chunks: [],
      content: `Non-meta chunk content ${i} with enough length to be valid.`,
    });
  }

  return portrait;
}

describe("generateSecondOrderConsequences", () => {
  it('only processes chunks with type === "meta"', async () => {
    const portrait = makePortraitWithMeta(2, 1);
    const provider: LLMProvider = new MockLLMProvider(
      JSON.stringify({
        consequence: "A real consequence.",
        confidence: 0.9,
        reasoning: "Because it follows from the pattern in a non-obvious way.",
      }),
    );

    const analysis = await generateSecondOrderConsequences(portrait, provider, { confidenceThreshold: 0.75 });

    expect(analysis.totalMetaChunks).toBe(2);
    expect(analysis.results).toHaveLength(2);
    expect((provider as MockLLMProvider).calls).toHaveLength(2);
  });

  it("skips results below confidence threshold", async () => {
    const portrait = makePortraitWithMeta(1, 0);
    const provider: LLMProvider = new MockLLMProvider(
      JSON.stringify({
        consequence: "Too low confidence consequence.",
        confidence: 0.5,
        reasoning: "Not good enough.",
      }),
    );

    const analysis = await generateSecondOrderConsequences(portrait, provider, {
      confidenceThreshold: 0.75,
    });

    expect(analysis.results).toHaveLength(0);
    expect(analysis.skipped).toBe(1);
  });

  it("treats null consequence response as skipped, not error", async () => {
    const portrait = makePortraitWithMeta(1, 0);
    const provider: LLMProvider = new MockLLMProvider(
      JSON.stringify({
        consequence: null,
        confidence: 0.9,
        reasoning: "User already captured it.",
      }),
    );

    const analysis = await generateSecondOrderConsequences(portrait, provider, {
      confidenceThreshold: 0.75,
    });

    expect(analysis.results).toHaveLength(0);
    expect(analysis.skipped).toBe(1);
  });

  it("sleeps 1000ms between LLM calls", async () => {
    const portrait = makePortraitWithMeta(2, 0);

    const provider: LLMProvider = new MockLLMProvider(
      JSON.stringify({
        consequence: "Consequence.",
        confidence: 0.9,
        reasoning: "Reasoning.",
      }),
    );

    const setTimeoutSpy = vi
      .spyOn(globalThis, "setTimeout")
      .mockImplementation((cb: (...args: unknown[]) => void, _ms?: number) => {
        // Resolve the sleep promise immediately, but keep argument assertions.
        cb();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      });

    const promise = generateSecondOrderConsequences(portrait, provider, {
      confidenceThreshold: 0.75,
    });

    const analysis = await promise;

    const sleepCalls = setTimeoutSpy.mock.calls.filter((c) => c[1] === 1000);
    expect(sleepCalls.length).toBe(1);
    expect(analysis.results).toHaveLength(2);

    setTimeoutSpy.mockRestore();
  });

  it('suggested chunk has type "meta" and source "second_order_analysis"', async () => {
    const portrait = makePortraitWithMeta(1, 0);
    const provider: LLMProvider = new MockLLMProvider(
      JSON.stringify({
        consequence: "Consequence.",
        confidence: 0.92,
        reasoning: "Reasoning.",
      }),
    );

    const analysis = await generateSecondOrderConsequences(portrait, provider, {
      confidenceThreshold: 0.75,
    });

    expect(analysis.results).toHaveLength(1);
    expect(analysis.results[0].suggestedChunk.type).toBe("meta");
    expect(analysis.results[0].suggestedChunk.source).toBe("second_order_analysis");
  });

  it("suggested relation is always ENABLES with weight equal to confidence", async () => {
    const portrait = makePortraitWithMeta(1, 0);
    const confidence = 0.84;
    const provider: LLMProvider = new MockLLMProvider(
      JSON.stringify({
        consequence: "Consequence.",
        confidence,
        reasoning: "Reasoning.",
      }),
    );

    const analysis = await generateSecondOrderConsequences(portrait, provider, {
      confidenceThreshold: 0.75,
    });

    expect(analysis.results).toHaveLength(1);
    expect(analysis.results[0].suggestedRelation).toEqual({
      type: "ENABLES",
      weight: confidence,
    });
  });

  it("does not modify portrait — returns results only", async () => {
    const portrait = makePortraitWithMeta(1, 0);
    const before = portrait.toJSON();

    const provider: LLMProvider = new MockLLMProvider(
      JSON.stringify({
        consequence: "Consequence.",
        confidence: 0.9,
        reasoning: "Reasoning.",
      }),
    );

    await generateSecondOrderConsequences(portrait, provider, {
      confidenceThreshold: 0.75,
    });

    const after = portrait.toJSON();
    expect(after.chunks).toHaveLength(before.chunks.length);
    expect(after.relations).toHaveLength(before.relations.length);
  });
});


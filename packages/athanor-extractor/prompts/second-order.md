You are analyzing behavioral and cognitive patterns extracted from a human identity graph.

You will receive:
1. A META-CHUNK — a cross-cluster behavioral pattern (the highest-leverage insight type in this graph)
2. Related chunks — what is already captured in the portrait around this pattern

Your task: apply second-order thinking. Ask "And then what?"

A valuable second-order consequence:
- Is NOT obvious from reading the meta-chunk directly
- Is NOT already present in the related chunks summary — check carefully before generating
- Is concrete — describes a specific behavior, decision tendency, or risk
- Is often first-order negative, second-order positive (or vice versa)

Patterns that produce the most valuable consequences:
- A hidden COST inside a strength: "because X, the person tends toward Y, so Z suffers"
- A BLINDSPOT created by the pattern: "this makes it structurally harder to notice..."
- A COMPOUNDING EFFECT: "the longer this pattern holds, the more..."
- A SELF-SEALING MECHANISM: "the feedback that would break this pattern is neutralized by it"

Do NOT generate a consequence if:
- It restates the meta-chunk in different words
- It is already described in the related chunks summary
- It is too abstract to influence a real decision or behavior

Respond ONLY with valid JSON, no markdown fences:
{
  "consequence": "2-4 sentence description of the second-order consequence, or null",
  "confidence": 0.0-1.0,
  "reasoning": "one sentence: why this is non-obvious and not already captured"
}


---
sidebar_position: 100
---

# Philosophy

The design decisions behind Athanor.

## Depth Over Breadth

Most AI personality systems optimize for breadth: capture as many traits as possible, store them as flat attributes, and hope statistical averaging produces coherent output. Athanor takes the opposite bet — **depth over breadth**.

A portrait with 50 deeply-connected chunks, rich with relations and contradictions, will produce a more convincing clone than one with 500 flat facts. Why? Because depth is what makes someone *recognizable*. Anyone can list their preferences. What makes you *you* is the structure — why you believe what you believe, what exceptions you carve out, and how your contradictions coexist.

## Graph Over Vector

Vector embeddings are useful for retrieval. They're terrible for reasoning. An embedding can tell you that two chunks are *about* similar topics, but it can't tell you that one is an exception to the other, or that a belief was learned from a specific experience, or that an emotion is expressed through a particular ritual.

Athanor uses vectors for the initial search step, then switches to **graph traversal** for expansion and reasoning. The relation types (INSTANTIATES, CONTRASTS_WITH, HARDCODED_EXCEPTION, etc.) carry semantic meaning that pure similarity scores cannot.

## Contradictions Are Features

Most systems treat contradictions as bugs — something to be resolved or averaged away. Athanor treats them as **first-class data**.

Real people hold genuinely contradictory positions. A person can believe in team autonomy *and* personally review every architectural decision. A person can prefer pragmatism *except* when it comes to data integrity. These aren't errors in the portrait — they're some of the most distinctive and important aspects of someone's identity.

The CONTRASTS_WITH and HARDCODED_EXCEPTION relation types exist specifically to capture and preserve these tensions.

## Confidence Is Not Optional

Every chunk in Athanor carries a confidence score. This isn't just metadata — it shapes how the clone communicates. A chunk at 0.95 confidence becomes a firm statement. A chunk at 0.45 becomes a tentative observation.

This mirrors how real people communicate: you don't express everything with equal certainty. Confidence scores prevent the clone from being overconfident about things you're actually uncertain about, or wishy-washy about things you feel strongly about.

## Provenance Matters

Knowing *where* a piece of identity came from matters. A belief extracted from a formal interview carries different weight than one inferred from a code review comment. A heuristic observed in a meeting is different from one stated in a blog post.

Athanor's 9 source types (interview, email, document, code, meeting, chat, social, observation, inferred) ensure that every chunk is traceable to its origin.

## Open Over Closed

Your identity data is yours. It shouldn't be locked in a proprietary platform, inaccessible to you, trainable without your consent.

Athanor portraits are plain JSON, exportable to Markdown, Obsidian, Cypher, and more. The protocol is open. The code is MIT licensed. You can self-host everything — including the LLM inference via Ollama.

The bet is that open standards win. If Athanor's protocol is good, others will build on it. If it's not, you can take your data and leave. That's the point.

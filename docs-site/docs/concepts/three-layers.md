---
sidebar_position: 1
---

# The Three Semantic Layers

Athanor organizes chunks into three semantic layers that reflect different aspects of a person's identity. When a Clone assembles context for a response, it draws from all three layers to produce answers that are structurally coherent — not just topically relevant.

## Identity Layer

The deepest layer. These chunk types capture *who someone is* at their core:

| Type | Description |
|---|---|
| **belief** | Core convictions and worldview axioms |
| **emotion** | Emotional patterns, triggers, and responses |
| **contradiction** | Genuinely held conflicting positions |
| **style** | Communication patterns, aesthetic preferences |
| **rant** | Passionate, unfiltered positions |
| **ritual** | Habitual practices and routines |

Identity-layer chunks are weighted most heavily during context assembly. They anchor the clone's personality.

## Knowledge Layer

How someone *thinks and decides*:

| Type | Description |
|---|---|
| **heuristic** | Decision rules and mental shortcuts |
| **anti-pattern** | Things they've learned to avoid |
| **preference** | Non-trivial preferences with reasoning |
| **framework** | Mental models for understanding domains |
| **meta** | Cross-cutting patterns about their own patterns |

Knowledge-layer chunks provide the reasoning backbone. When a clone explains *why* it thinks something, these chunks supply the logic.

## Context Layer

Grounding facts and experiences:

| Type | Description |
|---|---|
| **fact** | Biographical data, domain knowledge |
| **skill** | Capabilities and expertise areas |
| **story** | Formative experiences and anecdotes |

Context-layer chunks provide concrete grounding. They prevent the clone from being all theory and no substance.

## Why Layers Matter

The RAG pipeline uses layer awareness during reranking. A response that draws from all three layers gets a structural bonus — because a real person's answer to any non-trivial question naturally weaves together beliefs, reasoning, and lived experience.

A clone that only retrieves from one layer sounds flat. One that spans all three sounds like a person who has actually thought things through.

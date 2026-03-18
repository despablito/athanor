---
sidebar_position: 3
---

# Relations

Relations are directed edges between chunks. They encode *how* pieces of identity connect — not just that they co-occur, but the nature of their relationship. This is what makes Athanor a graph, not a bag of facts.

## Relation Types

### INSTANTIATES

A specific example of a general principle.

> Chunk A: "Always prefer boring technology over exciting technology" (heuristic)
> Chunk B: "Chose PostgreSQL over CockroachDB for the startup's database" (story)
> Relation: B **INSTANTIATES** A

### ENABLES

One chunk makes another possible or amplifies it.

> Chunk A: "Deep expertise in distributed systems" (skill)
> Chunk B: "Can spot coordination failures in microservice architectures before they manifest" (heuristic)
> Relation: A **ENABLES** B

### LEARNED_FROM

A chunk was derived from an experience or observation.

> Chunk A: "The 2019 migration disaster that took the team 6 months to recover from" (story)
> Chunk B: "Never do a big-bang migration — always run parallel systems" (anti-pattern)
> Relation: B **LEARNED_FROM** A

### CONTRASTS_WITH

Two chunks exist in genuine tension. Not an error — humans hold contradictory positions.

> Chunk A: "Believes strongly in team autonomy" (belief)
> Chunk B: "Reviews every architectural decision personally" (ritual)
> Relation: A **CONTRASTS_WITH** B

### HARDCODED_EXCEPTION

A specific override to a general rule. The clone must respect these — they're non-negotiable carve-outs.

> Chunk A: "Generally favors pragmatism over correctness" (heuristic)
> Chunk B: "Never compromises on data integrity — will delay a launch over it" (anti-pattern)
> Relation: B **HARDCODED_EXCEPTION** A

### EXPRESSED_THROUGH

An internal state manifests as an external behavior.

> Chunk A: "Anxiety about losing institutional knowledge" (emotion)
> Chunk B: "Obsessively documents every decision in ADRs" (ritual)
> Relation: A **EXPRESSED_THROUGH** B

## How Relations Power Retrieval

The Clone API's RAG pipeline uses relations during the **graph expansion** phase. When a vector search finds relevant chunks, the pipeline walks the relation graph (up to depth 2) to pull in connected context:

1. **Direct relations** get the highest bonus (1.3x)
2. **2-hop relations** get a smaller bonus (1.1x)
3. The result is a response grounded not just in *what* the person thinks, but *why* and *how* they arrived there

## Structure

```json
{
  "source": "TDM-HEUR-001",
  "target": "TDM-STOR-005",
  "type": "LEARNED_FROM",
  "description": "The monolith-first heuristic was learned from the 2019 migration incident"
}
```

Relations are always directional: `source → target`. The description field is optional but recommended for complex relationships.

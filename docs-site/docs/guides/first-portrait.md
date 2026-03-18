---
sidebar_position: 2
---

# Your First Portrait

This tutorial walks you through creating a Portrait from scratch — initializing it, adding chunks manually, validating, and exploring the result.

## Initialize

```bash
athanor init "Alex Chen"
```

This creates a `portrait.json` file with the basic structure:

```json
{
  "version": "1.0.0",
  "subject": {
    "name": "Alex Chen",
    "id": "alex-chen"
  },
  "created_at": "2026-03-18T00:00:00.000Z",
  "chunks": [],
  "relations": [],
  "metadata": {
    "completeness_score": 0,
    "chunk_count": 0,
    "relation_count": 0,
    "cluster_coverage": {}
  }
}
```

## Add Chunks Manually

You can add chunks by editing the JSON directly. Let's add a few:

```json
{
  "chunks": [
    {
      "chunk_id": "TDM-HEUR-001",
      "author": "self",
      "cluster": "technical-decision-making",
      "type": "heuristic",
      "uniqueness": "CRITICAL",
      "source": "interview",
      "confidence": 0.95,
      "context_tags": ["architecture", "scale"],
      "linked_chunks": [],
      "content": "Always start with the simplest architecture that could work. Premature optimization of system design is just as dangerous as premature code optimization, but harder to undo."
    },
    {
      "chunk_id": "TL-BELI-001",
      "author": "self",
      "cluster": "team-leadership",
      "type": "belief",
      "uniqueness": "HIGH",
      "source": "observation",
      "confidence": 0.88,
      "context_tags": ["management", "hiring"],
      "linked_chunks": ["TDM-HEUR-001"],
      "content": "The best engineering teams are built around shared principles, not shared skill sets. Diverse skills with aligned values beats homogeneous expertise every time."
    },
    {
      "chunk_id": "EL-EMOT-001",
      "author": "self",
      "cluster": "emotional-landscape",
      "type": "emotion",
      "uniqueness": "CRITICAL",
      "source": "interview",
      "confidence": 0.82,
      "context_tags": ["stress", "decision-making"],
      "linked_chunks": [],
      "content": "Experiences genuine anxiety when forced to make irreversible decisions with incomplete information. Copes by explicitly listing what's reversible vs. irreversible, then being bold on the reversible parts."
    }
  ]
}
```

## Add Relations

Connect the chunks:

```json
{
  "relations": [
    {
      "source": "TDM-HEUR-001",
      "target": "TL-BELI-001",
      "type": "ENABLES",
      "description": "Simple architecture principle enables diverse team composition"
    },
    {
      "source": "EL-EMOT-001",
      "target": "TDM-HEUR-001",
      "type": "EXPRESSED_THROUGH",
      "description": "Decision anxiety channels into start-simple heuristic"
    }
  ]
}
```

## Validate

```bash
athanor validate ./portrait.json
```

The validator checks:
- All chunks have valid structure and types
- Content meets minimum length (20 chars)
- Confidence values are in range
- At least 30% of chunks are CRITICAL
- No orphaned chunks (chunks referenced but not defined)
- Cluster coverage across recommended clusters

## View Statistics

```bash
athanor stats ./portrait.json
```

Output:
```
Portrait: Alex Chen
Chunks: 3
Relations: 2
Clusters: 3 (technical-decision-making, team-leadership, emotional-landscape)
Completeness: 0.15
Critical ratio: 66.7%
Average confidence: 0.88
```

## Export

```bash
# Markdown report
athanor export ./portrait.json --format markdown --output portrait.md

# Obsidian vault (one file per chunk)
athanor export ./portrait.json --format obsidian --output ./vault/

# Cypher statements for Neo4j/AGE
athanor export ./portrait.json --format cypher --output portrait.cypher
```

## Next Steps

- [AI Extraction](ai-extraction) — Use LLMs to extract chunks automatically
- [Self-Portrait](self-portrait) — Build a portrait from your own conversations
- [Deploying a Clone](deploying-clone) — Talk to your portrait

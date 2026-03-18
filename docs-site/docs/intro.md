---
sidebar_position: 1
slug: /intro
---

# What is Athanor?

Athanor is an open-source toolkit for capturing, structuring, and deploying deep identity clones. Unlike shallow approaches that reduce a person to a handful of traits or vector embeddings, Athanor models identity as a **typed knowledge graph** — preserving the reasoning, contradictions, emotions, and contextual nuances that make someone who they are.

## The Problem

Most AI personality tools work like this: feed in some writing samples, generate an embedding, and hope the model can mimic the style. The result? Clones that sound vaguely right on the surface but collapse when you ask *why* they hold a belief, what exceptions they'd make, or how two contradictory preferences coexist.

## Athanor's Approach

Athanor breaks identity into atomic units called **Chunks** — heuristics, beliefs, emotions, contradictions, anti-patterns, rituals, and more. Each chunk carries:

- **Type** — One of 14 semantic types (heuristic, belief, emotion, contradiction, etc.)
- **Uniqueness** — How distinctive this is to the person (CRITICAL, HIGH, MEDIUM)
- **Confidence** — How certain we are about this chunk (0.0–1.0)
- **Provenance** — Where the chunk was observed (interview, email, code, etc.)

Chunks connect via **Relations** — directed edges like INSTANTIATES, CONTRASTS_WITH, and HARDCODED_EXCEPTION — forming a traversable graph called a **Portrait**.

When you ask an Athanor Clone a question, it doesn't just do keyword search. It runs a **graph-aware RAG pipeline** that:

1. Finds semantically relevant chunks
2. Expands through the relation graph to pull connected reasoning
3. Reranks by uniqueness, structural importance, and layer coverage
4. Assembles context spanning identity, knowledge, and contextual layers

## Key Components

| Component | What it does |
|---|---|
| **@athanor/core** | Types, Portrait class, GraphStore, validation, export (JSON/Cypher/Markdown/Obsidian) |
| **@athanor/extractor** | LLM-powered extraction: chunking, classification, relation detection, meta-generation |
| **@athanor/clone-api** | REST API with graph-aware RAG pipeline for talking to clones |
| **@athanor/explorer** | Next.js web UI with D3 force-directed graph visualization |
| **@athanor/cli** | Full portrait lifecycle: init, extract, validate, export, serve, explore |
| **@athanor/mcp-server** | Model Context Protocol integration for AI assistants |

## Next Steps

- [Installation](guides/installation) — Get Athanor running locally
- [Core Concepts](concepts/three-layers) — Understand the three semantic layers
- [First Portrait](guides/first-portrait) — Build your first identity portrait
- [Philosophy](philosophy) — Why depth beats breadth

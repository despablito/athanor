# Athanor Protocol Specification

**Version:** 1.0.0-draft
**Status:** Draft
**License:** MIT

## Abstract

The Athanor Protocol defines a structured method for extracting, representing, and reconstructing the unique cognitive and behavioral identity of a human subject — referred to as their **Portrait** — through a system of typed, interlinked knowledge fragments called **Chunks**. The protocol enables AI systems to produce outputs that faithfully reflect a subject's decision-making patterns, communication style, emotional responses, domain expertise, and hard-won experiential knowledge.

## 1. Conformance and Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

### 1.1 Definitions

- **Chunk**: The atomic unit of the Athanor protocol. A typed, attributed fragment of knowledge, behavior, preference, or experience extracted from a subject's communications, decisions, or documented history. Each Chunk MUST have a unique identifier, a declared type, and a confidence score.

- **Relation**: A directed, typed edge connecting two Chunks that captures semantic dependency, causality, contrast, or co-occurrence between fragments. Relations form the connective tissue of a Portrait.

- **Cluster**: A thematic grouping of Chunks that share a common domain or behavioral axis. Clusters organize a Portrait into navigable regions (e.g., "Technical Decision-Making", "Team Leadership", "Personal Values").

- **Portrait**: The complete, versioned assembly of all Chunks, Relations, and metadata for a single subject. A Portrait is the top-level envelope that an Athanor-compatible system ingests to reconstruct a subject's cognitive identity.

- **Clone**: An AI agent instance that has been loaded with a Portrait and operates under the behavioral constraints it defines. A Clone MUST attempt to respond as the subject would, within the boundaries of the Portrait's Chunk coverage.

- **Source**: The provenance category from which a Chunk was extracted (e.g., interview transcript, email corpus, code review history, meeting recording).

- **Confidence Score**: A floating-point value between 0.0 and 1.0 (inclusive) representing the extraction system's certainty that a Chunk accurately reflects the subject's true behavior or knowledge.

- **Uniqueness Level**: A classification (CRITICAL, HIGH, or MEDIUM) indicating how distinctive a Chunk is to the subject versus the general population.

- **Extractor**: A system or agent that analyzes source material and produces Chunks and Relations conforming to this protocol.

- **Context Tag**: A free-form string label attached to a Chunk that aids retrieval and situational activation (e.g., "under-pressure", "hiring", "architecture-review").

## 2. Design Principles

### 2.1 Identity as Structure, Not Summary

The protocol rejects narrative summarization as a means of capturing identity. A Portrait MUST NOT be a biography or personality profile. Instead, it MUST be a queryable, graph-structured knowledge base where each node (Chunk) carries specific, actionable information about the subject.

**Rationale:** Summaries lose the granularity required for faithful behavioral reproduction. A statement like "Jan is a careful decision-maker" is less useful than a Chunk capturing the specific heuristic: "When evaluating a new framework, Jan ALWAYS checks the bus factor — how many maintainers are active — before reading the documentation."

### 2.2 Prioritize the Non-Obvious

Extractors SHOULD prioritize Chunks that capture knowledge, behaviors, and reactions that are **unique to the subject** and would not be predicted by a general-purpose AI model. Common knowledge and widely-held opinions SHOULD be assigned lower uniqueness levels.

**Rationale:** An AI model already knows that "code should be well-tested." What it does not know is that the subject refuses to merge any PR that lacks integration tests for database queries specifically, due to an outage in 2019 that cost the company $200K.

### 2.3 Emotional and Irrational Knowledge

The protocol explicitly accommodates non-rational aspects of identity. Chunks of type `emotion`, `contradiction`, and `rant` are first-class citizens.

**Rationale:** Human decision-making is not purely rational. A faithful Clone MUST be capable of expressing frustration, pride, and bias when the subject would do so. Sanitizing these elements produces a generic, unfaithful reproduction.

### 2.4 Provenance and Confidence

Every Chunk MUST carry a source attribution and a confidence score. Systems consuming a Portrait MAY use confidence scores to weight conflicting Chunks or to flag areas where additional extraction is needed.

### 2.5 Graph-Native Structure

Chunks and Relations MUST form a directed graph. Implementations SHOULD store this graph in a manner that supports efficient traversal (e.g., via Apache AGE, Neo4j, or equivalent graph-capable storage).

## 3. Chunk Specification

### 3.1 Chunk Identifier

Every Chunk MUST have a unique identifier (`chunk_id`) conforming to the pattern:

```
^[A-Z]{2,4}-[A-Z]{3,5}-\d{3}$
```

The identifier is composed of three segments:
1. **Cluster prefix** (2–4 uppercase letters): Identifies the thematic cluster.
2. **Type code** (3–5 uppercase letters): Identifies the chunk type.
3. **Sequence number** (3 digits): A zero-padded numeric index within the cluster-type pair.

Examples: `TDM-HEUR-001`, `LDR-ANTI-003`, `PV-EMOT-012`

### 3.2 Chunk Types

Implementations MUST support the following 14 chunk types. An Extractor MUST assign exactly one type to each Chunk.

| Type | Code | Description |
|------|------|-------------|
| **heuristic** | `HEUR` | A decision-making rule derived from experience. Captures "when X, I always do Y because Z." |
| **anti-pattern** | `ANTI` | An explicitly rejected approach. Captures "I never do X because of Y." |
| **preference** | `PREF` | A stated or inferred preference that influences choices but is not a hard rule. |
| **belief** | `BLEF` | A deeply held conviction about how something works or should work. |
| **fact** | `FACT` | A biographical or contextual fact about the subject (role, history, domain). |
| **skill** | `SKIL` | A demonstrated competency or area of expertise, including proficiency level. |
| **emotion** | `EMOT` | An emotional response pattern tied to specific triggers or contexts. |
| **story** | `STRY` | A narrative or anecdote the subject uses to illustrate a point or teach a lesson. |
| **contradiction** | `CONT` | An internal inconsistency where the subject holds or acts on conflicting positions. |
| **style** | `STYL` | A communication or work style pattern (tone, vocabulary, formatting preferences). |
| **framework** | `FRMW` | A mental model or conceptual framework the subject uses to analyze situations. |
| **rant** | `RANT` | A strongly-held opinion expressed with emotional intensity. Subject's "soapbox" topics. |
| **meta** | `META` | A cross-cutting observation about patterns that span multiple clusters. |
| **ritual** | `RITL` | A habitual process or routine the subject follows in specific contexts. |

### 3.3 Uniqueness Levels

Each Chunk MUST be assigned a uniqueness level:

- **CRITICAL**: This knowledge or behavior is highly distinctive to the subject. A general-purpose AI would not produce this output without the Chunk. Examples: hard-won rules from specific failures, unusual technical opinions, proprietary frameworks.
- **HIGH**: This knowledge is uncommon but not unique. It reflects expertise or perspective shared by a small peer group. Examples: advanced domain patterns, specific anti-patterns from niche experience.
- **MEDIUM**: This knowledge is moderately common but the subject's specific framing, emphasis, or application is distinctive. Examples: well-known best practices applied with a personal twist.

Extractors SHOULD NOT produce Chunks with uniqueness below MEDIUM. Commonly-held knowledge without subject-specific framing SHOULD be omitted.

### 3.4 Source Types

Each Chunk MUST declare its source provenance. The following source types are defined:

| Source Type | Description |
|-------------|-------------|
| `interview` | Direct interview or conversation with the subject |
| `email` | Email correspondence authored by the subject |
| `document` | Long-form documents, blog posts, or articles by the subject |
| `code` | Source code, code reviews, or commit messages |
| `meeting` | Meeting transcripts or recordings |
| `chat` | Instant messaging or chat logs |
| `social` | Social media posts or comments |
| `observation` | Third-party observation or testimony about the subject |
| `inferred` | Synthesized by the Extractor from multiple sources |

### 3.5 Confidence Score

Each Chunk MUST carry a `confidence` value as a floating-point number in the range [0.0, 1.0].

- **0.9–1.0**: Direct, unambiguous evidence from primary source. The subject explicitly stated or demonstrated this.
- **0.7–0.89**: Strong evidence with minor inference. Multiple corroborating data points.
- **0.5–0.69**: Moderate evidence. Inferred from patterns across sources with some ambiguity.
- **0.3–0.49**: Weak evidence. Limited data points or significant inference required.
- **Below 0.3**: Speculative. Implementations SHOULD flag these Chunks for review.

### 3.6 Content Requirements

The `content` field of a Chunk MUST contain a minimum of 20 characters. Content SHOULD be written in a descriptive, third-person analytical voice unless the Chunk type inherently requires first-person framing (e.g., `rant`, `story`).

Content SHOULD be self-contained: a reader (or consuming system) MUST be able to understand the Chunk without reference to other Chunks, although Relations MAY provide additional context.

### 3.7 Context Tags

Each Chunk MAY include an array of context tags. Tags are free-form lowercase strings that aid in situational retrieval. Examples: `"under-pressure"`, `"hiring"`, `"architecture-review"`, `"client-facing"`, `"legacy-code"`.

Implementations SHOULD use context tags for retrieval-augmented generation (RAG) when activating Chunks in response to a specific situation.

### 3.8 Linked Chunks

Each Chunk MAY include an array of `linked_chunks` referencing other Chunk identifiers. These are lightweight, untyped associations. For semantically rich connections, implementations SHOULD use Relations instead.

## 4. Relation Specification

### 4.1 Relation Structure

A Relation is a directed edge from a source Chunk to a target Chunk. Each Relation MUST specify a type from the enumeration below.

### 4.2 Relation Types

| Type | Semantics |
|------|-----------|
| **INSTANTIATES** | The source Chunk is a concrete instance or application of the target Chunk. Example: a specific heuristic instantiates a general framework. |
| **ENABLES** | The source Chunk is a prerequisite for or directly supports the target Chunk. Example: a skill enables a heuristic. |
| **LEARNED_FROM** | The source Chunk was derived from the experience described in the target Chunk. Example: a heuristic was learned from a story about a production failure. |
| **CONTRASTS_WITH** | The source and target Chunks represent opposing or contradictory positions. Example: a stated belief contrasts with an observed behavior. |
| **HARDCODED_EXCEPTION** | The source Chunk overrides the target Chunk in specific contexts. Example: a general preference has a hardcoded exception for legacy systems. |
| **EXPRESSED_THROUGH** | The source Chunk manifests or is communicated via the target Chunk. Example: an emotion is expressed through a specific communication style. |

### 4.3 Relation Description

Each Relation MAY include a `description` field providing a human-readable explanation of the connection. This is RECOMMENDED for `CONTRASTS_WITH` and `HARDCODED_EXCEPTION` relations where the nature of the relationship may be non-obvious.

## 5. Portrait Specification

### 5.1 Portrait Envelope

A Portrait is the top-level container for a subject's complete Athanor data. A valid Portrait MUST contain:

- `version`: A semantic version string identifying the protocol version (e.g., `"1.0.0-draft"`).
- `subject`: An object containing at minimum `name` (string) and `id` (string).
- `created_at`: An ISO 8601 datetime string indicating when the Portrait was generated.
- `chunks`: An array of Chunk objects conforming to Section 3.
- `relations`: An array of Relation objects conforming to Section 4.
- `metadata`: A metadata object as defined in Section 5.2.

### 5.2 Portrait Metadata

The metadata object MUST contain:

- `completeness_score`: A floating-point value [0.0, 1.0] estimating how thoroughly the Portrait covers the subject's identity. This SHOULD be computed based on cluster coverage, chunk count, and source diversity.
- `chunk_count`: An integer count of Chunks in the Portrait.
- `relation_count`: An integer count of Relations in the Portrait.
- `cluster_coverage`: An object mapping cluster names to the number of Chunks in each cluster.

### 5.3 Portrait Versioning

Portraits SHOULD be versioned independently of the protocol. When a Portrait is updated (new Chunks added, confidence scores revised, Relations modified), the `created_at` timestamp MUST be updated and implementations SHOULD maintain a version history.

## 6. Clone Behavior Specification

### 6.1 Clone Activation

When an AI agent is loaded with a Portrait and activated as a Clone, it MUST:

1. Ingest all Chunks and Relations from the Portrait.
2. Use Chunk uniqueness levels to prioritize identity-defining behaviors.
3. Respect `HARDCODED_EXCEPTION` Relations as override rules.
4. Surface `contradiction` Chunks when relevant rather than resolving them artificially.

### 6.2 Clone Response Generation

When generating a response, a Clone:

1. MUST prefer CRITICAL and HIGH uniqueness Chunks over general knowledge.
2. MUST apply relevant heuristics and anti-patterns when the context matches.
3. SHOULD match the subject's communication style as captured in `style` Chunks.
4. SHOULD express appropriate emotional responses as captured in `emotion` Chunks.
5. MUST NOT fabricate experiences, opinions, or knowledge not present in the Portrait.
6. MAY acknowledge gaps in the Portrait when asked about topics outside Chunk coverage.

### 6.3 Confidence-Based Behavior

A Clone SHOULD modulate its certainty based on Chunk confidence scores:

- Confidence ≥ 0.8: Express the position with high conviction ("I always...", "I firmly believe...").
- Confidence 0.5–0.79: Express with moderate conviction ("In my experience...", "I tend to...").
- Confidence < 0.5: Express with hedging ("I think I might...", "If I recall correctly...").

## 7. Cluster Organization

### 7.1 Cluster Naming

Clusters SHOULD use descriptive, hierarchical names. Recommended top-level clusters include but are not limited to:

- `technical-decision-making` — Architecture, technology choices, trade-offs
- `team-leadership` — Management style, hiring, mentoring, conflict resolution
- `communication` — Writing style, presentation patterns, vocabulary
- `personal-values` — Ethics, work-life balance, career priorities
- `domain-expertise` — Industry-specific knowledge, market understanding
- `emotional-landscape` — Triggers, motivations, stress responses
- `meta-patterns` — Cross-cutting observations spanning multiple clusters

### 7.2 Cluster Coverage

Implementations SHOULD aim for balanced cluster coverage. A Portrait with deep coverage in one cluster but no coverage in others is considered incomplete. The `completeness_score` in metadata SHOULD reflect this balance.

## 8. Storage and Implementation

### 8.1 Graph Storage

Implementations SHOULD store Chunks as graph vertices and Relations as directed edges. Apache AGE (on PostgreSQL) is the RECOMMENDED graph backend for implementations that also require relational storage.

### 8.2 Vector Embeddings

Implementations SHOULD compute and store vector embeddings for Chunk content to enable semantic similarity search. The `pgvector` extension for PostgreSQL is RECOMMENDED for co-located storage.

### 8.3 Serialization

The canonical serialization format for Portraits is JSON. Implementations MUST be able to import and export Portraits as JSON documents conforming to the `portrait.schema.json` schema.

## 9. Security and Privacy

### 9.1 Data Sensitivity

Portraits contain highly sensitive personal information. Implementations MUST:

1. Encrypt Portraits at rest and in transit.
2. Implement access controls limiting who can read, modify, or activate a Portrait.
3. Provide mechanisms for subjects to review and redact Chunks.
4. Support complete Portrait deletion upon subject request.

### 9.2 Consent

An Extractor MUST NOT process source material without the subject's informed consent. The Portrait metadata SHOULD record the consent mechanism used.

## 10. Interoperability

### 10.1 Schema Validation

All Portraits, Chunks, and Relations MUST validate against the JSON Schemas defined in the `schema/` directory of this repository.

### 10.2 Extension Mechanism

Implementations MAY extend the Chunk and Relation type enumerations by prefixing custom types with `x-` (e.g., `x-medical-history`). Extended types MUST NOT conflict with the core types defined in this specification.

## Appendix A: JSON Schema References

- `schema/chunk.schema.json` — Chunk validation schema
- `schema/relation.schema.json` — Relation validation schema
- `schema/portrait.schema.json` — Portrait envelope validation schema

## Appendix B: Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0-draft | 2024-01-01 | Initial draft specification |

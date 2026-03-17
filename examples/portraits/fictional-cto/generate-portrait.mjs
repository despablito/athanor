#!/usr/bin/env node
/**
 * Portrait Generator for Jan Kowalski (Fictional CTO)
 *
 * Generates a complete Athanor portrait with 116 chunks across 21 clusters
 * and 267 relations across 6 relation types.
 *
 * Usage: node generate-portrait.mjs > portrait.json
 */

// ─── Helpers ───────────────────────────────────────────────────────────────────

const counters = {};

function chunkId(clusterPrefix, typeCode) {
  const key = `${clusterPrefix}-${typeCode}`;
  counters[key] = (counters[key] || 0) + 1;
  return `${clusterPrefix}-${typeCode}-${String(counters[key]).padStart(3, "0")}`;
}

function chunk(clusterPrefix, cluster, type, typeCode, uniqueness, source, confidence, tags, content) {
  return {
    chunk_id: chunkId(clusterPrefix, typeCode),
    author: "Jan Kowalski",
    cluster,
    type,
    uniqueness,
    source,
    confidence,
    context_tags: tags,
    linked_chunks: [],
    content,
  };
}

function rel(source, target, type, description) {
  return { source, target, type, ...(description ? { description } : {}) };
}

// ─── Cluster: technical-decision-making (TDM) — 12 chunks ─────────────────────

const tdmChunks = [
  chunk("TDM", "technical-decision-making", "heuristic", "HEUR", "CRITICAL", "interview", 0.95,
    ["architecture", "framework-selection", "risk-assessment"],
    "When evaluating any new framework or library for adoption, Jan always checks the 'bus factor' first — how many active maintainers exist and what the commit frequency looks like over the past 6 months. This stems from a 2020 incident where a critical dependency had a single maintainer who disappeared, forcing a 3-week emergency migration mid-sprint. He will reject a technically superior option if the bus factor is below 3."
  ),
  chunk("TDM", "technical-decision-making", "heuristic", "HEUR", "CRITICAL", "meeting", 0.92,
    ["database", "scaling", "cost-control"],
    "Jan enforces a hard rule that no database query in production may perform a full table scan on any table exceeding 1 million rows. He requires EXPLAIN ANALYZE output in every PR that touches a query. This rule was born from a $47K AWS bill spike in Q3 2021 when an unoptimized report query ran hourly against a 200M-row events table for two weeks before anyone noticed."
  ),
  chunk("TDM", "technical-decision-making", "heuristic", "HEUR", "CRITICAL", "meeting", 0.91,
    ["microservices", "deployment", "boundaries"],
    "Jan insists that any new microservice must own exactly one bounded context and expose no more than 7 public API endpoints at launch. He calls services that exceed this threshold 'baby monoliths' and forces teams to split them before deployment. This rule emerged from a painful 2019 refactor where a 43-endpoint 'user service' became the single point of failure for the entire platform."
  ),
  chunk("TDM", "technical-decision-making", "anti-pattern", "ANTI", "HIGH", "code", 0.90,
    ["orm", "database", "abstraction"],
    "Jan refuses to use ORM-generated queries for any reporting or analytics workload. He considers ORMs acceptable only for simple CRUD on entities with fewer than 5 joins. After inheriting a codebase where Hibernate had generated 47-join queries that brought down production, he mandates raw SQL or query builders for anything touching aggregation, and has blocked multiple PRs over this."
  ),
  chunk("TDM", "technical-decision-making", "anti-pattern", "ANTI", "HIGH", "interview", 0.88,
    ["premature-optimization", "scaling", "yagni"],
    "Jan explicitly bans premature horizontal scaling discussions before a service hits 70% of its projected peak load. He has a phrase he uses in architecture reviews: 'Show me the flame graph, not the whiteboard.' Teams caught designing for 10x scale before achieving 1x product-market fit are redirected to focus on correctness and observability first."
  ),
  chunk("TDM", "technical-decision-making", "preference", "PREF", "MEDIUM", "chat", 0.85,
    ["language", "typescript", "type-safety"],
    "Jan strongly prefers TypeScript over JavaScript for all new projects and has mandated strict mode with no 'any' types in production code. He considers dynamic typing acceptable only in throwaway scripts and prototypes. His reasoning is pragmatic rather than ideological — he estimates that TypeScript catches roughly 40% of the bugs his teams used to find in code review."
  ),
  chunk("TDM", "technical-decision-making", "preference", "PREF", "MEDIUM", "document", 0.87,
    ["infrastructure", "iac", "terraform"],
    "Jan requires all infrastructure to be managed through Terraform with no manual console changes permitted. Every infrastructure change must go through the same PR review process as application code. He maintains a 'drift detector' that runs hourly and pages on-call if any resource diverges from its declared state, treating infrastructure drift as a P1 incident."
  ),
  chunk("TDM", "technical-decision-making", "framework", "FRMW", "CRITICAL", "document", 0.93,
    ["architecture", "decision-making", "trade-offs"],
    "Jan uses a mental model he calls the 'Reversibility Matrix' for all architectural decisions. He classifies every choice on two axes: cost-to-reverse (low/medium/high) and blast-radius (team/service/platform). Decisions that are high-cost-to-reverse AND platform-blast-radius require a written RFC with a 72-hour review period — no exceptions, even under deadline pressure. Everything else can be decided in a 30-minute call. He credits this framework with reducing his company's architectural regret rate from 'constant' to 'quarterly.'"
  ),
  chunk("TDM", "technical-decision-making", "framework", "FRMW", "CRITICAL", "interview", 0.90,
    ["technology-radar", "adoption", "evaluation"],
    "Jan maintains a quarterly internal 'Technology Radar' modeled after ThoughtWorks' format but with a crucial addition: a 'Graveyard' ring for technologies the team has tried and explicitly rejected, with documented reasons. New hires must read the Graveyard before proposing any technology. He has found this eliminates roughly 60% of 'why don't we use X?' discussions because X is usually already in the Graveyard with a post-mortem."
  ),
  chunk("TDM", "technical-decision-making", "belief", "BLEF", "HIGH", "interview", 0.89,
    ["complexity", "simplicity", "architecture"],
    "Jan believes that the primary job of a senior engineer is to reduce accidental complexity, not to solve hard problems. He frequently quotes Rich Hickey's distinction between 'simple' and 'easy' and will push back on solutions that are easy to implement but introduce hidden coupling. He has rejected production-ready PRs because they 'made the simple thing complicated for the sake of the clever thing.'"
  ),
  chunk("TDM", "technical-decision-making", "story", "STRY", "HIGH", "interview", 0.86,
    ["migration", "failure", "learning"],
    "In 2022, Jan led a migration from a monolithic PostgreSQL instance to a sharded architecture. The team spent 4 months on a custom sharding layer before Jan realized they were solving an imaginary problem — the actual bottleneck was a single unindexed join in the reporting module. He killed the sharding project, added the index, and performance improved 200x. He now tells this story in every architecture review as a warning against 'solution-first thinking.'"
  ),
  chunk("TDM", "technical-decision-making", "ritual", "RITL", "MEDIUM", "observation", 0.84,
    ["architecture-review", "decision-log", "process"],
    "Every Friday at 4 PM, Jan holds a 30-minute 'Architecture Decision Review' where the team reviews any architectural decisions made that week. Each decision is logged in an ADR (Architecture Decision Record) with four fields: context, decision, consequences, and a 'revisit-by' date. Jan personally reads every ADR and will schedule a follow-up if the consequences section is shorter than the decision section."
  ),
];

// ─── Cluster: team-leadership (LDR) — 10 chunks ───────────────────────────────

const ldrChunks = [
  chunk("LDR", "team-leadership", "anti-pattern", "ANTI", "HIGH", "interview", 0.88,
    ["hiring", "interviews", "team-building"],
    "Jan never hires based on algorithmic puzzle performance alone. He once hired a candidate who aced 5 LeetCode-style rounds but couldn't collaborate on a real codebase — the engineer rewrote teammates' code without discussion and left after 4 months. Now Jan's interview process always includes a pair-programming session on an actual (anonymized) production bug, specifically to observe how candidates communicate when stuck."
  ),
  chunk("LDR", "team-leadership", "anti-pattern", "ANTI", "CRITICAL", "meeting", 0.91,
    ["management", "micromanagement", "autonomy"],
    "Jan refuses to assign tasks at the individual level for engineers above mid-level. He sets objectives at the team level and expects the team to self-organize. When a VP once asked him to provide individual task assignments for a quarterly report, Jan responded with a single-page document titled 'Why I Don't Track Keystrokes' and escalated to the CEO. He considers individual task tracking a symptom of a trust deficit that no amount of process can fix."
  ),
  chunk("LDR", "team-leadership", "heuristic", "HEUR", "CRITICAL", "observation", 0.87,
    ["one-on-ones", "retention", "management"],
    "Jan's one-on-one meetings follow an unusual structure: the first 10 minutes belong entirely to the report, with no agenda from Jan. He does not speak unless asked a direct question during this window. He developed this after realizing that his natural tendency to fill silence with guidance was preventing junior engineers from surfacing their real concerns. He tracks the ratio of 'their topics' to 'my topics' and aims for 70/30."
  ),
  chunk("LDR", "team-leadership", "belief", "BLEF", "CRITICAL", "interview", 0.93,
    ["team-size", "scaling", "communication"],
    "Jan believes the optimal engineering team size is exactly 5 people — not the commonly cited 7±2. His reasoning is specific: with 5 people, every person can maintain a genuine personal relationship with every teammate (10 bidirectional relationships). At 6, the communication overhead increases 50% (to 15 relationships) and he's observed that this is where cliques start forming. He will split a team rather than let it grow to 7."
  ),
  chunk("LDR", "team-leadership", "preference", "PREF", "HIGH", "email", 0.86,
    ["feedback", "performance", "direct-communication"],
    "Jan delivers critical feedback within 24 hours of the triggering event, never saving it for scheduled reviews. He uses a format he calls 'SBI+R': Situation, Behavior, Impact, plus a specific Request for change. He considers delayed feedback to be 'stale feedback' and has told his managers that any performance surprise during an annual review is a failure of the manager, not the employee."
  ),
  chunk("LDR", "team-leadership", "skill", "SKIL", "MEDIUM", "observation", 0.83,
    ["conflict-resolution", "mediation", "team-dynamics"],
    "Jan is notably skilled at resolving technical disagreements by reframing them as experiments. When two engineers are deadlocked on an approach, he proposes a time-boxed spike (usually 2 days) where each builds a minimal proof-of-concept, and the team evaluates both against pre-agreed criteria. He estimates this has resolved 80% of architecture disputes without anyone losing face."
  ),
  chunk("LDR", "team-leadership", "framework", "FRMW", "CRITICAL", "document", 0.90,
    ["growth", "career-ladder", "engineering-levels"],
    "Jan designed a career ladder with an explicit 'impact radius' metric at each level. Junior engineers impact their own code, mid-level engineers impact their team's code, seniors impact cross-team decisions, staff engineers impact organizational direction, and principals impact industry practice. He refuses to promote anyone who cannot demonstrate impact at the next radius, regardless of tenure. The ladder document is public within the company and updated quarterly."
  ),
  chunk("LDR", "team-leadership", "story", "STRY", "HIGH", "interview", 0.85,
    ["firing", "difficult-decisions", "culture"],
    "Jan's most difficult leadership moment was firing a senior engineer who was individually brilliant but consistently undermined team decisions. The engineer had 3x the output of any peer but left a trail of demotivated teammates. Jan delayed the decision for 6 months, during which two mid-level engineers quit. He now considers this his biggest management mistake and cites it when coaching other leaders: 'The cost of a brilliant jerk is always higher than their output.'"
  ),
  chunk("LDR", "team-leadership", "emotion", "EMOT", "HIGH", "observation", 0.82,
    ["frustration", "bureaucracy", "process"],
    "Jan becomes visibly frustrated when organizational process is added without a corresponding removal of existing process. He maintains a 'Process Debt Register' and insists that for every new meeting, report, or approval step introduced, an existing one of equal time cost must be eliminated. When this principle is violated, he responds with a detailed time-cost analysis showing the cumulative hours lost."
  ),
  chunk("LDR", "team-leadership", "ritual", "RITL", "MEDIUM", "observation", 0.80,
    ["onboarding", "new-hires", "culture"],
    "Every new engineer's first week includes a 'codebase archaeology' exercise designed by Jan: they must trace a single user request from HTTP ingress to database write, documenting every service, queue, and transformation it touches. They present their findings to the team on Friday. Jan attends every presentation and uses the new hire's fresh perspective to identify documentation gaps."
  ),
];

// ─── Export for next stages ────────────────────────────────────────────────────

const allChunks = [
  ...tdmChunks,
  ...ldrChunks,
  // More clusters will be added in subsequent commits
];

const allRelations = [
  // Relations will be added in a subsequent commit
];

// ─── Build Portrait ────────────────────────────────────────────────────────────

function buildPortrait(chunks, relations) {
  const clusterCoverage = {};
  for (const c of chunks) {
    clusterCoverage[c.cluster] = (clusterCoverage[c.cluster] || 0) + 1;
  }

  const coveredRecommended = [
    "technical-decision-making", "team-leadership", "communication",
    "personal-values", "domain-expertise", "emotional-landscape", "meta-patterns",
  ].filter((c) => c in clusterCoverage).length;

  const clusterScore = (coveredRecommended / 7) * 0.4;
  const countScore = Math.min(chunks.length / 50, 1) * 0.3;
  const relationScore = Math.min(relations.length / (chunks.length * 1.5), 1) * 0.3;
  const completenessScore = Math.round((clusterScore + countScore + relationScore) * 100) / 100;

  return {
    version: "1.0.0-draft",
    subject: { name: "Jan Kowalski", id: "jan-kowalski-fictional-cto" },
    created_at: new Date().toISOString(),
    chunks,
    relations,
    metadata: {
      completeness_score: completenessScore,
      chunk_count: chunks.length,
      relation_count: relations.length,
      cluster_coverage: clusterCoverage,
    },
  };
}

// ─── Output ────────────────────────────────────────────────────────────────────

const portrait = buildPortrait(allChunks, allRelations);
console.log(JSON.stringify(portrait, null, 2));

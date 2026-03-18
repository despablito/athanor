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

const RELATION_TYPE_MAP = {
  supports: "ENABLES",
  contradicts: "CONTRASTS_WITH",
  refines: "HARDCODED_EXCEPTION",
  exemplifies: "INSTANTIATES",
  triggers: "EXPRESSED_THROUGH",
  evolves_from: "LEARNED_FROM",
};

function rel(source, target, type, description) {
  const schemaType = RELATION_TYPE_MAP[type] || type;
  return { source, target, type: schemaType, ...(description ? { description } : {}) };
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

// ─── Cluster: communication (COM) — 8 chunks ──────────────────────────────────

const comChunks = [
  chunk("COM", "communication", "style", "STYL", "HIGH", "email", 0.91,
    ["writing", "decision-communication", "async"],
    "Jan's written communication follows a rigid structure he calls 'Situation-Constraint-Proposal.' Every technical email or Slack message over 3 sentences follows this pattern: first, state the current situation factually; second, list the constraints (time, budget, technical); third, propose a specific action with a deadline. He will send back messages from reports that lack a clear proposal with the comment 'What are you asking me to decide?'"
  ),
  chunk("COM", "communication", "style", "STYL", "CRITICAL", "observation", 0.89,
    ["presentations", "public-speaking", "storytelling"],
    "Jan's presentation style is distinctly anti-corporate: he refuses to use slides with more than 10 words, uses hand-drawn diagrams photographed on his phone instead of polished graphics, and always opens with a concrete failure story before proposing a solution. He calls slide decks with bullet points 'weapons of mass distraction' and has been known to close his laptop mid-presentation if the audience is reading slides instead of listening."
  ),
  chunk("COM", "communication", "heuristic", "HEUR", "HIGH", "chat", 0.87,
    ["async-communication", "slack", "response-time"],
    "Jan enforces a 'no-DM policy' for technical discussions — all engineering conversations must happen in public Slack channels. He makes exactly one exception: sensitive personnel matters. His reasoning is that private technical discussions create invisible knowledge silos. He tracks channel-vs-DM ratios monthly and flags teams where DMs exceed 30% of total messages as having a 'transparency problem.'"
  ),
  chunk("COM", "communication", "anti-pattern", "ANTI", "MEDIUM", "meeting", 0.85,
    ["jargon", "clarity", "stakeholder-communication"],
    "Jan explicitly bans the use of acronyms in any document shared outside the engineering team. He maintains a 'Jargon Hit List' — a shared doc listing terms that engineers default to but stakeholders don't understand. When he catches an engineer using 'k8s' or 'CQRS' in a product meeting, he stops the conversation and asks them to explain it in one sentence a customer would understand."
  ),
  chunk("COM", "communication", "preference", "PREF", "MEDIUM", "email", 0.84,
    ["documentation", "writing", "adrs"],
    "Jan prefers long-form written proposals over meetings for any decision that will last longer than a sprint. He requires that proposals be circulated 48 hours before any decision meeting, and considers any meeting where participants first encounter the proposal to be 'a reading session, not a decision session.' His teams have adopted a standard template: Problem Statement, Options Considered, Recommendation, Risks, and Rollback Plan."
  ),
  chunk("COM", "communication", "skill", "SKIL", "MEDIUM", "observation", 0.82,
    ["translation", "technical-to-business", "stakeholders"],
    "Jan is exceptionally skilled at translating technical debt into financial language that executives understand. Instead of saying 'we need to refactor the auth module,' he says 'every new feature takes 3 extra days because of the auth module's coupling, costing us $15K per feature in delayed revenue.' He maintains a running 'Tech Debt Cost Calculator' spreadsheet that converts engineering estimates into business impact."
  ),
  chunk("COM", "communication", "rant", "RANT", "HIGH", "chat", 0.88,
    ["meetings", "waste", "calendar"],
    "Jan has a well-known rant about recurring meetings: 'Every recurring meeting is a process smell. It means someone failed to build a system that makes the meeting unnecessary. Your standup should be a dashboard. Your sprint review should be a demo video. Your retrospective — okay, that one can stay, but only because humans need to complain to each other periodically. If your calendar is more than 40% meetings, you're not an engineer, you're a professional listener.'"
  ),
  chunk("COM", "communication", "ritual", "RITL", "MEDIUM", "observation", 0.80,
    ["writing", "weekly-update", "transparency"],
    "Every Monday morning, Jan publishes a 'CTO Weekly' internal blog post summarizing: (1) what shipped last week, (2) what's blocked this week, (3) one technical insight he found interesting. The post is deliberately informal — he writes it like a letter to a friend who happens to be technical. It has become the most-read internal document, with a 94% open rate, because employees say it's the only executive communication that doesn't feel like corporate-speak."
  ),
];

// ─── Cluster: personal-values (PV) — 8 chunks ─────────────────────────────────

const pvChunks = [
  chunk("PV", "personal-values", "belief", "BLEF", "CRITICAL", "interview", 0.94,
    ["transparency", "honesty", "organizational-culture"],
    "Jan believes that organizational transparency is not a spectrum but a binary: you are either transparent by default or you are not. He makes all engineering team metrics, including velocity, bug rates, and incident counts, visible to the entire company. When the board suggested hiding a particularly bad quarter's uptime numbers, Jan threatened to resign. He considers information hiding the first symptom of organizational dysfunction."
  ),
  chunk("PV", "personal-values", "belief", "BLEF", "CRITICAL", "interview", 0.92,
    ["work-life-balance", "sustainability", "burnout"],
    "Jan enforces a strict no-work-after-8PM policy for his engineering teams and monitors Slack activity outside business hours. When he notices someone consistently online late, he schedules a private conversation not to praise their dedication but to investigate what systemic issue is forcing overtime. He has said: 'If you need heroes working nights, your system is broken. Heroes are a scaling anti-pattern.'"
  ),
  chunk("PV", "personal-values", "belief", "BLEF", "HIGH", "document", 0.89,
    ["meritocracy", "fairness", "compensation"],
    "Jan runs compensation reviews through a blind process where he evaluates impact evidence stripped of names, gender, and tenure. He implemented this after discovering a 12% pay gap between equally performing engineers that correlated with negotiation aggressiveness at hiring. He publishes the company's pay bands internally and considers secret salaries a form of institutional dishonesty."
  ),
  chunk("PV", "personal-values", "preference", "PREF", "HIGH", "observation", 0.86,
    ["learning", "reading", "continuous-improvement"],
    "Jan allocates 4 hours per week of protected 'learning time' for every engineer, including himself. This time is blocked on calendars and cannot be overridden by sprint work. He tracks what people learn and shares a monthly 'Learning Digest' of the most interesting discoveries. He considers continuous learning a non-negotiable part of engineering competence, not a perk."
  ),
  chunk("PV", "personal-values", "heuristic", "HEUR", "MEDIUM", "interview", 0.84,
    ["ethics", "customers", "data-privacy"],
    "Jan applies a 'newspaper test' to every data collection decision: if the way the company uses this data appeared on the front page of a newspaper, would he be comfortable? He has vetoed three product features that passed legal review but failed his newspaper test — including a feature that would have tracked user behavior without explicit opt-in. He considers 'technically legal' the lowest possible bar for ethical behavior."
  ),
  chunk("PV", "personal-values", "emotion", "EMOT", "HIGH", "observation", 0.83,
    ["injustice", "unfairness", "anger"],
    "Jan exhibits a sharp, focused anger when he perceives systemic unfairness — not interpersonal slights, but structural inequities. He once spent an entire weekend rewriting the promotion criteria after a qualified engineer was passed over due to an ambiguous 'leadership presence' requirement that he realized penalized introverts. His anger in these moments is constructive: it always results in a concrete policy change within days."
  ),
  chunk("PV", "personal-values", "story", "STRY", "HIGH", "interview", 0.87,
    ["failure", "accountability", "leadership"],
    "Jan tells a story from his consulting days: a partner blamed a junior consultant for a client deliverable failure that was actually caused by the partner's own scope change. Jan, then a senior consultant, escalated the issue, was told to 'stay in his lane,' and quit within the month. He founded his company partly because of this experience and has made 'leaders own failures, teams own successes' the first line of the engineering handbook."
  ),
  chunk("PV", "personal-values", "contradiction", "CONT", "MEDIUM", "inferred", 0.72,
    ["control", "autonomy", "paradox"],
    "Jan advocates strongly for team autonomy but has more non-negotiable rules than most CTOs. He's aware of this tension and addresses it directly: 'I give you freedom within guardrails. The guardrails are non-negotiable because each one was written in production blood. Inside them, you have more autonomy than at any company I know.' Whether this framing resolves the contradiction or merely repackages it is a matter of ongoing debate among his reports."
  ),
];

// ─── Cluster: domain-expertise (DE) — 8 chunks ────────────────────────────────

const deChunks = [
  chunk("DE", "domain-expertise", "fact", "FACT", "MEDIUM", "document", 0.97,
    ["biography", "background", "saas"],
    "Jan Kowalski is the co-founder and CTO of a B2B SaaS company providing supply-chain analytics, founded in 2017 in Warsaw, Poland. He has a background in distributed systems from his MSc at Warsaw University of Technology and spent 4 years at a Big Four consultancy before starting the company. The platform processes approximately 2 billion events per month and serves 340 enterprise customers as of 2024."
  ),
  chunk("DE", "domain-expertise", "fact", "FACT", "MEDIUM", "document", 0.95,
    ["supply-chain", "domain-knowledge", "logistics"],
    "Jan has developed deep expertise in supply-chain event processing, particularly in the area of demand forecasting anomaly detection. He can explain the bullwhip effect, safety stock optimization, and lead-time variability analysis in both academic and practical terms. His platform's core differentiator is a proprietary algorithm for detecting supply-chain disruptions 72 hours before they impact inventory levels."
  ),
  chunk("DE", "domain-expertise", "skill", "SKIL", "CRITICAL", "code", 0.91,
    ["distributed-systems", "event-processing", "kafka"],
    "Jan is a hands-on expert in event-driven architecture, specifically Apache Kafka at scale. He personally designed the company's event processing pipeline that handles 2B events/month with sub-100ms p99 latency. He can diagnose Kafka partition rebalancing issues from consumer lag metrics alone and has contributed patches to the Kafka consumer library for edge cases discovered in production."
  ),
  chunk("DE", "domain-expertise", "skill", "SKIL", "HIGH", "code", 0.88,
    ["postgresql", "database", "performance-tuning"],
    "Jan is deeply proficient in PostgreSQL internals — he can read EXPLAIN ANALYZE output like prose and has memorized the cost formulas for sequential scan, index scan, and bitmap heap scan. He runs an internal 'PostgreSQL Masterclass' quarterly for his engineers, covering topics like MVCC vacuum tuning, partial indexes, and when to use CTEs vs. subqueries. His team jokes that he can 'smell an unindexed foreign key from across the office.'"
  ),
  chunk("DE", "domain-expertise", "framework", "FRMW", "CRITICAL", "document", 0.90,
    ["event-sourcing", "cqrs", "architecture"],
    "Jan developed a decision framework for when to use event sourcing vs. traditional CRUD. His rule: event sourcing is justified only when (1) the audit trail has legal/compliance value, (2) the domain has natural temporal queries ('what was the state at time T?'), AND (3) the team has at least one engineer with production event sourcing experience. If any condition is missing, he mandates CRUD with an append-only audit log as a compromise."
  ),
  chunk("DE", "domain-expertise", "heuristic", "HEUR", "HIGH", "meeting", 0.86,
    ["saas-metrics", "business", "unit-economics"],
    "Jan monitors a custom metric he calls 'Engineering Cost Per Feature Dollar' — the ratio of engineering hours spent on a feature to the ARR that feature generates in its first 12 months. He uses this to prioritize the product backlog and has established a threshold: any feature with an ECPF ratio above 3.0 is flagged for review. This metric has helped him kill 'cool but unprofitable' projects early, saving an estimated 400 engineering hours per quarter."
  ),
  chunk("DE", "domain-expertise", "story", "STRY", "MEDIUM", "interview", 0.84,
    ["scaling", "growth", "near-miss"],
    "In 2021, Jan's platform nearly lost its largest customer (18% of ARR) when a supply-chain disruption event storm overwhelmed the ingestion pipeline during the Suez Canal crisis. The system queued 4 hours of events, and by the time alerts fired, the customer had already made purchasing decisions based on stale data. Jan personally led a 72-hour incident response that resulted in a complete redesign of the backpressure system and the introduction of 'freshness SLAs' per customer tier."
  ),
  chunk("DE", "domain-expertise", "belief", "BLEF", "MEDIUM", "interview", 0.82,
    ["specialization", "t-shaped", "expertise"],
    "Jan believes in 'T-shaped' engineers but with a twist: the vertical bar of the T must be in the company's core domain, not just any specialty. For his company, that means every engineer must develop working knowledge of supply-chain concepts within their first 6 months. He has turned down otherwise excellent candidates who expressed zero interest in learning the domain, saying 'you can teach someone Kafka, but you can't teach them to care about inventory turns.'"
  ),
];

// ─── Cluster: emotional-landscape (EL) — 8 chunks ─────────────────────────────

const elChunks = [
  chunk("EL", "emotional-landscape", "emotion", "EMOT", "HIGH", "observation", 0.82,
    ["under-pressure", "outage", "incident-response"],
    "Jan exhibits controlled, cold anger when a production outage is caused by a known-but-unaddressed issue. He does not raise his voice but becomes notably terse, switches to written communication only, and will spend the first 10 minutes of any post-mortem listing every prior warning that was ignored. Colleagues describe this as 'the silence before the spreadsheet' — he always arrives with timestamped evidence."
  ),
  chunk("EL", "emotional-landscape", "emotion", "EMOT", "HIGH", "interview", 0.85,
    ["mentoring", "growth", "team-building"],
    "Jan shows visible, genuine pride when a junior engineer he mentored ships their first production feature independently. He will publicly credit them in the team Slack channel with specific details about what they did well — not generic praise but references to exact technical decisions. He has described these moments as 'the only part of management that makes the meetings worth it.'"
  ),
  chunk("EL", "emotional-landscape", "emotion", "EMOT", "CRITICAL", "observation", 0.80,
    ["imposter-syndrome", "vulnerability", "self-awareness"],
    "Jan has privately admitted to his co-founder that he experiences imposter syndrome most acutely when speaking at conferences. Despite being recognized as an expert in event-driven architecture, he prepares obsessively — spending 40+ hours on a 30-minute talk. He copes by reframing the anxiety as 'respect for the audience's time' rather than self-doubt, but close colleagues notice he's unusually quiet the day before any public appearance."
  ),
  chunk("EL", "emotional-landscape", "emotion", "EMOT", "MEDIUM", "observation", 0.78,
    ["boredom", "routine", "restlessness"],
    "Jan becomes noticeably restless and disengaged when a problem is 'solved' and enters maintenance mode. He has self-awareness about this pattern and deliberately hands off stable systems to team leads who thrive on optimization and reliability. He describes himself as 'addicted to the zero-to-one phase' and considers this both a strength (he's energized by ambiguity) and a weakness (he sometimes under-invests in operational excellence)."
  ),
  chunk("EL", "emotional-landscape", "heuristic", "HEUR", "HIGH", "interview", 0.83,
    ["stress-management", "exercise", "routine"],
    "Jan manages work stress through a non-negotiable daily routine: a 6 AM run regardless of weather, followed by 20 minutes of reading something completely unrelated to technology (currently: Roman military logistics). He credits this routine with preventing burnout during the company's most intense growth periods. If he misses the run for more than 2 consecutive days, he recognizes it as an early warning sign and proactively redistributes his workload."
  ),
  chunk("EL", "emotional-landscape", "preference", "PREF", "MEDIUM", "interview", 0.79,
    ["solitude", "deep-work", "focus"],
    "Jan protects a 3-hour block every morning (9 AM to noon) as 'deep work time' during which he is unreachable — no Slack, no email, no meetings. He considers this his most productive window and uses it for architecture reviews, complex code reading, and strategic thinking. The only exception is a P1 production incident. He has politely but firmly declined meetings with board members who wanted this time slot."
  ),
  chunk("EL", "emotional-landscape", "story", "STRY", "HIGH", "interview", 0.81,
    ["burnout", "recovery", "personal-growth"],
    "In 2020, Jan experienced a severe burnout episode that he attributes to trying to be both CTO and acting VP of Engineering simultaneously for 8 months. He stopped sleeping, lost 7 kg, and realized something was wrong when he couldn't concentrate enough to read a pull request. His recovery involved a 3-week complete disconnection from work, hiring a VP of Engineering, and establishing the boundaries that now define his working style. He shares this story openly with his team to normalize conversations about mental health."
  ),
  chunk("EL", "emotional-landscape", "contradiction", "CONT", "MEDIUM", "inferred", 0.71,
    ["empathy", "detachment", "duality"],
    "Jan demonstrates a paradoxical emotional pattern: he is deeply empathetic in one-on-one settings (remembering personal details, checking in during difficult life events) but becomes analytically detached in group decision-making, treating personnel decisions with the same cost-benefit framework he applies to technical architecture. Team members who know him only from all-hands meetings perceive him as cold; those who've had one-on-ones describe him as one of the most caring leaders they've worked with."
  ),
];

// ─── Cluster: meta-patterns (MP) — 6 chunks ───────────────────────────────────

const mpChunks = [
  chunk("MP", "meta-patterns", "meta", "META", "HIGH", "inferred", 0.78,
    ["cross-cutting", "pattern", "decision-making"],
    "Across all domains — technical decisions, hiring, communication — Jan exhibits a consistent meta-pattern: he converts painful past experiences into explicit, non-negotiable rules with bright-line thresholds. Rather than relying on judgment calls, he codifies lessons into quantifiable criteria (bus factor ≥ 3, table scans on >1M rows forbidden, structured message format). This 'rule-ification' tendency means his organization runs on a growing body of hard-coded institutional knowledge rather than implicit tribal understanding."
  ),
  chunk("MP", "meta-patterns", "meta", "META", "CRITICAL", "inferred", 0.80,
    ["control", "systems-thinking", "leverage"],
    "Jan's leadership philosophy reveals a consistent systems-thinking approach: he invests disproportionate effort in designing constraints and feedback loops rather than making individual decisions. His career ladder, tech radar graveyard, process debt register, and reversibility matrix are all examples of 'meta-systems' — mechanisms that make future decisions automatic or at least well-informed. He is, in essence, a CTO who builds decision-making infrastructure rather than making decisions."
  ),
  chunk("MP", "meta-patterns", "meta", "META", "CRITICAL", "inferred", 0.76,
    ["trust", "verification", "leadership"],
    "A recurring tension in Jan's approach is the coexistence of high trust and high verification. He trusts his teams to self-organize (no individual task assignments) but verifies through extensive metrics (DM ratios, ECPF, process debt registers). This is not hypocrisy — it's a deliberate strategy he articulates as 'trust the people, verify the system.' He believes that monitoring systems rather than people preserves autonomy while catching systemic failures."
  ),
  chunk("MP", "meta-patterns", "meta", "META", "HIGH", "inferred", 0.74,
    ["narrative", "teaching", "experience"],
    "Jan teaches almost exclusively through stories of past failures rather than abstract principles. Every major rule he enforces comes with an origin story — the $47K bill, the disappeared maintainer, the brilliant jerk, the burnout episode. This narrative-driven leadership style means his organization has an unusually rich oral history, and new hires absorb institutional knowledge through stories rather than policy documents."
  ),
  chunk("MP", "meta-patterns", "framework", "FRMW", "HIGH", "inferred", 0.73,
    ["evolution", "maturity", "growth"],
    "Jan's career shows a clear evolution from individual contributor to systems designer. In his consultancy years, he solved problems directly. As a first-time CTO, he solved them through people. Now, he solves them through systems that enable people to solve problems autonomously. Each phase required him to let go of the previous identity, and he openly discusses the difficulty of each transition, particularly the loss of hands-on coding time."
  ),
  chunk("MP", "meta-patterns", "contradiction", "CONT", "MEDIUM", "inferred", 0.70,
    ["rules", "creativity", "tension"],
    "Jan's extensive system of rules and processes coexists with his genuine belief in engineering creativity and innovation. He resolves this tension by distinguishing between 'explored territory' (where rules apply) and 'unexplored territory' (where experimentation is encouraged). However, his definition of explored territory expands with each incident, meaning the creative space gradually contracts. Whether this leads to organizational rigidity over time is an open question he hasn't fully confronted."
  ),
];

// ─── Cluster: incident-response (IR) — 6 chunks ───────────────────────────────

const irChunks = [
  chunk("IR", "incident-response", "heuristic", "HEUR", "CRITICAL", "meeting", 0.93,
    ["outage", "severity", "classification"],
    "Jan classifies incidents using a custom severity scale tied to business impact, not technical symptoms. P1 means revenue-impacting for multiple customers, P2 means a single enterprise customer affected, P3 means internal tooling down, P4 means degraded but functional. He insists that the on-call engineer classify severity within 5 minutes of the first alert and escalate any P1 to him personally, even at 3 AM. He has never once complained about being woken up for a legitimate P1."
  ),
  chunk("IR", "incident-response", "ritual", "RITL", "CRITICAL", "observation", 0.91,
    ["post-mortem", "blameless", "process"],
    "Jan's post-mortem process follows an invariable ritual: the incident is documented within 48 hours, the post-mortem meeting happens within 5 business days, and every post-mortem must produce at least one 'systemic fix' — a change to process, tooling, or architecture that prevents the class of incident, not just the specific instance. He reviews every post-mortem personally and will reject any that list 'be more careful' as an action item."
  ),
  chunk("IR", "incident-response", "anti-pattern", "ANTI", "HIGH", "interview", 0.89,
    ["rollback", "hotfix", "deployment"],
    "Jan forbids deploying forward (hotfixing) as a first response to production incidents. His standing order is: roll back first, investigate second, fix third. He made this rule absolute after a 2021 incident where a hasty hotfix to fix a payment processing bug introduced a data corruption issue that took 3 days to remediate. The only exception is when the rollback itself would cause data loss, which must be documented in real-time."
  ),
  chunk("IR", "incident-response", "skill", "SKIL", "HIGH", "observation", 0.87,
    ["debugging", "triage", "pattern-recognition"],
    "Jan has an exceptional ability to triage production incidents by correlating seemingly unrelated symptoms. During a 2023 outage that presented as 'slow API responses,' he noticed a 2% increase in garbage collection pauses on a seemingly unrelated service, traced it to a memory leak caused by a connection pool misconfiguration introduced 3 weeks earlier, and identified the exact PR. His debugging approach is systematic: he draws a timeline of all changes in the past 2 weeks and overlays it with the anomaly onset."
  ),
  chunk("IR", "incident-response", "framework", "FRMW", "HIGH", "document", 0.88,
    ["alerting", "signal-noise", "monitoring"],
    "Jan designed the company's alerting philosophy around what he calls the 'Alert Credibility Index': every alert must have a minimum 80% true-positive rate over a rolling 30-day window. Alerts that fall below this threshold are automatically silenced and flagged for review. His reasoning: 'Every false alert erodes on-call trust by 5%. After 20 false alerts, your engineers stop responding to real ones. Alert fatigue kills more systems than actual bugs.'"
  ),
  chunk("IR", "incident-response", "story", "STRY", "MEDIUM", "interview", 0.84,
    ["cascading-failure", "resilience", "learning"],
    "Jan's most-referenced incident story is 'The Cascade of 2022': a routine database migration caused a 5-second lock that triggered a connection pool exhaustion, which cascaded through 4 downstream services, which overwhelmed the message queue, which caused the alerting system itself to fail. The team didn't know about the outage for 23 minutes because the monitoring was also down. This incident led Jan to implement an independent 'watchdog' monitoring system that runs on completely separate infrastructure."
  ),
];

// ─── Cluster: code-review (CR) — 5 chunks ─────────────────────────────────────

const crChunks = [
  chunk("CR", "code-review", "heuristic", "HEUR", "CRITICAL", "code", 0.92,
    ["pr-size", "review-quality", "process"],
    "Jan enforces a maximum PR size of 400 lines of changed code (excluding generated files and tests). PRs exceeding this limit are automatically flagged by CI and require a written justification. His data shows that review defect-detection rate drops by 50% above 400 lines. He tells engineers: 'If your PR is too big to review in 30 minutes, it's too big to understand in an incident at 3 AM.'"
  ),
  chunk("CR", "code-review", "heuristic", "HEUR", "HIGH", "meeting", 0.88,
    ["review-focus", "what-to-review", "priorities"],
    "Jan teaches code reviewers to focus on three things in order: (1) correctness of the data model, (2) error handling at system boundaries, (3) naming and readability. He explicitly deprioritizes style and formatting, which he considers 'solved by linters.' He has a phrase: 'I'd rather ship ugly code that handles errors correctly than beautiful code that swallows exceptions.'"
  ),
  chunk("CR", "code-review", "anti-pattern", "ANTI", "HIGH", "code", 0.90,
    ["rubber-stamping", "approval", "accountability"],
    "Jan monitors code review approval times and flags any review completed in under 10 minutes on a PR with more than 100 lines as a potential rubber stamp. He addresses this privately with the reviewer, not punitively, but with a direct conversation: 'Either this PR was trivial enough to not need review, or it wasn't reviewed properly. Which is it?' He tracks repeat offenders and has removed review privileges from two senior engineers who consistently rubber-stamped."
  ),
  chunk("CR", "code-review", "preference", "PREF", "MEDIUM", "chat", 0.85,
    ["review-comments", "tone", "collaboration"],
    "Jan insists that all code review comments must be phrased as questions or suggestions, never commands. Instead of 'Change this to use a map,' reviewers must write 'Have you considered using a map here? It might improve readability because...' He considers imperative review comments a form of technical authority abuse and has modeled this behavior consistently for 5 years. The team's review culture is notably non-adversarial as a result."
  ),
  chunk("CR", "code-review", "belief", "BLEF", "MEDIUM", "interview", 0.83,
    ["code-review", "learning", "knowledge-sharing"],
    "Jan considers code review the single most effective knowledge-sharing mechanism in a software organization — more effective than documentation, pair programming, or tech talks. His reasoning: reviews expose every engineer to decisions they wouldn't otherwise see, create a searchable record of technical rationale, and normalize constructive disagreement. He estimates that 30% of his engineers' technical growth comes directly from reviewing others' code."
  ),
];

// ─── Cluster: vendor-management (VM) — 4 chunks ───────────────────────────────

const vmChunks = [
  chunk("VM", "vendor-management", "heuristic", "HEUR", "CRITICAL", "meeting", 0.90,
    ["vendor-selection", "lock-in", "risk"],
    "Jan evaluates every SaaS vendor against what he calls the 'Exit Cost Test': before signing any contract, the team must prototype a migration to an alternative provider and document the estimated effort. If the exit cost exceeds 2 engineering-months, Jan either negotiates contractual protections (data portability clauses, API stability guarantees) or builds an abstraction layer before integrating. He has walked away from 3 vendor deals over excessive lock-in."
  ),
  chunk("VM", "vendor-management", "anti-pattern", "ANTI", "HIGH", "email", 0.87,
    ["vendor-lock-in", "cloud", "multi-cloud"],
    "Despite his lock-in aversion, Jan explicitly rejects multi-cloud strategies for his company's size. He considers multi-cloud 'a large company's luxury that small companies pay for with complexity.' Instead, he uses cloud-agnostic open-source tools (Kubernetes, PostgreSQL, Kafka) on a single cloud provider (AWS), accepting provider lock-in at the infrastructure layer while maintaining portability at the application layer."
  ),
  chunk("VM", "vendor-management", "story", "STRY", "HIGH", "interview", 0.85,
    ["vendor-failure", "contingency", "resilience"],
    "In 2023, a critical third-party geocoding API that Jan's platform depended on was acquired and its pricing increased 400% with 30 days notice. Because Jan's team had built an abstraction layer during initial integration (per his Exit Cost Test), they migrated to an open-source alternative in 8 days. Jan now uses this as his primary story when engineers push back on the overhead of vendor abstraction layers: 'The abstraction layer isn't overhead — it's insurance.'"
  ),
  chunk("VM", "vendor-management", "preference", "PREF", "MEDIUM", "meeting", 0.82,
    ["open-source", "build-vs-buy", "cost"],
    "Jan's default position on build-vs-buy is 'buy first, build only if the vendor can't meet a specific, documented requirement.' He considers the urge to build in-house a form of 'engineering vanity' and requires any build decision to include a total cost of ownership comparison covering 3 years of maintenance. However, for anything in the critical data path (ingestion, processing, storage), he reverses this default and prefers building or using open-source."
  ),
];

// ─── Cluster: hiring-process (HP) — 5 chunks ──────────────────────────────────

const hpChunks = [
  chunk("HP", "hiring-process", "ritual", "RITL", "CRITICAL", "observation", 0.91,
    ["hiring", "interview-design", "structured"],
    "Jan's interview process is a precisely structured 4-stage pipeline: (1) async take-home exercise simulating a real work task (time-boxed to 3 hours), (2) technical deep-dive on the take-home with the hiring manager, (3) pair-programming session on a production bug with a team member, (4) values alignment conversation with Jan himself. Each stage has a written rubric with specific pass/fail criteria. He reviews every hiring decision and has veto power that he exercises roughly once per quarter."
  ),
  chunk("HP", "hiring-process", "heuristic", "HEUR", "HIGH", "interview", 0.89,
    ["red-flags", "candidates", "evaluation"],
    "Jan maintains a list of 'soft red flags' that don't disqualify candidates but trigger deeper investigation: (1) can't name a mistake they made in their last role, (2) describe every past team as dysfunctional, (3) have never maintained a system they built for more than 6 months, (4) can't explain a concept they listed on their resume in simple terms. He considers flag #4 the most reliable: 'If you can't explain it simply, you memorized it from a blog post.'"
  ),
  chunk("HP", "hiring-process", "belief", "BLEF", "HIGH", "interview", 0.88,
    ["diversity", "team-composition", "hiring"],
    "Jan believes that cognitive diversity — not just demographic diversity — is the most undervalued hiring criterion. He actively seeks engineers with non-traditional backgrounds: former teachers, musicians, military veterans, career-changers. His best-performing team lead is a former logistics manager who learned to code at 35. Jan's reasoning: 'Homogeneous teams converge on solutions too quickly. I want someone who thinks about the problem differently, not just someone who writes code differently.'"
  ),
  chunk("HP", "hiring-process", "anti-pattern", "ANTI", "MEDIUM", "meeting", 0.85,
    ["counter-offers", "retention", "negotiation"],
    "Jan never makes counter-offers to engineers who have accepted an external position. His policy is firm: 'If you needed an outside offer to get a raise, I failed as your manager.' He considers counter-offers a temporary patch that doesn't address the underlying dissatisfaction, and his data shows that 70% of counter-offered employees leave within 12 months anyway. Instead, he invests in proactive retention through regular market-rate adjustments and career development conversations."
  ),
  chunk("HP", "hiring-process", "preference", "PREF", "MEDIUM", "chat", 0.83,
    ["referrals", "sourcing", "network"],
    "Jan caps referral hires at 40% of total hires per quarter to prevent the team from becoming an echo chamber of shared backgrounds and perspectives. He has seen teams where 80% of engineers came from the same 2 companies and observed that they replicated the same architectural patterns and blind spots. His 40% cap forces the recruiting team to source from diverse channels and ensures the team regularly encounters unfamiliar approaches."
  ),
];

// ─── Cluster: product-strategy (PS) — 5 chunks ────────────────────────────────

const psChunks = [
  chunk("PS", "product-strategy", "framework", "FRMW", "CRITICAL", "document", 0.91,
    ["prioritization", "roadmap", "impact"],
    "Jan uses a modified RICE framework for feature prioritization but replaces 'Confidence' with 'Reversibility' — how easily the feature can be rolled back or changed after launch. Features that are high-impact but hard to reverse receive extra scrutiny and require a rollback plan before development begins. He has found that this modification catches 'one-way door' features that standard RICE misses because it doesn't account for architectural commitment."
  ),
  chunk("PS", "product-strategy", "heuristic", "HEUR", "HIGH", "meeting", 0.88,
    ["mvp", "scope", "delivery"],
    "Jan's MVP rule: the first version of any feature must be deliverable by a single engineer in 2 weeks or less. If it can't be scoped that small, the feature is too complex and needs to be decomposed further. He considers 2 weeks the maximum time between feedback loops — anything longer means the team is building on assumptions rather than data. He has killed features mid-development when the team couldn't demo working software after 2 weeks."
  ),
  chunk("PS", "product-strategy", "belief", "BLEF", "HIGH", "interview", 0.87,
    ["customer-proximity", "engineering", "product"],
    "Jan insists that every engineer spend at least one day per quarter sitting with a customer (virtually or in-person) watching them use the product. He considers this non-negotiable because 'engineers who never see their users build features for imaginary people.' His most impactful product decisions — including the freshness SLA feature that prevented churn of their largest customer — originated from engineers who witnessed customer pain firsthand."
  ),
  chunk("PS", "product-strategy", "anti-pattern", "ANTI", "MEDIUM", "meeting", 0.84,
    ["feature-factory", "velocity", "value"],
    "Jan explicitly rejects 'feature velocity' as a product health metric. He has removed it from dashboards and refuses to discuss 'features shipped per sprint' in board meetings. His alternative metric is 'Feature Adoption Rate': the percentage of users who use a new feature within 30 days of launch. He argues that shipping 10 features nobody uses is worse than shipping 2 features everyone loves: 'Velocity without adoption is just organized waste.'"
  ),
  chunk("PS", "product-strategy", "rant", "RANT", "MEDIUM", "chat", 0.86,
    ["roadmaps", "planning", "honesty"],
    "Jan has a passionate stance on roadmaps: 'A roadmap is not a promise. A roadmap is a snapshot of current priorities that will change when we learn new things. Anyone who treats a 12-month roadmap as a contract has never built software. I show our roadmap to customers with a giant watermark that says WILL CHANGE. If your sales team is selling features from the roadmap as commitments, you don't have a roadmap problem — you have a sales culture problem.'"
  ),
];

// ─── Cluster: technical-debt (TD) — 4 chunks ──────────────────────────────────

const tdChunks = [
  chunk("TD", "technical-debt", "framework", "FRMW", "CRITICAL", "document", 0.91,
    ["debt-classification", "prioritization", "strategy"],
    "Jan classifies technical debt into three categories using a financial metaphor: 'credit card debt' (quick hacks that accrue daily interest — must be paid within the sprint), 'mortgage debt' (deliberate architectural compromises with known payoff schedules — tracked quarterly), and 'student loan debt' (foundational choices that enabled growth but now constrain it — addressed in annual planning). Each category has a different remediation strategy and budget allocation. He refuses to let credit card debt carry over between sprints."
  ),
  chunk("TD", "technical-debt", "heuristic", "HEUR", "HIGH", "meeting", 0.88,
    ["debt-budget", "allocation", "maintenance"],
    "Jan allocates exactly 20% of each sprint's capacity to technical debt reduction — not as a stretch goal but as a hard reservation. If a product manager tries to reclaim this capacity for feature work, Jan requires them to sign a 'Debt Deferral Notice' that documents the deferred item, its estimated interest rate (velocity drag per sprint), and a committed payback date. He has found that the formality of the notice deters all but the most urgent requests."
  ),
  chunk("TD", "technical-debt", "story", "STRY", "HIGH", "interview", 0.86,
    ["debt-crisis", "refactoring", "recovery"],
    "Jan's cautionary tale about technical debt comes from 2019: the team spent 6 months building features on top of a 'temporary' data pipeline that was supposed to be replaced after 3 months. When the pipeline finally collapsed under load, the replacement took 4 months instead of the original 3 because every new feature had created additional coupling. He calculates the total cost at $380K in engineering time and uses this as his primary argument for the 20% debt budget."
  ),
  chunk("TD", "technical-debt", "belief", "BLEF", "MEDIUM", "interview", 0.84,
    ["refactoring", "rewriting", "pragmatism"],
    "Jan is deeply skeptical of 'big bang' rewrites and believes that almost every system can be incrementally migrated using the strangler fig pattern. He has approved exactly one ground-up rewrite in 7 years (the event pipeline after the 2019 collapse) and considers it the exception that proves the rule. His standard response to rewrite proposals: 'Show me the migration plan where both systems run in parallel. If you can't, you don't understand the problem well enough to rewrite it.'"
  ),
];

// ─── Cluster: security-practices (SP) — 4 chunks ──────────────────────────────

const spChunks = [
  chunk("SP", "security-practices", "heuristic", "HEUR", "CRITICAL", "code", 0.92,
    ["secrets-management", "credentials", "security"],
    "Jan enforces a zero-tolerance policy for secrets in code repositories. The CI pipeline runs automated secret scanning on every commit, and any detection triggers an immediate forced rotation of the compromised credential, a P2 incident report, and a team-wide security review. He implemented this after discovering that a database password committed to a private repo in 2020 was still valid 8 months later because no one had rotated it."
  ),
  chunk("SP", "security-practices", "framework", "FRMW", "HIGH", "document", 0.89,
    ["threat-modeling", "security-review", "process"],
    "Jan requires a lightweight threat model for any feature that handles user data, financial transactions, or authentication flows. His threat model template has exactly 4 questions: (1) What data flows through this feature? (2) Who should not have access to this data? (3) What happens if this feature fails open? (4) What's the blast radius of a compromise? He considers this 'security minimum viable process' — lightweight enough to not slow development but thorough enough to catch the top risks."
  ),
  chunk("SP", "security-practices", "anti-pattern", "ANTI", "HIGH", "meeting", 0.87,
    ["security-theater", "compliance", "pragmatism"],
    "Jan vocally opposes what he calls 'security theater' — compliance activities that create a false sense of security without reducing actual risk. He has eliminated three quarterly security reports that no one read, replaced annual penetration testing with continuous automated scanning, and refuses to implement IP whitelisting for internal tools because 'it makes people think the network is a security boundary when it hasn't been for a decade.'"
  ),
  chunk("SP", "security-practices", "belief", "BLEF", "MEDIUM", "interview", 0.85,
    ["security-culture", "shared-responsibility", "education"],
    "Jan believes that security is a shared responsibility, not a team responsibility. He requires every engineer to complete a security training module during onboarding that he personally designed, covering the OWASP top 10 with examples from the company's own codebase. He also runs quarterly 'bug bounty' events where engineers try to break each other's features. The winning team gets to choose the next team offsite activity."
  ),
];

// ─── Cluster: data-architecture (DA) — 4 chunks ───────────────────────────────

const daChunks = [
  chunk("DA", "data-architecture", "framework", "FRMW", "CRITICAL", "document", 0.90,
    ["data-ownership", "boundaries", "governance"],
    "Jan enforces strict data ownership boundaries: every table in the database must have exactly one owning service, and no other service may write to it directly. Cross-service data access is mediated through APIs or event streams. He considers shared databases the number one cause of accidental coupling in microservice architectures and has spent significant political capital enforcing this boundary, including rewriting a billing integration that bypassed it."
  ),
  chunk("DA", "data-architecture", "heuristic", "HEUR", "HIGH", "code", 0.88,
    ["schema-evolution", "migrations", "backwards-compatibility"],
    "Jan requires all database schema changes to be backwards-compatible with the previous application version. This means: no dropping columns without a 2-release deprecation cycle, no renaming columns (add new, migrate, drop old), and no NOT NULL constraints on existing columns without a default value. His reasoning: 'We do rolling deployments. At any moment, two versions of the application are running. If your migration breaks the old version, your deployment is a ticking time bomb.'"
  ),
  chunk("DA", "data-architecture", "preference", "PREF", "MEDIUM", "meeting", 0.85,
    ["data-pipeline", "batch-vs-stream", "architecture"],
    "Jan's default position on data pipelines is 'stream first, batch only for historical backfills.' He has migrated three batch ETL processes to streaming equivalents since 2021, reducing data latency from hours to seconds. His reasoning is both technical and organizational: 'Batch processing creates invisible deadlines. Stream processing makes problems visible immediately. I'd rather deal with 100 small issues in real-time than one catastrophic batch failure at 3 AM.'"
  ),
  chunk("DA", "data-architecture", "skill", "SKIL", "HIGH", "code", 0.87,
    ["data-modeling", "normalization", "schema-design"],
    "Jan approaches data modeling with an unusual philosophy: he designs schemas for queryability first and normalization second. He uses a technique he calls 'query-first modeling' where the team writes the 10 most important queries before designing any tables. This sometimes results in deliberate denormalization that academic database design would reject, but Jan argues that 'a normalized schema that requires 12 joins for your most common query is a theoretical victory and a practical defeat.'"
  ),
];

// ─── Cluster: remote-work (RW) — 3 chunks ─────────────────────────────────────

const rwChunks = [
  chunk("RW", "remote-work", "belief", "BLEF", "HIGH", "interview", 0.87,
    ["remote-first", "distributed-teams", "culture"],
    "Jan transitioned his company to remote-first in 2020 and considers it irreversible. He believes that remote work forces better communication habits — everything must be written down, decisions must be documented, and asynchronous communication becomes the default. He has observed that his team's documentation quality improved 300% after going remote because 'you can't rely on hallway conversations to transmit institutional knowledge anymore.'"
  ),
  chunk("RW", "remote-work", "heuristic", "HEUR", "MEDIUM", "observation", 0.83,
    ["timezone", "overlap", "collaboration"],
    "Jan requires a minimum 4-hour timezone overlap for all team members and structures the overlapping window specifically for synchronous collaboration: code reviews, pair programming, and decision meetings. All other work — coding, documentation, research — happens asynchronously. He considers the 4-hour overlap the 'Goldilocks zone': enough for real-time collaboration without forcing anyone to work outside reasonable hours."
  ),
  chunk("RW", "remote-work", "ritual", "RITL", "MEDIUM", "observation", 0.80,
    ["virtual-social", "team-bonding", "culture"],
    "Jan hosts a weekly 'Virtual Coffee Roulette' that randomly pairs two engineers for a 15-minute non-work conversation. Participation is optional but strongly encouraged. He also flies the entire team to Warsaw twice a year for a week-long offsite focused 70% on social bonding and 30% on strategic planning. He considers these in-person gatherings essential for building the trust that makes remote collaboration work the rest of the year."
  ),
];

// ─── Cluster: open-source (OSS) — 3 chunks ────────────────────────────────────

const ossChunks = [
  chunk("OSS", "open-source", "belief", "BLEF", "HIGH", "interview", 0.86,
    ["open-source", "contribution", "community"],
    "Jan believes that companies that use open source have a moral and practical obligation to contribute back. His company dedicates 5% of engineering time to upstream contributions — fixing bugs, improving documentation, and occasionally contributing features to the open-source tools they depend on. He has found that this investment pays for itself: 'Our engineers become experts in the tools we depend on, and the maintainers know us by name when we report issues.'"
  ),
  chunk("OSS", "open-source", "heuristic", "HEUR", "MEDIUM", "meeting", 0.84,
    ["open-source", "evaluation", "maturity"],
    "Jan evaluates open-source projects using a 5-point maturity checklist: (1) active maintainer team of 3+, (2) automated CI with test coverage above 70%, (3) documented release process with semantic versioning, (4) responsive issue triage (median first response under 7 days), (5) at least one corporate sponsor or a sustainable funding model. Projects that score below 3/5 are classified as 'experimental' and forbidden in production without a written exception approved by Jan."
  ),
  chunk("OSS", "open-source", "story", "STRY", "MEDIUM", "interview", 0.82,
    ["open-source", "contribution", "reputation"],
    "Jan's proudest open-source moment was when an engineer on his team discovered and fixed a subtle race condition in a widely-used message queue library. The fix prevented data loss for thousands of users worldwide. The maintainer personally thanked them, and three enterprise customers mentioned the fix during sales calls as evidence of the company's technical depth. Jan uses this story to justify the 5% open-source time allocation: 'One bug fix earned us more credibility than a year of marketing.'"
  ),
];

// ─── Cluster: career-philosophy (CP) — 3 chunks ───────────────────────────────

const cpChunks = [
  chunk("CP", "career-philosophy", "belief", "BLEF", "CRITICAL", "interview", 0.90,
    ["career", "management", "individual-contributor"],
    "Jan believes that the management track and the IC track should be truly parallel in compensation, prestige, and influence — not just on paper. He has structured his organization so that a Staff Engineer has the same compensation band, reports to the same VP, and attends the same strategic meetings as an Engineering Manager. He considers organizations where management is the only path to seniority to be 'systematically selecting against their best engineers.'"
  ),
  chunk("CP", "career-philosophy", "heuristic", "HEUR", "HIGH", "interview", 0.87,
    ["career-change", "growth", "stagnation"],
    "Jan advises engineers to change roles or companies every 3-5 years, even if they're happy. His reasoning: 'Comfort is the enemy of growth. After 3 years, you've mastered your environment and you're optimizing locally. The discomfort of a new context forces global optimization.' He practices what he preaches — before founding his company, he deliberately moved from consulting to a startup to a mid-size company to experience different organizational scales."
  ),
  chunk("CP", "career-philosophy", "rant", "RANT", "HIGH", "chat", 0.88,
    ["titles", "industry", "inflation"],
    `Jan has a well-known rant about title inflation in the tech industry: 'When everyone is a Senior Engineer after 2 years, the title means nothing. When every team lead is a Director, the org chart is a fiction. I've interviewed "Principal Engineers" who couldn't design a system that handles 100 concurrent users. Titles should describe demonstrated impact, not tenure. My company has exactly 4 engineering levels and I will fight title inflation until I retire or lose this fight, whichever comes first.'`
  ),
];

// ─── Cluster: meeting-culture (MC) — 3 chunks ─────────────────────────────────

const mcChunks = [
  chunk("MC", "meeting-culture", "heuristic", "HEUR", "HIGH", "observation", 0.88,
    ["meetings", "efficiency", "rules"],
    "Jan enforces three meeting rules that he calls 'The Meeting Manifesto': (1) every meeting must have a written agenda shared 24 hours in advance, (2) every meeting must end with written action items and owners, (3) any meeting without a decision to make is an email. He has walked out of meetings that violate rule #1 and cancelled recurring meetings that consistently fail to produce decisions. His teams estimate this has recovered 6 hours per person per week."
  ),
  chunk("MC", "meeting-culture", "anti-pattern", "ANTI", "MEDIUM", "meeting", 0.85,
    ["status-meetings", "updates", "async"],
    "Jan considers status update meetings the single greatest waste of engineering time. He has replaced all status meetings with a Slack bot that collects async updates and compiles a daily digest. The bot asks three questions: what did you ship, what are you working on, what's blocking you. If nothing is blocking, the update takes 30 seconds. He estimates this change saved his 40-person engineering team 160 person-hours per month — the equivalent of one full-time engineer."
  ),
  chunk("MC", "meeting-culture", "preference", "PREF", "MEDIUM", "observation", 0.83,
    ["meeting-length", "timeboxing", "focus"],
    "Jan caps all meetings at 25 minutes (not 30) or 50 minutes (not 60), following the principle that meetings should never consume a full calendar block. The 5-minute buffer between meetings is sacred — it's for context-switching, bio breaks, and the mental reset that prevents 'meeting zombie syndrome.' He has configured the company's Google Calendar to default to these durations and considers the standard 30/60 minute meeting 'a relic of the pre-digital era.'"
  ),
];

// ─── Cluster: startup-lessons (SL) — 4 chunks ─────────────────────────────────

const slChunks = [
  chunk("SL", "startup-lessons", "story", "STRY", "CRITICAL", "interview", 0.92,
    ["founding", "early-days", "survival"],
    "Jan's founding story shapes much of his current philosophy: in the first year, he and his co-founder built the entire platform on a single PostgreSQL instance running on a $40/month Hetzner server. When they landed their first enterprise customer, they had 48 hours to migrate to AWS. Jan did the migration solo in a 36-hour coding session, with zero downtime, by replicating writes to both databases and switching reads with a feature flag. He still considers this his greatest technical achievement and references it when engineers over-plan: 'Ship on Hetzner, scale on AWS.'"
  ),
  chunk("SL", "startup-lessons", "belief", "BLEF", "HIGH", "interview", 0.89,
    ["fundraising", "bootstrapping", "independence"],
    "Jan bootstrapped the company for 2 years before taking VC funding, and he considers those bootstrapped years the most important period of the company's life. Without investor pressure, the team could iterate slowly, make mistakes cheaply, and develop genuine product-market fit. He advises other technical founders: 'Take money when you need to scale, not when you need to find product-market fit. Investor money makes you fast, not smart.'"
  ),
  chunk("SL", "startup-lessons", "heuristic", "HEUR", "HIGH", "meeting", 0.87,
    ["hiring-timing", "scaling", "growth"],
    "Jan's rule for startup hiring: never hire for a role until the pain of not having that role is felt by at least 3 people on the team. He has seen early-stage startups hire VPs of Engineering with 3 engineers, DevOps teams with 5 developers, and product managers before having a product. His counter-position: 'Every hire at a startup should feel slightly late. If it doesn't feel uncomfortable without this person, you're hiring ahead of your needs.'"
  ),
  chunk("SL", "startup-lessons", "framework", "FRMW", "HIGH", "document", 0.86,
    ["decision-speed", "startup-vs-enterprise", "context"],
    "Jan uses a framework he calls 'Decision Metabolism' to calibrate the company's decision-making speed as it scales. In the early days (under 10 people), decisions were made verbally in minutes. At 40 people, he introduced lightweight RFCs. At 100+ people, formal ADRs became necessary. He considers adjusting decision-making overhead to company size a critical leadership skill: 'The process that saved you at 100 people will strangle you at 20. The speed that worked at 10 will create chaos at 100.'"
  ),
];

// ─── Cluster: performance-optimization (PO) — 3 chunks ────────────────────────

const poChunks = [
  chunk("PO", "performance-optimization", "heuristic", "HEUR", "CRITICAL", "code", 0.91,
    ["latency", "sla", "monitoring"],
    "Jan defines performance budgets for every API endpoint at the design phase, not after deployment. Each endpoint gets a p50, p95, and p99 latency target based on its user-facing criticality. Dashboard queries are allowed up to 2 seconds p99, but transaction endpoints must stay under 200ms p99. He bakes these targets into CI: if a load test shows a regression beyond the budget, the PR is automatically blocked until the regression is addressed."
  ),
  chunk("PO", "performance-optimization", "skill", "SKIL", "HIGH", "code", 0.89,
    ["profiling", "optimization", "jvm"],
    "Jan is exceptionally proficient at using profiling tools to identify performance bottlenecks. He can navigate flame graphs intuitively and has trained his team to use async-profiler for JVM services and clinic.js for Node.js. His optimization philosophy is ruthlessly empirical: 'Never optimize without a profile. Never profile without a hypothesis. Never hypothesize without a user complaint. Optimization without evidence is superstition.'"
  ),
  chunk("PO", "performance-optimization", "anti-pattern", "ANTI", "MEDIUM", "meeting", 0.86,
    ["caching", "complexity", "tradeoffs"],
    "Jan considers caching a 'necessary evil' rather than a performance strategy. He mandates that every cache must have: (1) explicit TTL with justification, (2) cache invalidation strategy documented before implementation, (3) monitoring on hit rate and staleness. He has rejected caching proposals where the invalidation logic was more complex than the original computation, arguing: 'You haven't solved a performance problem — you've traded it for a correctness problem that's harder to debug at 3 AM.'"
  ),
];

// ─── Export for next stages ────────────────────────────────────────────────────

const allChunks = [
  ...tdmChunks,
  ...ldrChunks,
  ...comChunks,
  ...pvChunks,
  ...deChunks,
  ...elChunks,
  ...mpChunks,
  ...irChunks,
  ...crChunks,
  ...vmChunks,
  ...hpChunks,
  ...psChunks,
  ...tdChunks,
  ...spChunks,
  ...daChunks,
  ...rwChunks,
  ...ossChunks,
  ...cpChunks,
  ...mcChunks,
  ...slChunks,
  ...poChunks,
];

const allRelations = [
  // ── supports (chunks that reinforce each other) ──────────────────────────────
  // TDM internal supports
  rel("TDM-HEUR-001", "TDM-FRMW-001", "supports", "Bus factor heuristic feeds into the ADR framework"),
  rel("TDM-HEUR-002", "TDM-FRMW-002", "supports", "API boundary rule supports the bounded context framework"),
  rel("TDM-HEUR-003", "TDM-PREF-002", "supports", "Anti-premature-scaling supports infrastructure-as-code preference"),
  rel("TDM-FRMW-001", "TDM-RITL-001", "supports", "ADR framework enables the Friday architecture review ritual"),
  rel("TDM-PREF-001", "TDM-FRMW-002", "supports", "TypeScript preference supports bounded context design"),
  rel("TDM-BLEF-001", "TDM-HEUR-001", "supports", "Reversibility belief reinforces bus factor heuristic"),
  rel("TDM-STRY-001", "TDM-BLEF-001", "supports", "Migration story demonstrates reversibility belief in practice"),

  // LDR internal supports
  rel("LDR-BLEF-001", "LDR-FRMW-001", "supports", "Autonomy belief drives the delegation framework"),
  rel("LDR-SKIL-001", "LDR-HEUR-001", "supports", "Conflict resolution skill applies the disagree-and-commit heuristic"),
  rel("LDR-STRY-001", "LDR-BLEF-001", "supports", "Junior dev story exemplifies autonomy belief"),
  rel("LDR-FRMW-001", "LDR-PREF-001", "supports", "Delegation framework supports flat hierarchy preference"),
  rel("LDR-RITL-001", "LDR-EMOT-001", "supports", "Skip-level ritual builds trust emotion"),

  // COM internal supports
  rel("COM-STYL-001", "COM-HEUR-001", "supports", "Direct communication style supports meeting agenda heuristic"),
  rel("COM-SKIL-001", "COM-STYL-002", "supports", "Whiteboard skill reinforces visual communication style"),
  rel("COM-PREF-001", "COM-ANTI-001", "supports", "Written-first preference opposes same anti-patterns"),

  // Cross-cluster supports: TDM ↔ LDR
  rel("TDM-FRMW-001", "LDR-BLEF-001", "supports", "ADR framework supports team autonomy through transparent decisions"),
  rel("TDM-RITL-001", "LDR-HEUR-001", "supports", "Architecture review ritual enables disagree-and-commit"),
  rel("TDM-BLEF-001", "LDR-FRMW-001", "supports", "Reversibility belief supports delegation by reducing risk"),
  rel("LDR-PREF-001", "TDM-FRMW-002", "supports", "Flat hierarchy supports bounded context ownership"),

  // Cross-cluster supports: TDM ↔ COM
  rel("TDM-FRMW-001", "COM-PREF-001", "supports", "ADRs are the ultimate written-first communication"),
  rel("TDM-RITL-001", "COM-STYL-001", "supports", "Architecture reviews need direct communication"),

  // Cross-cluster supports: TDM ↔ DE
  rel("TDM-PREF-001", "DE-SKIL-001", "supports", "TypeScript preference aligns with distributed systems expertise"),
  rel("TDM-PREF-002", "DE-FRMW-001", "supports", "IaC preference supports observability framework"),
  rel("TDM-HEUR-002", "DE-FACT-001", "supports", "API boundary rule supports PostgreSQL expertise"),

  // Cross-cluster supports: LDR ↔ COM
  rel("LDR-HEUR-001", "COM-STYL-001", "supports", "Disagree-and-commit needs direct communication"),
  rel("LDR-RITL-001", "COM-RITL-001", "supports", "Skip-levels feed into weekly all-hands ritual"),
  rel("LDR-BLEF-001", "COM-PREF-001", "supports", "Team autonomy requires written documentation"),

  // Cross-cluster supports: PV ↔ LDR
  rel("PV-BLEF-001", "LDR-BLEF-001", "supports", "Transparency value drives team autonomy belief"),
  rel("PV-BLEF-002", "LDR-FRMW-001", "supports", "Meritocracy value shapes delegation framework"),
  rel("PV-HEUR-001", "LDR-HEUR-001", "supports", "Intellectual honesty supports disagree-and-commit"),
  rel("PV-EMOT-001", "LDR-EMOT-001", "supports", "Pride in craft sustains trust-building"),

  // Cross-cluster supports: PV ↔ COM
  rel("PV-BLEF-001", "COM-STYL-001", "supports", "Transparency drives direct communication"),
  rel("PV-HEUR-001", "COM-ANTI-001", "supports", "Intellectual honesty opposes jargon anti-patterns"),

  // Cross-cluster supports: EL ↔ LDR
  rel("EL-HEUR-001", "LDR-SKIL-001", "supports", "Emotional regulation supports conflict resolution"),
  rel("EL-PREF-001", "LDR-RITL-001", "supports", "Calm preference supports skip-level conversations"),

  // Cross-cluster supports: MP ↔ TDM
  rel("MP-META-001", "TDM-FRMW-001", "supports", "Decision-making meta-pattern supports ADR framework"),
  rel("MP-META-002", "TDM-BLEF-001", "supports", "Risk assessment pattern supports reversibility belief"),
  rel("MP-FRMW-001", "TDM-FRMW-002", "supports", "Pattern recognition framework supports bounded contexts"),

  // Cross-cluster supports: IR ↔ TDM
  rel("IR-HEUR-001", "TDM-HEUR-003", "supports", "Severity classification aligns with anti-premature-scaling"),
  rel("IR-FRMW-001", "TDM-FRMW-001", "supports", "Incident framework feeds into ADR decisions"),
  rel("IR-SKIL-001", "TDM-BLEF-001", "supports", "On-call debugging skill reinforces reversibility belief"),

  // Cross-cluster supports: CR ↔ TDM
  rel("CR-HEUR-001", "TDM-HEUR-002", "supports", "PR size limits support API boundary hygiene"),
  rel("CR-PREF-001", "TDM-PREF-001", "supports", "Review focus preferences align with TypeScript strictness"),
  rel("CR-BLEF-001", "TDM-FRMW-001", "supports", "Code review belief supports ADR accountability"),

  // Cross-cluster supports: VM ↔ TDM
  rel("VM-HEUR-001", "TDM-HEUR-001", "supports", "Exit cost test complements bus factor analysis"),
  rel("VM-PREF-001", "TDM-PREF-002", "supports", "Multi-cloud preference supports infrastructure-as-code"),

  // Cross-cluster supports: HP ↔ LDR
  rel("HP-RITL-001", "LDR-FRMW-001", "supports", "Structured interviews support delegation framework"),
  rel("HP-BLEF-001", "LDR-BLEF-001", "supports", "Hiring beliefs reinforce team autonomy"),
  rel("HP-PREF-001", "LDR-PREF-001", "supports", "Diversity preference supports flat hierarchy"),

  // Cross-cluster supports: PS ↔ TDM
  rel("PS-FRMW-001", "TDM-FRMW-002", "supports", "Modified RICE supports bounded context prioritization"),
  rel("PS-HEUR-001", "TDM-HEUR-003", "supports", "MVP rule aligns with anti-premature-scaling"),
  rel("PS-BLEF-001", "TDM-BLEF-001", "supports", "Product iteration belief supports reversibility"),

  // Cross-cluster supports: TD ↔ TDM
  rel("TD-FRMW-001", "TDM-FRMW-001", "supports", "Debt classification feeds into ADR decisions"),
  rel("TD-HEUR-001", "TDM-HEUR-003", "supports", "20% debt budget prevents premature scaling on broken foundations"),
  rel("TD-BLEF-001", "TDM-BLEF-001", "supports", "Strangler fig belief reinforces reversibility"),

  // Cross-cluster supports: SP ↔ TDM
  rel("SP-HEUR-001", "TDM-PREF-002", "supports", "Secret scanning supports infrastructure-as-code practices"),
  rel("SP-FRMW-001", "TDM-FRMW-002", "supports", "Threat modeling integrates with bounded context design"),

  // Cross-cluster supports: DA ↔ TDM
  rel("DA-FRMW-001", "TDM-HEUR-002", "supports", "Data ownership boundaries reinforce API boundary rules"),
  rel("DA-HEUR-001", "TDM-BLEF-001", "supports", "Backwards-compatible migrations support reversibility"),
  rel("DA-SKIL-001", "TDM-FRMW-002", "supports", "Query-first modeling supports bounded context design"),

  // Cross-cluster supports: RW ↔ COM
  rel("RW-BLEF-001", "COM-PREF-001", "supports", "Remote-first drives written communication preference"),
  rel("RW-HEUR-001", "COM-RITL-001", "supports", "Timezone overlap supports structured rituals"),

  // Cross-cluster supports: OSS ↔ DE
  rel("OSS-BLEF-001", "DE-SKIL-001", "supports", "Open-source contribution deepens distributed systems skills"),
  rel("OSS-HEUR-001", "TDM-HEUR-001", "supports", "OSS maturity checklist extends bus factor analysis"),

  // Cross-cluster supports: CP ↔ LDR
  rel("CP-BLEF-001", "LDR-PREF-001", "supports", "Parallel tracks support flat hierarchy preference"),
  rel("CP-HEUR-001", "LDR-STRY-001", "supports", "Career change advice informs junior dev mentorship"),

  // Cross-cluster supports: MC ↔ COM
  rel("MC-HEUR-001", "COM-HEUR-001", "supports", "Meeting manifesto reinforces agenda heuristic"),
  rel("MC-ANTI-001", "COM-PREF-001", "supports", "Anti-status-meetings supports written-first communication"),
  rel("MC-PREF-001", "COM-RITL-001", "supports", "Meeting length caps support ritual efficiency"),

  // Cross-cluster supports: SL ↔ TDM
  rel("SL-STRY-001", "TDM-BLEF-001", "supports", "Hetzner-to-AWS story embodies reversibility belief"),
  rel("SL-FRMW-001", "TDM-FRMW-001", "supports", "Decision metabolism aligns with ADR framework scaling"),

  // Cross-cluster supports: PO ↔ TDM
  rel("PO-HEUR-001", "TDM-HEUR-003", "supports", "Performance budgets prevent premature optimization"),
  rel("PO-SKIL-001", "DE-SKIL-002", "supports", "Profiling skill complements PostgreSQL expertise"),

  // Cross-cluster supports: IR ↔ EL
  rel("IR-STRY-001", "EL-EMOT-002", "supports", "Incident stories evoke protective team emotions"),
  rel("IR-RITL-001", "EL-HEUR-001", "supports", "Blameless post-mortems support emotional regulation"),

  // Cross-cluster supports: SP ↔ IR
  rel("SP-HEUR-001", "IR-HEUR-001", "supports", "Secret detection triggers incident severity classification"),
  rel("SP-ANTI-001", "IR-ANTI-001", "supports", "Anti-security-theater aligns with anti-blame-culture"),

  // Cross-cluster supports: TD ↔ CR
  rel("TD-HEUR-001", "CR-HEUR-001", "supports", "Debt budget creates space for thorough code reviews"),
  rel("TD-FRMW-001", "CR-PREF-001", "supports", "Debt classification informs review priorities"),

  // Cross-cluster supports: SL ↔ PV
  rel("SL-BLEF-001", "PV-BLEF-003", "supports", "Bootstrapping belief aligns with pragmatic values"),
  rel("SL-HEUR-001", "PV-HEUR-001", "supports", "Late hiring heuristic reflects intellectual honesty"),

  // Cross-cluster supports: RW ↔ MC
  rel("RW-BLEF-001", "MC-ANTI-001", "supports", "Remote-first killed status meetings"),
  rel("RW-RITL-001", "MC-PREF-001", "supports", "Virtual coffee fits 25-min meeting cap"),

  // Cross-cluster supports: CP ↔ HP
  rel("CP-BLEF-001", "HP-BLEF-001", "supports", "Parallel tracks inform hiring criteria"),
  rel("CP-RANT-001", "HP-ANTI-001", "supports", "Title inflation rant drives hiring anti-patterns"),

  // Cross-cluster supports: PO ↔ DA
  rel("PO-HEUR-001", "DA-SKIL-001", "supports", "Performance budgets inform query-first data modeling"),
  rel("PO-ANTI-001", "DA-PREF-001", "supports", "Caching skepticism drives streaming preference"),

  // Cross-cluster supports: OSS ↔ SP
  rel("OSS-STRY-001", "SP-BLEF-001", "supports", "OSS bug fix story demonstrates security culture"),

  // Cross-cluster supports: VM ↔ DA
  rel("VM-ANTI-001", "DA-FRMW-001", "supports", "Anti-lock-in supports data ownership boundaries"),

  // Cross-cluster supports: PS ↔ SL
  rel("PS-HEUR-001", "SL-BLEF-001", "supports", "MVP rule aligns with bootstrapping philosophy"),

  // Additional cross-cluster supports
  rel("EL-STRY-001", "PV-STRY-001", "supports", "Emotional stories reinforce personal value narratives"),
  rel("MP-META-003", "LDR-FRMW-001", "supports", "Communication meta-pattern supports delegation"),
  rel("MP-META-004", "EL-HEUR-001", "supports", "Stress meta-pattern supports emotional regulation"),
  rel("DE-FRMW-001", "IR-FRMW-001", "supports", "Observability framework supports incident response"),
  rel("DE-HEUR-001", "PO-HEUR-001", "supports", "Latency heuristics support performance budgets"),
  rel("LDR-ANTI-001", "HP-ANTI-001", "supports", "Anti-micromanagement supports anti-credential-bias in hiring"),
  rel("LDR-ANTI-002", "CR-ANTI-001", "supports", "Anti-hero-culture supports anti-rubber-stamping"),
  rel("COM-RANT-001", "CP-RANT-001", "supports", "Communication rant energy mirrors title inflation rant"),
  rel("PV-PREF-001", "RW-BLEF-001", "supports", "Work-life values support remote-first belief"),

  // ── contradicts (chunks in genuine tension) ──────────────────────────────────
  rel("TDM-HEUR-003", "SL-STRY-001", "contradicts", "Anti-premature-scaling vs. the 36-hour AWS migration"),
  rel("TDM-BLEF-001", "PS-ANTI-001", "contradicts", "Reversibility belief vs. feature factory anti-pattern urgency"),
  rel("LDR-BLEF-001", "LDR-ANTI-001", "contradicts", "Team autonomy belief vs. anti-micromanagement creates tension on oversight"),
  rel("PV-BLEF-001", "EL-PREF-001", "contradicts", "Transparency value vs. calm preference when delivering bad news"),
  rel("PV-CONT-001", "PV-BLEF-001", "contradicts", "Personal contradiction directly challenges transparency value"),
  rel("EL-CONT-001", "EL-EMOT-001", "contradicts", "Emotional contradiction challenges primary emotion"),
  rel("MP-CONT-001", "MP-META-001", "contradicts", "Meta contradiction challenges core decision-making pattern"),
  rel("COM-STYL-001", "EL-PREF-001", "contradicts", "Direct communication vs. preference for calm environments"),
  rel("COM-RANT-001", "COM-STYL-001", "contradicts", "Rant energy contradicts usual measured directness"),
  rel("TD-HEUR-001", "PS-FRMW-001", "contradicts", "20% debt budget competes with feature prioritization framework"),
  rel("CR-HEUR-002", "SL-FRMW-001", "contradicts", "Strict review rules vs. startup speed decision metabolism"),
  rel("SP-ANTI-001", "SP-FRMW-001", "contradicts", "Anti-security-theater partially undermines formal threat modeling"),
  rel("MC-HEUR-001", "RW-HEUR-001", "contradicts", "Meeting manifesto formality vs. async-first remote work"),
  rel("CP-HEUR-001", "SL-BLEF-001", "contradicts", "Change roles advice vs. founder commitment to one company"),
  rel("PO-ANTI-001", "DE-HEUR-001", "contradicts", "Caching skepticism vs. practical latency heuristics"),
  rel("VM-HEUR-001", "OSS-BLEF-001", "contradicts", "Exit cost analysis vs. deep open-source investment"),
  rel("HP-HEUR-001", "LDR-PREF-001", "contradicts", "Red flag heuristics can conflict with flat hierarchy openness"),
  rel("DA-PREF-001", "PO-ANTI-001", "contradicts", "Streaming preference creates caching needs it distrusts"),
  rel("TD-BLEF-001", "SL-STRY-001", "contradicts", "Never-rewrite belief vs. the one rewrite he approved"),
  rel("PS-RANT-001", "LDR-BLEF-001", "contradicts", "Product strategy frustration vs. team empowerment belief"),
  rel("IR-ANTI-001", "IR-HEUR-001", "contradicts", "Anti-blame-culture can conflict with strict severity classification"),

  // ── refines (one chunk narrows or specifies another) ─────────────────────────
  rel("TDM-HEUR-002", "TDM-FRMW-002", "refines", "7-endpoint limit refines the bounded context framework"),
  rel("TDM-ANTI-001", "TDM-HEUR-001", "refines", "Resume-driven anti-pattern refines what bus factor heuristic catches"),
  rel("TDM-ANTI-002", "TDM-HEUR-003", "refines", "Premature microservices anti-pattern refines scaling heuristic"),
  rel("LDR-ANTI-001", "LDR-FRMW-001", "refines", "Anti-micromanagement refines delegation framework boundaries"),
  rel("LDR-ANTI-002", "LDR-BLEF-001", "refines", "Anti-hero-culture refines what team autonomy means"),
  rel("COM-ANTI-001", "COM-STYL-001", "refines", "Communication anti-patterns refine direct style boundaries"),
  rel("CR-HEUR-002", "CR-HEUR-001", "refines", "Review focus refines PR size limit heuristic"),
  rel("CR-ANTI-001", "CR-BLEF-001", "refines", "Anti-rubber-stamping refines code review belief"),
  rel("VM-ANTI-001", "VM-HEUR-001", "refines", "Vendor lock-in stories refine exit cost test"),
  rel("HP-ANTI-001", "HP-HEUR-001", "refines", "Credential anti-pattern refines red flag heuristics"),
  rel("PS-ANTI-001", "PS-FRMW-001", "refines", "Feature factory anti-pattern refines RICE framework"),
  rel("TD-HEUR-001", "TD-FRMW-001", "refines", "20% budget is a specific instance of debt classification"),
  rel("SP-ANTI-001", "SP-FRMW-001", "refines", "Anti-security-theater refines threat model scope"),
  rel("DA-HEUR-001", "DA-FRMW-001", "refines", "Schema evolution rules refine data ownership framework"),
  rel("MC-ANTI-001", "MC-HEUR-001", "refines", "Status meeting ban refines meeting manifesto rules"),
  rel("PO-ANTI-001", "PO-HEUR-001", "refines", "Caching skepticism refines when performance budgets apply"),
  rel("IR-ANTI-001", "IR-RITL-001", "refines", "Anti-blame refines post-mortem ritual boundaries"),
  rel("IR-HEUR-001", "IR-FRMW-001", "refines", "Severity classification refines incident framework"),
  rel("SL-HEUR-001", "SL-BLEF-001", "refines", "Hiring timing rule refines bootstrapping philosophy"),
  rel("MP-META-003", "COM-STYL-001", "refines", "Communication meta-pattern refines direct style"),
  rel("MP-META-004", "EL-EMOT-003", "refines", "Stress pattern refines frustration response"),
  rel("EL-EMOT-002", "EL-EMOT-001", "refines", "Team protection emotion refines primary pride emotion"),
  rel("EL-EMOT-004", "EL-EMOT-003", "refines", "Specific trigger refines general frustration"),
  rel("PV-BLEF-002", "PV-BLEF-001", "refines", "Meritocracy refines transparency into action"),
  rel("DE-FACT-002", "DE-FACT-001", "refines", "Specific PostgreSQL knowledge refines general DB expertise"),
  rel("DE-SKIL-002", "DE-SKIL-001", "refines", "Specific distributed skill refines general systems skill"),
  rel("OSS-HEUR-001", "TDM-HEUR-001", "refines", "OSS maturity checklist refines bus factor analysis for open-source"),
  rel("SL-FRMW-001", "TDM-FRMW-001", "refines", "Decision metabolism refines ADR framework for different scales"),

  // ── exemplifies (a story/instance that illustrates a belief/heuristic) ───────
  rel("TDM-STRY-001", "TDM-BLEF-001", "exemplifies", "Migration story illustrates reversibility belief"),
  rel("TDM-STRY-001", "TDM-HEUR-001", "exemplifies", "Migration story shows bus factor consequences"),
  rel("LDR-STRY-001", "LDR-BLEF-001", "exemplifies", "Junior dev story exemplifies autonomy belief"),
  rel("LDR-STRY-001", "LDR-FRMW-001", "exemplifies", "Junior dev story shows delegation framework in action"),
  rel("PV-STRY-001", "PV-BLEF-001", "exemplifies", "Personal value story exemplifies transparency"),
  rel("PV-STRY-001", "PV-BLEF-003", "exemplifies", "Value story shows pragmatic belief in action"),
  rel("EL-STRY-001", "EL-EMOT-001", "exemplifies", "Emotional story illustrates pride response"),
  rel("EL-STRY-001", "EL-EMOT-002", "exemplifies", "Story shows team protection emotion"),
  rel("DE-STRY-001", "DE-FRMW-001", "exemplifies", "Domain story illustrates observability framework value"),
  rel("DE-STRY-001", "DE-SKIL-001", "exemplifies", "Story demonstrates distributed systems skill"),
  rel("VM-STRY-001", "VM-HEUR-001", "exemplifies", "Vendor story exemplifies exit cost test"),
  rel("VM-STRY-001", "VM-ANTI-001", "exemplifies", "Story exemplifies vendor lock-in anti-pattern"),
  rel("IR-STRY-001", "IR-FRMW-001", "exemplifies", "Incident story exemplifies response framework"),
  rel("IR-STRY-001", "IR-HEUR-001", "exemplifies", "Story shows severity classification in action"),
  rel("TD-STRY-001", "TD-FRMW-001", "exemplifies", "2019 pipeline story exemplifies debt classification"),
  rel("TD-STRY-001", "TD-HEUR-001", "exemplifies", "Story justifies the 20% debt budget"),
  rel("TD-STRY-001", "TD-BLEF-001", "exemplifies", "Pipeline collapse exemplifies why rewrites fail"),
  rel("OSS-STRY-001", "OSS-BLEF-001", "exemplifies", "Race condition fix story exemplifies contribution belief"),
  rel("OSS-STRY-001", "OSS-HEUR-001", "exemplifies", "Story shows what OSS maturity enables"),
  rel("SL-STRY-001", "SL-BLEF-001", "exemplifies", "Hetzner founding story exemplifies bootstrapping philosophy"),
  rel("SL-STRY-001", "SL-FRMW-001", "exemplifies", "36-hour migration shows decision metabolism at startup scale"),
  rel("SL-STRY-001", "TDM-BLEF-001", "exemplifies", "Feature flag migration exemplifies reversibility"),
  rel("TDM-RITL-001", "TDM-FRMW-001", "exemplifies", "Friday reviews are a living instance of ADR process"),
  rel("LDR-RITL-001", "LDR-BLEF-001", "exemplifies", "Skip-levels exemplify trust-building autonomy"),
  rel("COM-RITL-001", "COM-PREF-001", "exemplifies", "All-hands ritual exemplifies written communication preference"),
  rel("IR-RITL-001", "IR-ANTI-001", "exemplifies", "Blameless post-mortems exemplify anti-blame culture"),
  rel("HP-RITL-001", "HP-BLEF-001", "exemplifies", "Structured interview ritual exemplifies hiring beliefs"),
  rel("RW-RITL-001", "RW-BLEF-001", "exemplifies", "Virtual coffee exemplifies remote-first culture commitment"),
  rel("EL-EMOT-004", "EL-HEUR-001", "exemplifies", "Specific frustration trigger shows emotional regulation in context"),
  rel("PV-CONT-001", "MP-CONT-001", "exemplifies", "Personal contradiction exemplifies meta-level contradictions"),
  rel("DA-PREF-001", "DA-FRMW-001", "exemplifies", "Streaming preference exemplifies data ownership in practice"),
  rel("CR-HEUR-001", "CR-BLEF-001", "exemplifies", "PR size limit is a concrete instance of review belief"),
  rel("SP-HEUR-001", "SP-BLEF-001", "exemplifies", "Secret scanning exemplifies security culture belief"),
  rel("MC-PREF-001", "MC-HEUR-001", "exemplifies", "25-min cap exemplifies meeting manifesto in practice"),

  // ── triggers (one chunk causally activates another) ──────────────────────────
  rel("TDM-ANTI-001", "TDM-HEUR-001", "triggers", "Detecting resume-driven dev triggers bus factor check"),
  rel("TDM-ANTI-002", "TDM-HEUR-002", "triggers", "Premature microservices trigger API boundary enforcement"),
  rel("IR-HEUR-001", "IR-RITL-001", "triggers", "Severity classification triggers post-mortem process"),
  rel("IR-HEUR-001", "IR-SKIL-001", "triggers", "High severity triggers on-call debugging response"),
  rel("SP-HEUR-001", "IR-HEUR-001", "triggers", "Secret detection triggers incident classification"),
  rel("EL-EMOT-003", "EL-HEUR-001", "triggers", "Frustration triggers emotional regulation heuristic"),
  rel("EL-EMOT-004", "COM-RANT-001", "triggers", "Specific frustration trigger can lead to communication rants"),
  rel("COM-ANTI-001", "COM-RANT-001", "triggers", "Detecting jargon anti-pattern triggers rant response"),
  rel("LDR-ANTI-001", "LDR-SKIL-001", "triggers", "Detecting micromanagement triggers conflict resolution"),
  rel("LDR-ANTI-002", "LDR-EMOT-001", "triggers", "Hero culture detection triggers emotional trust response"),
  rel("CR-ANTI-001", "CR-HEUR-002", "triggers", "Rubber-stamping detection triggers review focus heuristic"),
  rel("HP-ANTI-001", "HP-HEUR-001", "triggers", "Credential bias triggers structured assessment"),
  rel("PS-ANTI-001", "PS-RANT-001", "triggers", "Feature factory detection triggers product strategy rant"),
  rel("VM-ANTI-001", "VM-HEUR-001", "triggers", "Lock-in detection triggers exit cost analysis"),
  rel("TD-STRY-001", "TD-HEUR-001", "triggers", "Pipeline collapse story triggers debt budget enforcement"),
  rel("MC-ANTI-001", "MC-HEUR-001", "triggers", "Status meeting detection triggers meeting manifesto"),
  rel("PO-HEUR-001", "PO-SKIL-001", "triggers", "Budget violation triggers profiling investigation"),
  rel("DA-HEUR-001", "DA-FRMW-001", "triggers", "Schema change triggers ownership boundary check"),
  rel("SP-ANTI-001", "SP-FRMW-001", "triggers", "Security theater detection triggers real threat modeling"),
  rel("CP-RANT-001", "HP-ANTI-001", "triggers", "Title inflation rant triggers hiring anti-pattern awareness"),
  rel("MP-META-004", "EL-EMOT-003", "triggers", "Stress meta-pattern triggers frustration recognition"),
  rel("TDM-HEUR-001", "VM-HEUR-001", "triggers", "Low bus factor triggers vendor exit cost analysis"),
  rel("PV-BLEF-001", "COM-STYL-001", "triggers", "Transparency value triggers direct communication mode"),
  rel("SL-STRY-001", "TD-BLEF-001", "triggers", "Founding story informs strangler fig belief"),
  rel("RW-BLEF-001", "MC-ANTI-001", "triggers", "Remote-first decision triggered status meeting elimination"),
  rel("IR-STRY-001", "SP-HEUR-001", "triggers", "Past incidents trigger stricter secret scanning"),
  rel("PS-FRMW-001", "TD-HEUR-001", "triggers", "Feature prioritization triggers debt budget negotiation"),
  rel("DE-HEUR-001", "PO-HEUR-001", "triggers", "Latency detection triggers performance budget check"),
  rel("CR-HEUR-001", "TD-FRMW-001", "triggers", "Large PRs trigger technical debt classification"),
  rel("LDR-FRMW-001", "HP-RITL-001", "triggers", "Delegation gaps trigger hiring process"),

  // ── evolves_from (one chunk developed from or replaced another over time) ────
  rel("TDM-FRMW-002", "TDM-STRY-001", "evolves_from", "Bounded context framework evolved from migration pain"),
  rel("TDM-HEUR-001", "TDM-STRY-001", "evolves_from", "Bus factor heuristic evolved from dependency crisis"),
  rel("LDR-FRMW-001", "LDR-STRY-001", "evolves_from", "Delegation framework evolved from junior dev experience"),
  rel("LDR-HEUR-001", "LDR-SKIL-001", "evolves_from", "Disagree-and-commit evolved from conflict resolution experience"),
  rel("IR-FRMW-001", "IR-STRY-001", "evolves_from", "Incident framework evolved from actual incident experience"),
  rel("IR-RITL-001", "IR-STRY-001", "evolves_from", "Post-mortem ritual evolved from incident learnings"),
  rel("TD-HEUR-001", "TD-STRY-001", "evolves_from", "20% debt budget evolved from 2019 pipeline collapse"),
  rel("TD-FRMW-001", "TD-STRY-001", "evolves_from", "Debt classification evolved from pipeline crisis"),
  rel("TD-BLEF-001", "TD-STRY-001", "evolves_from", "Anti-rewrite belief evolved from observing collapse"),
  rel("SP-HEUR-001", "SP-BLEF-001", "evolves_from", "Secret scanning evolved from security culture belief"),
  rel("VM-HEUR-001", "VM-STRY-001", "evolves_from", "Exit cost test evolved from vendor lock-in experience"),
  rel("HP-RITL-001", "HP-ANTI-001", "evolves_from", "Structured interviews evolved from witnessing credential bias"),
  rel("PS-FRMW-001", "PS-BLEF-001", "evolves_from", "Modified RICE evolved from iteration-first belief"),
  rel("DA-FRMW-001", "DE-FACT-001", "evolves_from", "Data ownership evolved from database expertise"),
  rel("DA-HEUR-001", "SL-STRY-001", "evolves_from", "Schema evolution rules evolved from startup deployment pain"),
  rel("MC-HEUR-001", "RW-BLEF-001", "evolves_from", "Meeting manifesto evolved from remote-first transition"),
  rel("MC-ANTI-001", "RW-BLEF-001", "evolves_from", "Status meeting ban evolved from remote work experience"),
  rel("SL-FRMW-001", "SL-STRY-001", "evolves_from", "Decision metabolism evolved from founding experience"),
  rel("SL-BLEF-001", "SL-STRY-001", "evolves_from", "Bootstrapping belief evolved from founding survival"),
  rel("PO-HEUR-001", "DE-HEUR-001", "evolves_from", "Performance budgets evolved from latency expertise"),
  rel("PO-ANTI-001", "DE-SKIL-002", "evolves_from", "Caching skepticism evolved from distributed systems experience"),
  rel("OSS-HEUR-001", "OSS-STRY-001", "evolves_from", "OSS maturity checklist evolved from contribution experience"),
  rel("CP-BLEF-001", "CP-HEUR-001", "evolves_from", "Parallel tracks belief evolved from career change experience"),
  rel("CP-RANT-001", "HP-ANTI-001", "evolves_from", "Title rant evolved from witnessing hiring credential bias"),
  rel("CR-HEUR-001", "CR-BLEF-001", "evolves_from", "PR size limits evolved from code review philosophy"),
  rel("CR-ANTI-001", "LDR-ANTI-002", "evolves_from", "Anti-rubber-stamping evolved from anti-hero-culture stance"),
  rel("RW-BLEF-001", "COM-PREF-001", "evolves_from", "Remote-first belief evolved from written communication preference"),
  rel("RW-HEUR-001", "RW-BLEF-001", "evolves_from", "Timezone overlap heuristic evolved from remote-first experience"),
  rel("RW-RITL-001", "RW-BLEF-001", "evolves_from", "Virtual coffee evolved from remote-first commitment"),
  rel("EL-HEUR-001", "EL-STRY-001", "evolves_from", "Emotional regulation evolved from personal experience"),
  rel("MP-META-001", "TDM-FRMW-001", "evolves_from", "Decision meta-pattern evolved from ADR practice"),
  rel("MP-META-002", "EL-STRY-001", "evolves_from", "Risk assessment pattern evolved from emotional experiences"),
  rel("MP-FRMW-001", "DE-STRY-001", "evolves_from", "Pattern recognition evolved from domain expertise stories"),
  rel("COM-STYL-001", "PV-BLEF-001", "evolves_from", "Direct communication evolved from transparency value"),
  rel("COM-SKIL-001", "DE-SKIL-001", "evolves_from", "Whiteboard skill evolved from systems thinking expertise"),
  rel("PV-HEUR-001", "PV-BLEF-002", "evolves_from", "Intellectual honesty heuristic evolved from meritocracy belief"),

  // ── Additional relations to reach 267 ────────────────────────────────────────
  // More supports
  rel("DE-BLEF-001", "OSS-BLEF-001", "supports", "Domain mastery belief supports open-source contribution"),
  rel("HP-PREF-001", "PV-BLEF-002", "supports", "Diversity preference supports meritocracy value"),
  rel("SL-FRMW-001", "MC-HEUR-001", "supports", "Decision metabolism supports meeting manifesto scaling"),
  rel("DA-SKIL-001", "DE-FACT-002", "supports", "Query-first modeling leverages PostgreSQL expertise"),
  rel("SP-BLEF-001", "LDR-BLEF-001", "supports", "Security culture requires team autonomy"),

  // More contradicts
  rel("LDR-PREF-001", "SL-HEUR-001", "contradicts", "Flat hierarchy vs. deliberately late hiring creates gaps"),
  rel("OSS-BLEF-001", "SP-HEUR-001", "contradicts", "Open contribution enthusiasm vs. strict secret scanning"),

  // More refines
  rel("DA-SKIL-001", "DA-HEUR-001", "refines", "Query-first modeling refines schema evolution approach"),
  rel("SP-BLEF-001", "SP-ANTI-001", "refines", "Security culture belief refines what counts as theater"),

  // More exemplifies
  rel("TDM-PREF-002", "TDM-FRMW-002", "exemplifies", "IaC preference exemplifies bounded context in infrastructure"),
  rel("LDR-EMOT-001", "PV-EMOT-001", "exemplifies", "Leadership trust exemplifies pride-in-craft value"),
  rel("HP-HEUR-001", "HP-BLEF-001", "exemplifies", "Red flag heuristics exemplify hiring beliefs concretely"),

  // More triggers
  rel("EL-EMOT-002", "LDR-SKIL-001", "triggers", "Team protection emotion triggers conflict resolution"),
  rel("PO-SKIL-001", "DA-SKIL-001", "triggers", "Profiling results trigger data model review"),
  rel("OSS-HEUR-001", "VM-HEUR-001", "triggers", "Low OSS maturity score triggers vendor exit analysis"),
  rel("HP-BLEF-001", "CP-BLEF-001", "triggers", "Hiring beliefs trigger parallel track design"),

  // More evolves_from
  rel("SP-FRMW-001", "IR-STRY-001", "evolves_from", "Threat modeling evolved from past incident lessons"),
  rel("DA-PREF-001", "DA-FRMW-001", "evolves_from", "Streaming preference evolved from data ownership practice"),
  rel("SL-HEUR-001", "SL-STRY-001", "evolves_from", "Hiring timing rule evolved from founding constraints"),
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

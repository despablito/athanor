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

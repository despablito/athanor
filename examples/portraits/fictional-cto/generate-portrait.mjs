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

// ─── Export for next stages ────────────────────────────────────────────────────

const allChunks = [
  ...tdmChunks,
  ...ldrChunks,
  ...comChunks,
  ...pvChunks,
  ...deChunks,
  ...elChunks,
  ...mpChunks,
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

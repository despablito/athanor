export const PHASE1_PROMPT = `You are in Phase 1: Taxonomy — mapping the STRUCTURE of how this person thinks.

Your goal is NOT to capture specific knowledge yet. Instead, you're building a map of:
- What clusters of knowledge exist in their mind?
- How do they categorize problems?
- What mental models do they use as lenses?
- What are the key domains they think across?
- What frameworks organize their decision-making?

Think of this as building the table of contents for their mind, not writing the book.

Target chunk types: framework, preference, belief, heuristic
Target uniqueness: focus on what makes their mental structure DIFFERENT from peers.

When asking follow-ups:
- If they mention a domain, ask how they mentally subdivide it
- If they mention a preference, ask what framework underlies it
- If they describe a process, ask what principles drive each step
- If they give a broad statement, ask for the exceptions

Output your next question as a single conversational string. Build on what they've said.`;

export const PHASE1_ENTRY_QUESTIONS = [
  "Let's map how your mind works. When you encounter a new problem in your domain, what's the first thing you do — what's your initial mental sort?",
  "If you had to teach someone to think like you, what are the 3-4 key mental models or frameworks they'd need to internalize first?",
  "What's a decision you make regularly where other smart people consistently reach a different conclusion? Walk me through your reasoning process.",
  "How do you categorize the problems you deal with? Not the official taxonomy — your personal one. The buckets in your head.",
];

export const PHASE1_COMPLETION_PROMPT = `Analyze the conversation so far and determine if Phase 1 (Taxonomy) is complete.

Phase 1 is complete when:
1. At least 3-4 distinct knowledge clusters have been identified
2. The subject has described their mental models or frameworks for decision-making
3. Their preference patterns are becoming clear (not just stated, but with reasoning)
4. You have a sense of what makes their thinking structure DIFFERENT from peers

Respond with JSON:
{
  "complete": boolean,
  "reason": "why complete or what's still missing",
  "clusters_identified": ["list of clusters found so far"]
}`;

export const PHASE2_PROMPT = `You are in Phase 2: Case-Based Reasoning — capturing decision-making in action.

Your goal is to surface 5-7 of the HARDEST decisions or cases this person has faced. Not routine work — the edge cases, the ones that taught them something, the ones they still think about.

For each case, you want to extract:
- What made it hard (the specific tension or trade-off)
- How they actually decided (not how they'd recommend deciding)
- What they learned (the heuristic that crystallized from the experience)
- What they'd do differently now (evolution of thinking)

Target chunk types: heuristic, anti-pattern, story, skill
Target uniqueness: CRITICAL — these should be the cases that DEFINE their expertise.

When asking follow-ups:
- If they describe what happened, ask what they were FEELING during it
- If they give the lesson learned, ask for a time the lesson DIDN'T apply
- If they describe a success, ask about the thing that almost went wrong
- If they mention a principle, ask them to walk through the messiest case where they applied it

Output your next question as a single conversational string.`;

export const PHASE2_ENTRY_QUESTIONS = [
  "Let's go case by case through the hardest problems you've faced. What's the single most difficult decision you've had to make in the last few years? Walk me through it — not the outcome, but the process of deciding.",
  "Tell me about a time you were completely wrong about something you were confident about. What did that feel like, and what changed in how you think?",
  "What's a problem you solved that you're most proud of — not because it was impressive to others, but because of what it required of YOU specifically?",
];

export const PHASE2_COMPLETION_PROMPT = `Analyze the conversation so far and determine if Phase 2 (Case-Based Reasoning) is complete.

Phase 2 is complete when:
1. At least 4-5 concrete cases/stories have been explored in depth
2. Each case has yielded at least one heuristic or anti-pattern
3. The subject has described at least one case where they were wrong
4. Their decision-making process under pressure is becoming clear

Respond with JSON:
{
  "complete": boolean,
  "reason": "why complete or what's still missing",
  "cases_explored": number,
  "heuristics_identified": number
}`;

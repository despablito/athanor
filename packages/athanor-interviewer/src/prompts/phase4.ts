export const PHASE4_PROMPT = `You are in Phase 4: History + Legacy — what stays after you.

This final phase captures the arc of someone's identity over time:
- How have they changed? What did they used to believe that they now reject?
- What are the constants? What has remained true about them across decades?
- What do they want their impact to be? Not achievements — influence on how others think.
- What patterns do they see in their own evolution?
- What would surprise their younger self about who they've become?

This phase produces meta-chunks — patterns about patterns. It's the highest level of abstraction.

Target chunk types: meta, belief, story, style
Target uniqueness: HIGH to CRITICAL — these capture the deepest identity structures.

When asking follow-ups:
- If they describe evolution, ask what caused the shift (the specific moment)
- If they describe a constant, ask if it's ever been tested
- If they describe impact, ask what they'd feel if the opposite happened
- If they give a polished narrative, ask for the messy version

Output your next question as a single conversational string.`;

export const PHASE4_ENTRY_QUESTIONS = [
  "Let's zoom out to the arc. What's the biggest way you've changed in how you think over the last 10 years? Not your circumstances — your actual thinking patterns.",
  "What's something you believed passionately when you were younger that you now think is completely wrong? And do you miss believing it?",
  "If you could distill everything you know into 3 principles that you'd pass on, what would they be? And which one would most people get wrong on first hearing?",
  "When you're gone, what pattern or way of thinking do you hope persists in the people you've influenced? Not a specific achievement — a way of seeing the world.",
];

export const PHASE4_COMPLETION_PROMPT = `Analyze the conversation so far and determine if Phase 4 (History + Legacy) is complete.

Phase 4 is complete when:
1. The subject has described at least 2-3 significant evolutions in their thinking
2. At least 1-2 constants/invariants have been identified
3. Meta-patterns about their own patterns have emerged
4. The conversation has touched on their sense of impact or legacy

Respond with JSON:
{
  "complete": boolean,
  "reason": "why complete or what's still missing",
  "evolutions_described": number,
  "constants_identified": number,
  "meta_patterns_found": number
}`;

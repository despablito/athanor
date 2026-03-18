export const PHASE0_PROMPT = `You are in Phase 0: Pre-Research.

Your task is to analyze the available context about this person and generate targeted, personalized interview questions. If you have prior conversation context or existing portrait data, use it to identify gaps and formulate questions that will fill those gaps.

If there is no prior context, generate broad exploratory questions that will help you understand the person's domain, expertise areas, and identity landscape.

Focus on:
- What domains do they operate in?
- What are their key responsibilities and roles?
- What unique perspective do they bring to their field?
- Where do they sit in the landscape of their peers?

Generate 3-5 targeted questions. Each question should be specific and conversational, not generic.

Output your questions as a JSON array of strings.`;

export const PHASE0_ENTRY_QUESTIONS = [
  "Before we dive deep, I'd love to understand the landscape. What do you spend most of your time thinking about — not just professionally, but the problems that genuinely occupy your mind?",
  "If someone who works in your field described you to a stranger, what would they get wrong? What's the gap between how you're perceived and how you actually operate?",
  "What's a topic where you hold a position that most of your peers would disagree with? Not a contrarian take for its own sake — something you genuinely believe that puts you at odds with the mainstream view in your world.",
];

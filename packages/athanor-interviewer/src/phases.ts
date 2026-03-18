import type { PhaseDefinition, PhaseId } from "./types.js";
import { PHASE0_ENTRY_QUESTIONS } from "./prompts/phase0.js";
import { PHASE1_ENTRY_QUESTIONS } from "./prompts/phase1.js";
import { PHASE2_ENTRY_QUESTIONS } from "./prompts/phase2.js";
import { PHASE3_ENTRY_QUESTIONS } from "./prompts/phase3.js";
import { PHASE4_ENTRY_QUESTIONS } from "./prompts/phase4.js";

export const PHASES: Record<PhaseId, PhaseDefinition> = {
  0: {
    id: 0,
    name: "Pre-Research",
    description: "Analyze context and generate targeted questions",
    targetTypes: ["framework", "fact", "skill"],
    sourceType: "interview",
    minQuestions: 3,
    maxQuestions: 6,
    entryQuestions: PHASE0_ENTRY_QUESTIONS,
  },
  1: {
    id: 1,
    name: "Taxonomy",
    description: "Map the structure of knowledge and decision-making",
    targetTypes: ["framework", "preference", "belief", "heuristic"],
    sourceType: "interview",
    minQuestions: 4,
    maxQuestions: 12,
    entryQuestions: PHASE1_ENTRY_QUESTIONS,
  },
  2: {
    id: 2,
    name: "Case-Based Reasoning",
    description: "Surface 5-7 hardest decisions and the heuristics they produced",
    targetTypes: ["heuristic", "anti-pattern", "story", "skill"],
    sourceType: "interview",
    minQuestions: 5,
    maxQuestions: 15,
    entryQuestions: PHASE2_ENTRY_QUESTIONS,
  },
  3: {
    id: 3,
    name: "Anti-Patterns + Emotions",
    description: "Extract emotional patterns, contradictions, and non-negotiable rules",
    targetTypes: ["anti-pattern", "emotion", "contradiction", "rant", "ritual"],
    sourceType: "interview",
    minQuestions: 4,
    maxQuestions: 12,
    entryQuestions: PHASE3_ENTRY_QUESTIONS,
  },
  4: {
    id: 4,
    name: "History + Legacy",
    description: "Capture identity evolution, constants, and meta-patterns",
    targetTypes: ["meta", "belief", "story", "style"],
    sourceType: "interview",
    minQuestions: 4,
    maxQuestions: 10,
    entryQuestions: PHASE4_ENTRY_QUESTIONS,
  },
};

export const PHASE_ORDER: PhaseId[] = [0, 1, 2, 3, 4];

export function getPhase(id: PhaseId): PhaseDefinition {
  return PHASES[id];
}

export function getNextPhase(current: PhaseId): PhaseId | null {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx >= PHASE_ORDER.length - 1) return null;
  return PHASE_ORDER[idx + 1];
}

/** Get the phase-specific system context for the LLM */
export function getPhaseSystemPrompt(id: PhaseId): string {
  const phasePrompts: Record<PhaseId, string> = {
    0: "You are in Phase 0: Pre-Research. Analyze context and generate targeted questions about the subject's domain, expertise, and unique perspective.",
    1: `You are in Phase 1: Taxonomy — mapping the STRUCTURE of how this person thinks.

Your goal is NOT to capture specific knowledge yet. Instead, you're building a map of:
- What clusters of knowledge exist in their mind?
- How do they categorize problems?
- What mental models do they use as lenses?
- What frameworks organize their decision-making?

Target chunk types: framework, preference, belief, heuristic

When asking follow-ups:
- If they mention a domain, ask how they mentally subdivide it
- If they mention a preference, ask what framework underlies it
- If they describe a process, ask what principles drive each step
- If they give a broad statement, ask for the exceptions

Output your next question as a single conversational string. Build on what they've said.`,
    2: `You are in Phase 2: Case-Based Reasoning — capturing decision-making in action.

Your goal is to surface 5-7 of the HARDEST decisions or cases this person has faced. Not routine work — the edge cases that taught them something.

For each case, extract: what made it hard, how they decided, what they learned, what they'd do differently.

Target chunk types: heuristic, anti-pattern, story, skill

When asking follow-ups:
- If they describe what happened, ask what they were FEELING during it
- If they give the lesson learned, ask for a time the lesson DIDN'T apply
- If they describe a success, ask about the thing that almost went wrong

Output your next question as a single conversational string.`,
    3: `You are in Phase 3: Anti-Patterns + Emotions — the deep, uncomfortable stuff.

You're looking for:
- Anti-patterns: things they've learned to NEVER do, and why
- Emotional patterns: what triggers strong feelings, and how those feelings influence decisions
- Contradictions: genuinely conflicting positions they hold simultaneously
- Hardcoded exceptions: rules that override general principles
- Rituals: consistent unusual behaviors

Target chunk types: anti-pattern, emotion, contradiction, rant, ritual

When asking follow-ups:
- If they describe a rule, ask about the EXCEPTION
- If they express frustration, ask what specifically triggers it
- If they describe a belief, ask what opposing belief they ALSO hold
- If they say "I always...", ask "When DON'T you?"

Output your next question as a single conversational string.`,
    4: `You are in Phase 4: History + Legacy — what stays after you.

Capture the arc of identity over time:
- How have they changed? What did they reject?
- What constants have survived decades?
- What do they want their impact to be?
- What patterns do they see in their own evolution?

Target chunk types: meta, belief, story, style

When asking follow-ups:
- If they describe evolution, ask what caused the shift
- If they describe a constant, ask if it's ever been tested
- If they describe impact, ask what they'd feel if the opposite happened

Output your next question as a single conversational string.`,
  };

  return phasePrompts[id];
}

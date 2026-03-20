export {
  IdentityInquisitor,
  scanAttackVectors,
  pickAttackVectors,
  scanContradictionVectors,
  scanOrphanHardRuleVectors,
  describeAttackVector,
} from "./inquisitor.js";
export type {
  AttackVector,
  InquisitorJudgeResult,
  RedTeamScenarioResult,
  InquisitorPhase,
} from "./inquisitor.js";

export { Interviewer, InterviewSessionImpl } from "./agent.js";
export { PHASES, PHASE_ORDER, getPhase, getNextPhase, getPhaseSystemPrompt } from "./phases.js";
export { analyzeDepth, getAdaptiveFollowUp } from "./adaptive.js";
export {
  createSessionState,
  loadSessionState,
  saveSessionState,
  generateTranscript,
  createScheduleState,
  loadScheduleState,
  saveScheduleState,
  addSessionToHistory,
  getDefaultSchedule,
  estimateSessionDuration,
} from "./scheduler.js";

export { buildPortraitBriefForInterview } from "./portrait-brief.js";
export type { PortraitBriefOptions } from "./portrait-brief.js";

export type {
  PhaseId,
  PhaseDefinition,
  InterviewMode,
  Turn,
  SessionState,
  PhaseProgress,
  InterviewerConfig,
  SessionOptions,
  DepthAnalysis,
  InterviewSession,
  ScheduleConfig,
  ScheduleState,
  SessionSummary,
} from "./types.js";

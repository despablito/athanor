/** Cluster → color mapping (prompt-specified palette + dynamic fallback) */
const CLUSTER_COLORS: Record<string, string> = {
  // Prompt reference palette
  hiring: "#5b9cf6",
  strategic_decisions: "#e85d75",
  management: "#78e08f",
  values_and_philosophy: "#fbbf24",
  identity_and_voice: "#ec4899",
  co_founder_conflicts: "#ff6b6b",
  cognitive_style: "#b47cf7",
  employee_retention: "#fb923c",
  energy_and_self_management: "#34d399",
  genealogy_and_legacy: "#a3e635",
  investments: "#fcd34d",
  historical_context: "#94a3b8",
  deeptech_communication: "#45c9a0",
  // Map existing fictional-CTO portrait clusters
  "technical-decision-making": "#5b9cf6",
  "team-leadership": "#78e08f",
  communication: "#45c9a0",
  "personal-values": "#fbbf24",
  "domain-expertise": "#b47cf7",
  "emotional-landscape": "#ec4899",
  "meta-patterns": "#34d399",
};

const EXTRA_COLORS = [
  "#e85d75", "#fb923c", "#a3e635", "#fcd34d",
  "#ff6b6b", "#94a3b8", "#6366f1", "#0ea5e9",
  "#d946ef", "#14b8a6", "#f59e0b", "#84cc16",
];

let extraIdx = 0;

export function clusterColor(cluster: string): string {
  if (CLUSTER_COLORS[cluster]) return CLUSTER_COLORS[cluster];
  CLUSTER_COLORS[cluster] = EXTRA_COLORS[extraIdx % EXTRA_COLORS.length];
  extraIdx++;
  return CLUSTER_COLORS[cluster];
}

/** Relation type → color mapping (prompt spec) */
export const RELATION_COLORS: Record<string, string> = {
  CONTRASTS_WITH: "#e85d75",
  LEARNED_FROM: "#45c9a0",
  INSTANTIATES: "#5b9cf6",
  ENABLES: "#f5a623",
  HARDCODED_EXCEPTION: "#b47cf7",
  EXPRESSED_THROUGH: "#ec4899",
};

/** Node radius by uniqueness */
export const UNIQUENESS_RADIUS: Record<string, number> = {
  CRITICAL: 13,
  HIGH: 10,
  MEDIUM: 7,
};

export const META_RADIUS = 17;

/** Badge colors */
export const TYPE_BADGE_COLORS: Record<string, string> = {
  heuristic: "#5b9cf6",
  "anti-pattern": "#e85d75",
  preference: "#b47cf7",
  belief: "#78e08f",
  fact: "#94a3b8",
  skill: "#45c9a0",
  emotion: "#fbbf24",
  story: "#fcd34d",
  contradiction: "#fb923c",
  style: "#ec4899",
  framework: "#34d399",
  rant: "#ff6b6b",
  meta: "#34d399",
  ritual: "#a3e635",
  hard_rule: "#e85d75",
};

export const UNIQUENESS_BADGE_COLORS: Record<string, string> = {
  CRITICAL: "#e85d75",
  HIGH: "#fbbf24",
  MEDIUM: "#94a3b8",
};

/** Special stroke colors for node types */
export const NODE_STROKE_SPECIAL = {
  meta: { color: "#34d399", width: 2, dash: "" },
  emotion: { color: "#fbbf24", width: 1.8, dash: "" },
  identity_cluster: { color: "", width: 1.5, dash: "4 2" }, // uses cluster color
  historical_cluster: { color: "#94a3b8", width: 1.5, dash: "6 2" },
} as const;

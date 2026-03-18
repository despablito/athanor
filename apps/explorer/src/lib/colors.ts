/** Consistent cluster → color mapping */
const CLUSTER_COLORS: Record<string, string> = {
  "technical-decision-making": "#4a9eff",
  "team-leadership": "#a855f7",
  "communication": "#22c55e",
  "personal-values": "#f97316",
  "domain-expertise": "#06b6d4",
  "emotional-landscape": "#ec4899",
  "meta-patterns": "#eab308",
};

const EXTRA_COLORS = [
  "#ef4444", "#8b5cf6", "#14b8a6", "#f59e0b",
  "#6366f1", "#84cc16", "#d946ef", "#0ea5e9",
];

let extraIdx = 0;

export function clusterColor(cluster: string): string {
  if (CLUSTER_COLORS[cluster]) return CLUSTER_COLORS[cluster];
  if (!CLUSTER_COLORS[cluster]) {
    CLUSTER_COLORS[cluster] = EXTRA_COLORS[extraIdx % EXTRA_COLORS.length];
    extraIdx++;
  }
  return CLUSTER_COLORS[cluster];
}

/** Relation type → color mapping */
export const RELATION_COLORS: Record<string, string> = {
  INSTANTIATES: "#4a9eff",
  ENABLES: "#22c55e",
  LEARNED_FROM: "#eab308",
  CONTRASTS_WITH: "#ef4444",
  HARDCODED_EXCEPTION: "#f97316",
  EXPRESSED_THROUGH: "#a855f7",
};

/** Node size by uniqueness */
export const UNIQUENESS_RADIUS: Record<string, number> = {
  CRITICAL: 12,
  HIGH: 8,
  MEDIUM: 5,
};

/** Badge colors */
export const TYPE_BADGE_COLORS: Record<string, string> = {
  heuristic: "#4a9eff",
  "anti-pattern": "#ef4444",
  preference: "#a855f7",
  belief: "#22c55e",
  fact: "#9494a8",
  skill: "#06b6d4",
  emotion: "#ec4899",
  story: "#eab308",
  contradiction: "#f97316",
  style: "#8b5cf6",
  framework: "#14b8a6",
  rant: "#ef4444",
  meta: "#d946ef",
  ritual: "#84cc16",
};

export const UNIQUENESS_BADGE_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
};

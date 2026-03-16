export type ChunkId = string & { __brand: "ChunkId" };

export const CHUNK_TYPES = [
  "heuristic",
  "anti-pattern",
  "preference",
  "belief",
  "fact",
  "skill",
  "emotion",
  "story",
  "contradiction",
  "style",
  "framework",
  "rant",
  "meta",
  "ritual",
] as const;

export type ChunkType = (typeof CHUNK_TYPES)[number];

export const CHUNK_TYPE_CODES: Record<ChunkType, string> = {
  heuristic: "HEUR",
  "anti-pattern": "ANTI",
  preference: "PREF",
  belief: "BLEF",
  fact: "FACT",
  skill: "SKIL",
  emotion: "EMOT",
  story: "STRY",
  contradiction: "CONT",
  style: "STYL",
  framework: "FRMW",
  rant: "RANT",
  meta: "META",
  ritual: "RITL",
};

export const RELATION_TYPES = [
  "INSTANTIATES",
  "ENABLES",
  "LEARNED_FROM",
  "CONTRASTS_WITH",
  "HARDCODED_EXCEPTION",
  "EXPRESSED_THROUGH",
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export const UNIQUENESS_LEVELS = ["CRITICAL", "HIGH", "MEDIUM"] as const;

export type Uniqueness = (typeof UNIQUENESS_LEVELS)[number];

export const SOURCE_TYPES = [
  "interview",
  "email",
  "document",
  "code",
  "meeting",
  "chat",
  "social",
  "observation",
  "inferred",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const RECOMMENDED_CLUSTERS = [
  "technical-decision-making",
  "team-leadership",
  "communication",
  "personal-values",
  "domain-expertise",
  "emotional-landscape",
  "meta-patterns",
] as const;

export type ClusterName = (typeof RECOMMENDED_CLUSTERS)[number] | string;

export interface Chunk {
  chunk_id: ChunkId;
  author: string;
  cluster: string;
  type: ChunkType;
  uniqueness: Uniqueness;
  source: SourceType;
  confidence: number;
  context_tags: string[];
  linked_chunks: ChunkId[];
  content: string;
}

export interface ChunkInput {
  author?: string;
  cluster: string;
  type: ChunkType;
  uniqueness: Uniqueness;
  source: SourceType;
  confidence: number;
  context_tags?: string[];
  linked_chunks?: ChunkId[];
  content: string;
}

export interface Relation {
  source: ChunkId;
  target: ChunkId;
  type: RelationType;
  description?: string;
}

export interface RelationInput {
  source: ChunkId;
  target: ChunkId;
  type: RelationType;
  description?: string;
}

export interface PortraitSubject {
  name: string;
  id: string;
}

export interface PortraitMetadata {
  completeness_score: number;
  chunk_count: number;
  relation_count: number;
  cluster_coverage: Record<string, number>;
}

export interface PortraitJSON {
  version: string;
  subject: PortraitSubject;
  created_at: string;
  chunks: Chunk[];
  relations: Relation[];
  metadata: PortraitMetadata;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PortraitStats {
  chunk_count: number;
  relation_count: number;
  clusters: Record<string, number>;
  types: Record<string, number>;
  uniqueness: Record<string, number>;
  critical_ratio: number;
  avg_confidence: number;
  completeness_score: number;
}

export function asChunkId(id: string): ChunkId {
  return id as ChunkId;
}

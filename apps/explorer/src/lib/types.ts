/** Local types for the explorer — avoids importing branded types from core at runtime */

export interface Chunk {
  chunk_id: string;
  author: string;
  cluster: string;
  type: string;
  uniqueness: string;
  source: string;
  confidence: number;
  context_tags: string[];
  linked_chunks: string[];
  content: string;
}

export interface Relation {
  source: string;
  target: string;
  type: string;
  description?: string;
  weight?: number;
}

export interface PortraitJSON {
  version: string;
  subject: { name: string; id: string };
  created_at: string;
  chunks: Chunk[];
  relations: Relation[];
  metadata: {
    completeness_score: number;
    chunk_count: number;
    relation_count: number;
    cluster_coverage: Record<string, number>;
  };
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  chunk: Chunk;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relation: Relation;
}

// Need d3 namespace reference for simulation types
import type * as d3 from "d3";

export type FilterState = {
  cluster: string | null;
  type: string | null;
  uniqueness: string | null;
  search: string;
};

export type ViewMode =
  | "labels"
  | "relations"
  | "gaps"
  | "critical"
  | "identity"
  | "knowledge"
  | "meta"
  | "emotions"
  | null;

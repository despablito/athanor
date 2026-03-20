import type { Chunk, PortraitJSON } from "@athanor/core";

const UNIQUENESS_RANK: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
};

export interface PortraitBriefOptions {
  /** Max number of chunk lines in the brief (default 14) */
  maxChunkSamples?: number;
  /** Truncate each chunk content to this length (default 180) */
  maxCharsPerChunk?: number;
  /** Max relation lines (default 10) */
  maxRelations?: number;
}

/**
 * Compact text for interview prompts: cluster/type coverage plus representative
 * chunk fragments and relation lines. Bounded so prompts stay small.
 */
export function buildPortraitBriefForInterview(
  portrait: PortraitJSON,
  opts: PortraitBriefOptions = {},
): string {
  const maxChunkSamples = opts.maxChunkSamples ?? 14;
  const maxCharsPerChunk = opts.maxCharsPerChunk ?? 180;
  const maxRelations = opts.maxRelations ?? 10;

  const chunks = [...portrait.chunks].sort((a, b) => {
    const ua = UNIQUENESS_RANK[a.uniqueness] ?? 9;
    const ub = UNIQUENESS_RANK[b.uniqueness] ?? 9;
    if (ua !== ub) return ua - ub;
    return b.confidence - a.confidence;
  });

  const lines: string[] = [];
  lines.push(`Subject: ${portrait.subject.name}`);
  lines.push(
    `Graph: ${portrait.chunks.length} chunks, ${portrait.relations.length} relations (stored chunk_count=${portrait.metadata.chunk_count}).`,
  );

  const coverage = portrait.metadata.cluster_coverage ?? {};
  const clusterSummary = Object.entries(coverage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
  if (clusterSummary) {
    lines.push(`Clusters: ${clusterSummary}`);
  }

  const typeCounts: Record<string, number> = {};
  for (const c of portrait.chunks) {
    typeCounts[c.type] = (typeCounts[c.type] ?? 0) + 1;
  }
  const typeStr = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${t}:${n}`)
    .join(", ");
  lines.push(`Chunk types: ${typeStr}`);

  lines.push("");
  lines.push(
    "Sample fragments (grounding only — do not quote verbatim in your question):",
  );

  let shown = 0;
  for (const c of chunks) {
    if (shown >= maxChunkSamples) break;
    lines.push(formatChunkLine(c, maxCharsPerChunk));
    shown++;
  }

  if (portrait.relations.length > 0) {
    lines.push("");
    lines.push("Sample relations:");
    for (const r of portrait.relations.slice(0, maxRelations)) {
      const desc = r.description ? ` — ${r.description}` : "";
      lines.push(`- ${r.type}: ${r.source} → ${r.target}${desc}`);
    }
  }

  return lines.join("\n");
}

function formatChunkLine(c: Chunk, maxChars: number): string {
  const text = c.content.replace(/\s+/g, " ").trim();
  const clipped =
    text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
  return `- [${c.type} | ${c.cluster} | ${c.uniqueness}] ${clipped}`;
}

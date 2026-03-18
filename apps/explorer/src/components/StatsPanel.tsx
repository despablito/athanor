"use client";

import { useMemo } from "react";
import { usePortrait } from "@/lib/portrait-context";
import { clusterColor, UNIQUENESS_BADGE_COLORS, TYPE_BADGE_COLORS } from "@/lib/colors";

export default function StatsPanel() {
  const { portrait } = usePortrait();

  const stats = useMemo(() => {
    if (!portrait) return null;

    const types: Record<string, number> = {};
    const uniqueness: Record<string, number> = {};
    let totalConf = 0;

    for (const c of portrait.chunks) {
      types[c.type] = (types[c.type] ?? 0) + 1;
      uniqueness[c.uniqueness] = (uniqueness[c.uniqueness] ?? 0) + 1;
      totalConf += c.confidence;
    }

    return {
      chunkCount: portrait.chunks.length,
      relationCount: portrait.relations.length,
      completeness: portrait.metadata.completeness_score,
      avgConfidence: portrait.chunks.length > 0 ? totalConf / portrait.chunks.length : 0,
      criticalRatio: (uniqueness["CRITICAL"] ?? 0) / Math.max(portrait.chunks.length, 1),
      types: Object.entries(types).sort(([, a], [, b]) => b - a),
      uniqueness: Object.entries(uniqueness).sort(([, a], [, b]) => b - a),
      clusters: Object.entries(portrait.metadata.cluster_coverage).sort(([, a], [, b]) => b - a),
    };
  }, [portrait]);

  if (!stats) {
    return <div className="p-4 text-[--text-dim] text-sm">Loading…</div>;
  }

  const maxTypeCount = Math.max(...stats.types.map(([, n]) => n), 1);
  const maxClusterCount = Math.max(...stats.clusters.map(([, n]) => n), 1);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      {/* Big numbers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-2 rounded-lg p-3 text-center">
          <div className="text-3xl font-mono text-accent-blue">
            {(stats.completeness * 100).toFixed(0)}%
          </div>
          <div className="text-[--text-dim] text-[10px] uppercase tracking-wider mt-1">
            Completeness
          </div>
        </div>
        <div className="bg-surface-2 rounded-lg p-3 text-center">
          <div className="text-3xl font-mono text-accent-purple">
            {stats.chunkCount}
          </div>
          <div className="text-[--text-dim] text-[10px] uppercase tracking-wider mt-1">
            Chunks
          </div>
        </div>
        <div className="bg-surface-2 rounded-lg p-3 text-center">
          <div className="text-3xl font-mono text-accent-green">
            {stats.relationCount}
          </div>
          <div className="text-[--text-dim] text-[10px] uppercase tracking-wider mt-1">
            Relations
          </div>
        </div>
        <div className="bg-surface-2 rounded-lg p-3 text-center">
          <div className="text-3xl font-mono text-accent-orange">
            {(stats.avgConfidence * 100).toFixed(0)}%
          </div>
          <div className="text-[--text-dim] text-[10px] uppercase tracking-wider mt-1">
            Avg Confidence
          </div>
        </div>
      </div>

      {/* Uniqueness distribution */}
      <div>
        <div className="text-[--text-dim] text-xs uppercase tracking-wider mb-2">
          Uniqueness Distribution
        </div>
        <div className="space-y-1.5">
          {stats.uniqueness.map(([level, count]) => (
            <div key={level} className="flex items-center gap-2">
              <span
                className="text-xs font-mono w-16"
                style={{ color: UNIQUENESS_BADGE_COLORS[level] ?? "#888" }}
              >
                {level}
              </span>
              <div className="flex-1 bg-surface-3 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(count / stats.chunkCount) * 100}%`,
                    backgroundColor: UNIQUENESS_BADGE_COLORS[level] ?? "#888",
                  }}
                />
              </div>
              <span className="text-xs text-[--text-dim] font-mono w-8 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Types */}
      <div>
        <div className="text-[--text-dim] text-xs uppercase tracking-wider mb-2">
          Chunk Types
        </div>
        <div className="space-y-1">
          {stats.types.map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <span
                className="text-[11px] font-mono w-24 truncate"
                style={{ color: TYPE_BADGE_COLORS[type] ?? "#888" }}
              >
                {type}
              </span>
              <div className="flex-1 bg-surface-3 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(count / maxTypeCount) * 100}%`,
                    backgroundColor: TYPE_BADGE_COLORS[type] ?? "#888",
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-[11px] text-[--text-dim] font-mono w-6 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Clusters */}
      <div>
        <div className="text-[--text-dim] text-xs uppercase tracking-wider mb-2">
          Cluster Coverage
        </div>
        <div className="space-y-1">
          {stats.clusters.map(([cluster, count]) => (
            <div key={cluster} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: clusterColor(cluster) }}
              />
              <span className="text-[11px] text-[--text-secondary] flex-1 truncate">
                {cluster}
              </span>
              <div className="w-20 bg-surface-3 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(count / maxClusterCount) * 100}%`,
                    backgroundColor: clusterColor(cluster),
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-[11px] text-[--text-dim] font-mono w-6 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

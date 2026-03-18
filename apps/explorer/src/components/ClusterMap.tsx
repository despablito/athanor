"use client";

import { useMemo } from "react";
import { usePortrait } from "@/lib/portrait-context";
import { clusterColor } from "@/lib/colors";

// Expected chunk counts per cluster for completeness estimation
const EXPECTED_PER_CLUSTER = 15;

export default function ClusterMap() {
  const { portrait, filters, setFilters } = usePortrait();

  const clusterData = useMemo(() => {
    if (!portrait) return [];

    const coverage = portrait.metadata.cluster_coverage;
    return Object.entries(coverage)
      .map(([name, count]) => ({
        name,
        count,
        completeness: Math.min(count / EXPECTED_PER_CLUSTER, 1),
      }))
      .sort((a, b) => b.count - a.count);
  }, [portrait]);

  if (!portrait || clusterData.length === 0) {
    return <div className="p-4 text-[--text-dim] text-sm">No cluster data</div>;
  }

  const maxCount = Math.max(...clusterData.map((d) => d.count));

  return (
    <div className="p-4">
      <div className="text-[--text-dim] text-xs uppercase tracking-wider mb-3">
        Cluster Coverage
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {clusterData.map((cluster) => {
          const isActive = filters.cluster === cluster.name;
          const baseColor = clusterColor(cluster.name);

          return (
            <button
              key={cluster.name}
              onClick={() =>
                setFilters({
                  ...filters,
                  cluster: isActive ? null : cluster.name,
                })
              }
              className={`
                relative rounded-lg p-3 text-left transition-all border
                ${isActive
                  ? "border-accent-blue bg-surface-3"
                  : "border-[--border] bg-surface-2 hover:bg-surface-3"
                }
              `}
              style={{
                minHeight: `${Math.max(60, (cluster.count / maxCount) * 100 + 40)}px`,
              }}
            >
              {/* Completeness bar background */}
              <div
                className="absolute inset-0 rounded-lg opacity-10"
                style={{
                  background: `linear-gradient(to right, ${baseColor} ${cluster.completeness * 100}%, transparent ${cluster.completeness * 100}%)`,
                }}
              />

              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: baseColor }}
                  />
                  <span className="text-xs text-[--text-secondary] truncate">
                    {cluster.name}
                  </span>
                </div>
                <div className="font-mono text-lg" style={{ color: baseColor }}>
                  {cluster.count}
                </div>
                <div className="text-[10px] text-[--text-dim]">
                  {(cluster.completeness * 100).toFixed(0)}% complete
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

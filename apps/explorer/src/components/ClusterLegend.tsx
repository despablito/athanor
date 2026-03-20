"use client";

import { usePortrait } from "@/lib/portrait-context";
import { clusterColor, RELATION_COLORS } from "@/lib/colors";

export default function ClusterLegend() {
  const { portrait, filters, setFilters } = usePortrait();

  if (!portrait) return null;

  const clusters = [...new Set(portrait.chunks.map((c) => c.cluster))].sort();

  const toggleCluster = (name: string) => {
    setFilters({
      ...filters,
      cluster: filters.cluster === name ? null : name,
    });
  };

  return (
    <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
      {/* Cluster grid */}
      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>
        Clusters
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {clusters.map((name) => {
          const isActive = filters.cluster === name;
          return (
            <button
              key={name}
              onClick={() => toggleCluster(name)}
              className="flex items-center gap-1.5 text-left rounded px-1 py-0.5 transition-colors"
              style={{
                background: isActive ? "var(--surface-3)" : "transparent",
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: clusterColor(name) }}
              />
              <span
                className="text-[10px] font-mono truncate"
                style={{ color: isActive ? "var(--text-primary)" : "var(--text-dim)" }}
              >
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Relation type color reference */}
      <div
        className="text-[10px] uppercase tracking-wider mt-3 mb-1.5"
        style={{ color: "var(--text-dim)" }}
      >
        Relations
      </div>
      <div className="flex flex-wrap gap-1">
        {Object.entries(RELATION_COLORS).map(([type, color]) => (
          <span
            key={type}
            className="badge"
            style={{
              backgroundColor: color + "1a",
              color,
              fontSize: "9px",
            }}
          >
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}

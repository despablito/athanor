"use client";

import { useState } from "react";
import { usePortrait } from "@/lib/portrait-context";
import GraphView from "./GraphView";
import ViewModeBar from "./ViewModeBar";
import ChunkDetail from "./ChunkDetail";
import StatsPanel from "./StatsPanel";
import ClusterLegend from "./ClusterLegend";
import EmotionRadar from "./EmotionRadar";

type RightTab = "detail" | "stats" | "emotions";

export default function PortraitDashboard() {
  const { portrait, loading, error, selectedChunkId } = usePortrait();
  const [rightTab, setRightTab] = useState<RightTab>("detail");

  // Auto-switch to detail when a chunk is selected
  if (selectedChunkId && rightTab !== "detail") {
    setRightTab("detail");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--surface-0)" }}>
        <div className="text-center">
          <div className="text-sm mb-2" style={{ color: "var(--text-dim)" }}>Loading portrait…</div>
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--surface-0)" }}>
        <div className="text-center max-w-md p-6 rounded-lg" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="text-accent-red text-sm font-medium mb-2">Failed to load portrait</div>
          <div className="text-xs" style={{ color: "var(--text-dim)" }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!portrait) return null;

  const criticalCount = portrait.chunks.filter((c) => c.uniqueness === "CRITICAL").length;
  const clusterCount = new Set(portrait.chunks.map((c) => c.cluster)).size;

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--surface-0)" }}>
      {/* Header stats bar */}
      <header
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-xs font-medium tracking-wider uppercase" style={{ color: "var(--text-dim)" }}>
            Athanor Explorer
          </h1>
          <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
            {portrait.subject.name}
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <div>
            <span style={{ color: "#5b9cf6" }}>{portrait.chunks.length}</span>
            <span className="ml-1" style={{ color: "var(--text-dim)" }}>chunks</span>
          </div>
          <div>
            <span style={{ color: "#34d399" }}>{portrait.relations.length}</span>
            <span className="ml-1" style={{ color: "var(--text-dim)" }}>relations</span>
          </div>
          <div>
            <span style={{ color: "#e85d75" }}>{criticalCount}</span>
            <span className="ml-1" style={{ color: "var(--text-dim)" }}>CRITICAL</span>
          </div>
          <div>
            <span style={{ color: "#fbbf24" }}>{clusterCount}</span>
            <span className="ml-1" style={{ color: "var(--text-dim)" }}>clusters</span>
          </div>
        </div>
      </header>

      {/* Main content: graph left + side panel right */}
      <div className="flex flex-1 min-h-0">
        {/* Graph (left ~70%) */}
        <div className="flex-[7] min-w-0 relative">
          <GraphView />
          <ViewModeBar />
        </div>

        {/* Side panel (right ~30%) */}
        <div
          className="flex-[3] min-w-[280px] max-w-[400px] border-l flex flex-col"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        >
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
            {(["detail", "stats", "emotions"] as RightTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className="flex-1 px-3 py-2 text-[10px] uppercase tracking-wider transition-colors"
                style={{
                  color: rightTab === tab ? "#5b9cf6" : "var(--text-dim)",
                  borderBottom: rightTab === tab ? "2px solid #5b9cf6" : "2px solid transparent",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {rightTab === "detail" && <ChunkDetail />}
            {rightTab === "stats" && <StatsPanel />}
            {rightTab === "emotions" && <EmotionRadar />}
          </div>

          {/* Cluster legend (always visible) */}
          <ClusterLegend />
        </div>
      </div>
    </div>
  );
}

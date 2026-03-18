"use client";

import { useState } from "react";
import { usePortrait } from "@/lib/portrait-context";
import GraphView from "./GraphView";
import ChunkDetail from "./ChunkDetail";
import StatsPanel from "./StatsPanel";
import ClusterMap from "./ClusterMap";
import EmotionRadar from "./EmotionRadar";
import FilterBar from "./FilterBar";

type RightTab = "detail" | "stats";
type BottomTab = "clusters" | "emotions";

export default function PortraitDashboard() {
  const { portrait, loading, error, selectedChunkId } = usePortrait();
  const [rightTab, setRightTab] = useState<RightTab>("detail");
  const [bottomTab, setBottomTab] = useState<BottomTab>("clusters");
  const [bottomOpen, setBottomOpen] = useState(true);

  // Auto-switch to detail when a chunk is selected
  if (selectedChunkId && rightTab !== "detail") {
    setRightTab("detail");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-0">
        <div className="text-center">
          <div className="text-[--text-dim] text-sm mb-2">Loading portrait…</div>
          <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-0">
        <div className="text-center max-w-md p-6 bg-surface-1 border border-[--border] rounded-lg">
          <div className="text-accent-red text-sm font-medium mb-2">Failed to load portrait</div>
          <div className="text-[--text-dim] text-xs">{error}</div>
        </div>
      </div>
    );
  }

  if (!portrait) return null;

  return (
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-surface-1 border-b border-[--border]">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium tracking-wider text-[--text-secondary] uppercase">
            Athanor Explorer
          </h1>
          <span className="text-xs text-[--text-dim] font-mono">
            {portrait.subject.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[--text-dim] font-mono">
            v{portrait.version}
          </span>
        </div>
      </header>

      {/* Filter bar */}
      <FilterBar />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Graph (left 70%) */}
        <div className="flex-[7] min-w-0 relative">
          <GraphView />
        </div>

        {/* Side panel (right 30%) */}
        <div className="flex-[3] min-w-[280px] max-w-[400px] border-l border-[--border] bg-surface-1 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-[--border]">
            <button
              onClick={() => setRightTab("detail")}
              className={`flex-1 px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                rightTab === "detail"
                  ? "text-accent-blue border-b-2 border-accent-blue"
                  : "text-[--text-dim] hover:text-[--text-secondary]"
              }`}
            >
              Detail
            </button>
            <button
              onClick={() => setRightTab("stats")}
              className={`flex-1 px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                rightTab === "stats"
                  ? "text-accent-blue border-b-2 border-accent-blue"
                  : "text-[--text-dim] hover:text-[--text-secondary]"
              }`}
            >
              Stats
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 min-h-0">
            {rightTab === "detail" ? <ChunkDetail /> : <StatsPanel />}
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      <div className={`border-t border-[--border] bg-surface-1 transition-all ${bottomOpen ? "h-[240px]" : "h-8"}`}>
        {/* Bottom tabs header */}
        <div className="flex items-center border-b border-[--border] h-8">
          <button
            onClick={() => setBottomOpen(!bottomOpen)}
            className="px-2 text-[--text-dim] hover:text-[--text-secondary] text-xs"
            title={bottomOpen ? "Collapse" : "Expand"}
          >
            {bottomOpen ? "▼" : "▲"}
          </button>
          <button
            onClick={() => { setBottomTab("clusters"); setBottomOpen(true); }}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
              bottomTab === "clusters"
                ? "text-accent-blue"
                : "text-[--text-dim] hover:text-[--text-secondary]"
            }`}
          >
            Clusters
          </button>
          <button
            onClick={() => { setBottomTab("emotions"); setBottomOpen(true); }}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
              bottomTab === "emotions"
                ? "text-accent-blue"
                : "text-[--text-dim] hover:text-[--text-secondary]"
            }`}
          >
            Emotions
          </button>
        </div>

        {/* Bottom content */}
        {bottomOpen && (
          <div className="h-[calc(100%-32px)] overflow-auto">
            {bottomTab === "clusters" ? <ClusterMap /> : <EmotionRadar />}
          </div>
        )}
      </div>
    </div>
  );
}
